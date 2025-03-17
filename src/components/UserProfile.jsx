import React, { useState, useEffect } from "react";
import { database } from "../services/firebase";
import { ref, onValue } from "firebase/database";
import { logoutUser } from "../services/firebase";

const UserProfile = ({ user }) => {
	const [reservationDetails, setReservationDetails] = useState(null);
	const [userData, setUserData] = useState(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		if (!user) {
			setIsLoading(false);
			return;
		}

		// Fetch reservation details
		const currentResRef = ref(
			database,
			`users/${user.uid}/profile/currentReservation`
		);
		const unsubscribeRes = onValue(
			currentResRef,
			(snapshot) => {
				if (snapshot.exists()) {
					setReservationDetails(snapshot.val());
				} else {
					setReservationDetails(null);
				}
				setIsLoading(false);
			},
			(error) => {
				console.error("Error fetching reservation details:", error);
				setIsLoading(false);
			}
		);

		// Fetch user profile data (e.g., guest registration data)
		const userRef = ref(database, `users/${user.uid}`);
		const unsubscribeUser = onValue(userRef, (snapshot) => {
			if (snapshot.exists()) {
				setUserData(snapshot.val());
			}
		});

		return () => {
			unsubscribeRes();
			unsubscribeUser();
		};
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
				Welcome, {(userData && userData.name) || user.displayName || "Guest"}
			</h2>

			<div className="space-y-2 mb-6">
				{reservationDetails ? (
					<div className="bg-green-100 border border-green-300 p-4 rounded">
						<h3 className="text-lg font-semibold mb-2">Reservation Details</h3>
						<p>
							<span className="font-medium">Session ID:</span>{" "}
							{reservationDetails.sessionId}
						</p>
						<p>
							<span className="font-medium">Event:</span>{" "}
							{reservationDetails.sessionEvent}
						</p>
						<p>
							<span className="font-medium">Date:</span>{" "}
							{reservationDetails.sessionDate}
						</p>
						<p>
							<span className="font-medium">Time:</span>{" "}
							{reservationDetails.sessionTime}
						</p>
						<p>
							<span className="font-medium">Team:</span>{" "}
							{reservationDetails.team}
						</p>
						<p>
							<span className="font-medium">Slot:</span>{" "}
							{reservationDetails.slotIndex + 1}
						</p>
						<p>
							<span className="font-medium">User-ID:</span>{" "}
							{reservationDetails.sessionuserID}
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
