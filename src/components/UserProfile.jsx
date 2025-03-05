import React, { useState, useEffect } from "react";
import { database } from "../services/firebase";
import { ref, get } from "firebase/database";
import { logoutUser } from "../services/firebase";

const UserProfile = ({ user }) => {
	const [reservationDetails, setReservationDetails] = useState(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchReservationDetails = async () => {
			try {
				// Fetch the most recent session reservation for this user
				const sessionsRef = ref(database, "sessions");
				const sessionsSnapshot = await get(sessionsRef);

				if (sessionsSnapshot.exists()) {
					const sessions = sessionsSnapshot.val();

					// Iterate through sessions to find user's reservation
					for (const sessionKey in sessions) {
						const session = sessions[sessionKey];

						for (const teamKey in session) {
							if (teamKey !== "totalSlots") {
								const team = session[teamKey];

								if (team.slots) {
									const userSlot = team.slots.find(
										(slot) => slot && slot.userId === user.uid
									);

									if (userSlot) {
										setReservationDetails({
											name: userSlot.userName || "Guest",
											session: sessionKey.replace(/-/g, " "),
											team: teamKey,
											slot: team.slots.indexOf(userSlot) + 1,
											uid: user.uid,
										});
										break;
									}
								}
							}
						}
					}
				}
			} catch (error) {
				console.error("Error fetching reservation details:", error);
			} finally {
				setIsLoading(false);
			}
		};

		if (user) {
			fetchReservationDetails();
		}
	}, [user]);

	const handleLogout = async () => {
		try {
			await logoutUser();
		} catch (error) {
			console.error("Logout error:", error);
		}
	};

	if (isLoading) {
		return (
			<div className="bg-white p-6 rounded-lg shadow-md">
				<div className="animate-pulse">
					<div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
					<div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
				</div>
			</div>
		);
	}

	return (
		<div className="bg-white p-6 rounded-lg shadow-md">
			<h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
				Welcome, {user.displayName || "Guest"}
			</h2>

			<div className="space-y-2 mb-6">
				{reservationDetails ? (
					<div className="bg-green-100 border border-green-300 p-4 rounded">
						<h3 className="text-lg font-semibold mb-2">Reservation Details</h3>
						<p>
							<span className="font-medium">Name:</span>{" "}
							{reservationDetails.name}
						</p>
						<p>
							<span className="font-medium">Session:</span>{" "}
							{reservationDetails.session}
						</p>
						<p>
							<span className="font-medium">Team:</span>{" "}
							{reservationDetails.team}
						</p>
						<p>
							<span className="font-medium">Slot:</span>{" "}
							{reservationDetails.slot}
						</p>
						<p>
							<span className="font-medium">UID:</span> {reservationDetails.uid}
						</p>
					</div>
				) : (
					<div className="bg-yellow-100 border border-yellow-300 p-4 rounded">
						<p>No active reservations</p>
					</div>
				)}

				<p className="text-gray-700 mt-4">
					<span className="font-medium">Email:</span>{" "}
					{user.email || "Anonymous User"}
				</p>
			</div>

			<button
				onClick={handleLogout}
				className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
				Logout
			</button>
		</div>
	);
};

export default UserProfile;
