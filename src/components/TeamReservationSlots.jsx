import React, { useState, useEffect } from "react";
import { database } from "../services/firebase";
import { ref, get, update, remove, serverTimestamp } from "firebase/database";

// Inline Error Message Component
const ErrorMessage = ({ message }) => {
	if (!message) return null;

	return (
		<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
			<span className="block sm:inline">{message}</span>
		</div>
	);
};

const TeamReservationSlots = ({ user, selectedSession, onBack }) => {
	const teams = ["Team A", "Team B", "Team C"];
	const [teamSlots, setTeamSlots] = useState({
		"Team A": Array(9).fill(null),
		"Team B": Array(9).fill(null),
		"Team C": Array(9).fill(null),
	});
	const [teamPlayerCounts, setTeamPlayerCounts] = useState({
		"Team A": 0,
		"Team B": 0,
		"Team C": 0,
	});
	const [userReservation, setUserReservation] = useState(null);
	const [userName, setUserName] = useState("");
	const [error, setError] = useState("");
	const [successMessage, setSuccessMessage] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	// Fetch user profile and existing reservations
	useEffect(() => {
		const fetchUserProfileAndReservations = async () => {
			try {
				// Fetch user profile
				const userProfileRef = ref(database, `users/${user.uid}/profile`);
				const profileSnapshot = await get(userProfileRef);

				if (profileSnapshot.exists()) {
					const profileData = profileSnapshot.val();
					setUserName(profileData.name || user.displayName || "Guest");
				} else {
					setUserName(user.displayName || "Guest");
				}

				// Fetch session reservations
				const sessionPath = selectedSession.replace(/\s+/g, "-");
				const sessionRef = ref(database, `sessions/${sessionPath}`);
				const snapshot = await get(sessionRef);

				if (snapshot.exists()) {
					const reservedData = snapshot.val();
					const updatedTeamSlots = { ...teamSlots };
					const updatedTeamPlayerCounts = {
						"Team A": 0,
						"Team B": 0,
						"Team C": 0,
					};
					let userCurrentReservation = null;

					teams.forEach((team) => {
						if (reservedData[team]) {
							updatedTeamSlots[team] = updatedTeamSlots[team].map(
								(slot, index) => {
									const slotData =
										reservedData[team].slots && reservedData[team].slots[index]
											? {
													...reservedData[team].slots[index],
													reserved: true,
											  }
											: null;

									// Count reserved slots and find user's reservation
									if (slotData && slotData.reserved) {
										updatedTeamPlayerCounts[team]++;

										if (slotData.userId === user.uid) {
											userCurrentReservation = {
												team,
												slotIndex: index,
												slotData,
											};
										}
									}

									return slotData;
								}
							);
						}
					});

					setTeamSlots(updatedTeamSlots);
					setTeamPlayerCounts(updatedTeamPlayerCounts);
					setUserReservation(userCurrentReservation);
				}
			} catch (error) {
				setError("Failed to fetch reservations. Please try again.");
				console.error(error);
			}
		};

		if (selectedSession && user) {
			fetchUserProfileAndReservations();
		}
	}, [selectedSession, user]);

	const handleSlotSelection = async (team, slotIndex) => {
		// Clear previous messages
		setError("");
		setSuccessMessage("");

		// Check if user has already reserved a slot in any team
		if (userReservation) {
			setError("You have already reserved a slot in this session.");
			return;
		}

		// Check if slot is already reserved
		if (teamSlots[team][slotIndex]?.reserved) {
			setError("This slot is already reserved");
			return;
		}

		setIsLoading(true);

		try {
			// Prepare slot reservation data
			const slotData = {
				userId: user.uid,
				userName: userName, // Use the fetched user name
				reservedAt: serverTimestamp(),
				reserved: true,
			};

			// Reference to the specific session, team, and slot
			const sessionPath = selectedSession.replace(/\s+/g, "-");
			const slotRef = ref(
				database,
				`sessions/${sessionPath}/${team}/slots/${slotIndex}`
			);

			// Update the slot in the database
			await update(slotRef, slotData);

			// Update local state
			const updatedTeamSlots = { ...teamSlots };
			updatedTeamSlots[team][slotIndex] = slotData;

			// Update team player count
			const updatedTeamPlayerCounts = { ...teamPlayerCounts };
			updatedTeamPlayerCounts[team]++;

			setTeamSlots(updatedTeamSlots);
			setTeamPlayerCounts(updatedTeamPlayerCounts);
			setUserReservation({
				team,
				slotIndex,
				slotData,
			});
			setSuccessMessage(`Successfully reserved slot in ${team}`);
		} catch (error) {
			setError("Failed to reserve slot. Please try again.");
			console.error(error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleRemoveReservation = async () => {
		if (!userReservation) {
			setError("No reservation to remove");
			return;
		}

		setIsLoading(true);
		setError("");
		setSuccessMessage("");

		try {
			// Reference to the specific session, team, and slot
			const sessionPath = selectedSession.replace(/\s+/g, "-");
			const slotRef = ref(
				database,
				`sessions/${sessionPath}/${userReservation.team}/slots/${userReservation.slotIndex}`
			);

			// Remove the slot reservation from the database
			await remove(slotRef);

			// Update local state
			const updatedTeamSlots = { ...teamSlots };
			updatedTeamSlots[userReservation.team][userReservation.slotIndex] = null;

			// Update team player count
			const updatedTeamPlayerCounts = { ...teamPlayerCounts };
			updatedTeamPlayerCounts[userReservation.team]--;

			setTeamSlots(updatedTeamSlots);
			setTeamPlayerCounts(updatedTeamPlayerCounts);

			// Reset reservation
			setUserReservation(null);
			setSuccessMessage("Reservation removed successfully");
		} catch (error) {
			setError("Failed to remove reservation. Please try again.");
			console.error(error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="bg-white p-6 rounded-lg shadow-md">
			<div className="flex justify-between items-center mb-6">
				<button
					onClick={onBack}
					className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded">
					Back to Sessions
				</button>
				<h2 className="text-2xl font-bold text-center text-gray-800">
					Reservation for {selectedSession}
				</h2>
				<div></div>
			</div>

			{error && <ErrorMessage message={error} />}

			{successMessage && (
				<div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
					{successMessage}
				</div>
			)}

			{userReservation && (
				<div className="flex justify-between items-center bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
					<span>
						You ({userName}) have reserved a slot in {userReservation.team}
					</span>
					<button
						onClick={handleRemoveReservation}
						className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded">
						Remove Reservation
					</button>
				</div>
			)}

			{teams.map((team) => (
				<div key={team} className="mb-6">
					<div className="flex items-center mb-4">
						<h3 className="text-xl font-semibold text-gray-800">{team}</h3>
						<span className="ml-2 bg-red-600 text-white text-sm rounded-full px-2 py-1">
							{teamPlayerCounts[team]}/9
						</span>
					</div>
					<div className="grid grid-cols-3 gap-4">
						{teamSlots[team].map((slot, index) => (
							<button
								key={index}
								onClick={() => handleSlotSelection(team, index)}
								disabled={
									(slot?.reserved && slot?.userId !== user.uid) || isLoading
								}
								className={`p-4 rounded text-white font-bold truncate ${
									slot?.reserved
										? slot?.userId === user.uid
											? "bg-green-500 cursor-default"
											: "bg-gray-400 cursor-not-allowed"
										: "bg-red-600 hover:bg-red-700 active:bg-red-800"
								}`}>
								{slot?.reserved
									? slot.userName.length > 15
										? `${slot.userName.substring(0, 15)}...`
										: slot.userName
									: `Slot ${index + 1}`}
							</button>
						))}
					</div>
				</div>
			))}
		</div>
	);
};

export default TeamReservationSlots;
