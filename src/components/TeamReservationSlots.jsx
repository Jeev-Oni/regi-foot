import React, { useState, useEffect } from "react";
import { database } from "../services/firebase";
import { ref, get, update, remove, serverTimestamp } from "firebase/database";
import SessionService from "../services/SessionService";

const ErrorMessage = ({ message }) => {
	if (!message) return null;
	return (
		<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
			<span className="block sm:inline">{message}</span>
		</div>
	);
};

const TeamReservationSlots = ({ user, selectedSession, onBack }) => {
	const [teamSlots, setTeamSlots] = useState({});
	const [teamPlayerCounts, setTeamPlayerCounts] = useState({});
	const [userReservation, setUserReservation] = useState(null);
	const [userName, setUserName] = useState("");
	const [error, setError] = useState("");
	const [successMessage, setSuccessMessage] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const [sessionDetails, setSessionDetails] = useState(null);

	useEffect(() => {
		const fetchUserProfileAndReservations = async () => {
			try {
				// 1) Fetch user's display name
				const userProfileRef = ref(database, `users/${user.uid}/profile`);
				const profileSnapshot = await get(userProfileRef);
				if (profileSnapshot.exists()) {
					const profileData = profileSnapshot.val();
					setUserName(profileData.name || user.displayName || "Guest");
				} else {
					setUserName(user.displayName || "Guest");
				}

				// 2) Fetch session details
				const sessionData = await SessionService.getSessionDetails(
					selectedSession.id
				);
				setSessionDetails(sessionData);

				if (!sessionData.teams) {
					setTeamSlots({});
					setTeamPlayerCounts({});
					setUserReservation(null);
					return;
				}

				// 3) Build out all team slots and record any reservations by this user
				const updatedTeamSlots = {};
				const updatedTeamPlayerCounts = {};
				const foundReservations = [];

				const teams = Object.keys(sessionData.teams);
				for (const team of teams) {
					const teamData = sessionData.teams[team];
					const totalSlots = teamData.slotCount || 8;

					updatedTeamPlayerCounts[team] = 0;

					// Ensure we're getting the slots object properly
					const teamSlots = teamData.slots || {};
					let slotsArray = Array(totalSlots).fill(null);

					// If slots is an array, convert to our null-filled array
					if (Array.isArray(teamData.slots)) {
						for (
							let i = 0;
							i < Math.min(teamData.slots.length, totalSlots);
							i++
						) {
							slotsArray[i] = teamData.slots[i];
						}
					}
					// If slots is an object with numbered keys
					else if (
						typeof teamData.slots === "object" &&
						teamData.slots !== null
					) {
						Object.keys(teamData.slots).forEach((slotKey) => {
							const index = parseInt(slotKey, 10);
							if (!isNaN(index) && index >= 0 && index < totalSlots) {
								slotsArray[index] = teamData.slots[slotKey];
							}
						});
					}

					updatedTeamSlots[team] = slotsArray.map((slot, index) => {
						if (slot) {
							updatedTeamPlayerCounts[team]++;
							if (slot.userId === user.uid) {
								foundReservations.push({ team, slotIndex: index, slot });
							}
							return { ...slot, reserved: true };
						}
						return null;
					});
				}

				// 4) If the user has multiple reservations across teams, keep the first & remove the rest
				if (foundReservations.length > 0) {
					const primary = foundReservations[0];
					setUserReservation({
						team: primary.team,
						slotIndex: primary.slotIndex,
						slotData: primary.slot,
					});
					if (foundReservations.length > 1) {
						for (let i = 1; i < foundReservations.length; i++) {
							const dup = foundReservations[i];
							const dupRef = ref(
								database,
								`sessions/${selectedSession.id}/teams/${dup.team}/slots/${dup.slotIndex}`
							);
							await remove(dupRef);
						}
					}
				} else {
					setUserReservation(null);
				}

				setTeamSlots(updatedTeamSlots);
				setTeamPlayerCounts(updatedTeamPlayerCounts);

				// 5) Also verify currentReservation in user profile matches what we found
				const currentResRef = ref(
					database,
					`users/${user.uid}/profile/currentReservation`
				);
				const currentResSnapshot = await get(currentResRef);

				if (currentResSnapshot.exists()) {
					const profileReservation = currentResSnapshot.val();

					// If we found a reservation but the profile has different information
					if (
						foundReservations.length > 0 &&
						(profileReservation.team !== foundReservations[0].team ||
							profileReservation.slotIndex !== foundReservations[0].slotIndex ||
							profileReservation.sessionId !== selectedSession.id)
					) {
						// Update profile to match the actual reservation we found
						await update(currentResRef, {
							team: foundReservations[0].team,
							slotIndex: foundReservations[0].slotIndex,
							sessionId: selectedSession.id,
							sessionEvent: sessionDetails?.event || "Football Session",
							sessionDate: sessionDetails?.date || "",
							sessionTime: sessionDetails?.time || "",
							sessionuserID: user.uid,
							reservedAt: serverTimestamp(),
						});
					}
					// If profile has reservation in this session but we didn't find one in team slots
					else if (
						foundReservations.length === 0 &&
						profileReservation.sessionId === selectedSession.id
					) {
						// Remove incorrect profile reservation
						await remove(currentResRef);
					}
					// If we found a reservation in current session but profile has reservation in different session
					else if (
						foundReservations.length > 0 &&
						profileReservation.sessionId !== selectedSession.id
					) {
						// Update profile to match the actual reservation we found
						await update(currentResRef, {
							team: foundReservations[0].team,
							slotIndex: foundReservations[0].slotIndex,
							sessionId: selectedSession.id,
							sessionEvent: sessionDetails?.event || "Football Session",
							sessionDate: sessionDetails?.date || "",
							sessionTime: sessionDetails?.time || "",
							sessionuserID: user.uid,
							reservedAt: serverTimestamp(),
						});
					}
				} else if (foundReservations.length > 0) {
					// If we found a reservation but no profile record exists, create one
					await update(currentResRef, {
						team: foundReservations[0].team,
						slotIndex: foundReservations[0].slotIndex,
						sessionId: selectedSession.id,
						sessionEvent: sessionDetails?.event || "Football Session",
						sessionDate: sessionDetails?.date || "",
						sessionTime: sessionDetails?.time || "",
						sessionuserID: user.uid,
						reservedAt: serverTimestamp(),
					});
				}
			} catch (err) {
				console.error("Error fetching data:", err);
				setError("Failed to load session data. Please try again.");
			} finally {
				setIsLoading(false);
			}
		};

		if (user && selectedSession) {
			fetchUserProfileAndReservations();
		}
	}, [user, selectedSession]);

	// Reserve a slot
	const handleSlotSelection = async (team, slotIndex) => {
		setError("");
		setSuccessMessage("");

		// Check if user already has a reservation anywhere
		if (userReservation) {
			setError(
				"You already have a reservation in this session. Remove it first."
			);
			return;
		}

		// Check if the slot index is valid for this team
		if (
			!teamSlots[team] ||
			slotIndex < 0 ||
			slotIndex >= teamSlots[team].length
		) {
			setError("Invalid slot selected.");
			return;
		}

		// Check if this slot is already taken
		if (teamSlots[team][slotIndex]?.reserved) {
			setError("This slot is already reserved.");
			return;
		}

		setIsLoading(true);
		try {
			// IMPORTANT: First check if user already has ANY reservation in ANY team
			// This is an extra safeguard beyond the userReservation state check
			const userProfileRef = ref(
				database,
				`users/${user.uid}/profile/currentReservation`
			);
			const profileSnapshot = await get(userProfileRef);

			if (profileSnapshot.exists()) {
				// User already has a reservation somewhere, handle this case
				const existingReservation = profileSnapshot.val();
				setError(
					`You already have a reservation in ${
						existingReservation.team
					}, slot ${existingReservation.slotIndex + 1}. Remove it first.`
				);
				setIsLoading(false);
				return;
			}

			const slotData = {
				userId: user.uid,
				userName,
				reservedAt: serverTimestamp(),
				reserved: true,
			};

			// First update the database
			const slotRef = ref(
				database,
				`sessions/${selectedSession.id}/teams/${team}/slots/${slotIndex}`
			);
			await update(slotRef, slotData);

			// Update local state
			const updatedTeamSlots = { ...teamSlots };
			updatedTeamSlots[team][slotIndex] = slotData;
			const updatedTeamPlayerCounts = { ...teamPlayerCounts };
			updatedTeamPlayerCounts[team]++;

			setTeamSlots(updatedTeamSlots);
			setTeamPlayerCounts(updatedTeamPlayerCounts);

			const newReservation = { team, slotIndex, slotData };
			setUserReservation(newReservation);

			// Also store in user's profile under currentReservation
			await update(userProfileRef, {
				sessionId: selectedSession.id,
				sessionEvent: sessionDetails?.event || "Football Session",
				sessionDate: sessionDetails?.date || "",
				sessionTime: sessionDetails?.time || "",
				team,
				slotIndex,
				sessionuserID: user.uid,
				reservedAt: serverTimestamp(),
			});

			setSuccessMessage(
				`Successfully reserved slot ${slotIndex + 1} in ${team}`
			);
		} catch (err) {
			console.error("Error reserving slot:", err);
			setError("Failed to reserve slot. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	// Remove the user's reservation
	const handleRemoveReservation = async () => {
		if (!userReservation) {
			setError("No reservation to remove.");
			return;
		}

		setIsLoading(true);
		setError("");
		setSuccessMessage("");

		try {
			const slotRef = ref(
				database,
				`sessions/${selectedSession.id}/teams/${userReservation.team}/slots/${userReservation.slotIndex}`
			);
			await remove(slotRef);

			const updatedTeamSlots = { ...teamSlots };
			updatedTeamSlots[userReservation.team][userReservation.slotIndex] = null;
			const updatedTeamPlayerCounts = { ...teamPlayerCounts };
			updatedTeamPlayerCounts[userReservation.team]--;

			setTeamSlots(updatedTeamSlots);
			setTeamPlayerCounts(updatedTeamPlayerCounts);
			setUserReservation(null);

			const userProfileRef = ref(
				database,
				`users/${user.uid}/profile/currentReservation`
			);
			await remove(userProfileRef);

			setSuccessMessage("Reservation removed successfully.");
		} catch (err) {
			console.error("Error removing reservation:", err);
			setError("Failed to remove reservation. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	if (isLoading) {
		return (
			<div className="bg-white p-6 rounded-lg shadow-md">
				<div className="flex justify-center">
					<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
				</div>
			</div>
		);
	}

	const teams =
		sessionDetails && sessionDetails.teams
			? Object.keys(sessionDetails.teams)
			: [];

	return (
		<div className="bg-white p-6 rounded-lg shadow-md">
			<div className="flex justify-between items-center mb-6">
				<button
					onClick={onBack}
					className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded">
					Back to Sessions
				</button>
				<h2 className="text-xl font-bold text-center text-gray-800">
					{sessionDetails?.event || "Session"} - {sessionDetails?.date || ""}
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
						You ({userName}) have reserved slot {userReservation.slotIndex + 1}{" "}
						in {userReservation.team}
					</span>
					<button
						onClick={handleRemoveReservation}
						className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded">
						Remove Reservation
					</button>
				</div>
			)}

			{teams.length > 0 ? (
				teams.map((team) => (
					<div key={team} className="mb-6">
						<div className="flex items-center mb-4">
							<h3 className="text-xl font-semibold text-gray-800">{team}</h3>
							<span className="ml-2 bg-red-600 text-white text-sm rounded-full px-2 py-1">
								{teamPlayerCounts[team] || 0}/{teamSlots[team]?.length || 0}
							</span>
						</div>
						<div className="grid grid-cols-3 gap-4">
							{teamSlots[team]?.map((slot, index) => (
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
				))
			) : (
				<div className="text-center py-4 text-gray-600">
					No team slots found for this session
				</div>
			)}
		</div>
	);
};

export default TeamReservationSlots;
