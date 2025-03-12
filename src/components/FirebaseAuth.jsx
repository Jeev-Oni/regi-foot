import React, { useState, useEffect } from "react";
import { auth } from "../services/firebase";
import { onAuthStateChanged } from "firebase/auth";
import SessionService from "../services/SessionService";

// Import components
import SocialLogins from "./SocialLogins";
import GuestRegistrationForm from "./GuestRegistrationForm";
import UserProfile from "./UserProfile";
import TeamReservationSlots from "./TeamReservationSlots";

const FirebaseAuth = () => {
	const [user, setUser] = useState(null);
	const [showGuestForm, setShowGuestForm] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [sessionsList, setSessionsList] = useState([]);
	const [selectedSession, setSelectedSession] = useState(null);
	const [authError, setAuthError] = useState(null);

	// Listen for auth state changes
	useEffect(() => {
		const unsubscribe = onAuthStateChanged(
			auth,
			(currentUser) => {
				console.log("Auth State Changed - Current User:", currentUser);
				setUser(currentUser);
				setIsLoading(false);

				if (currentUser) {
					setShowGuestForm(false);
					setAuthError(null);
				}
			},
			(error) => {
				console.error("Authentication Error:", error);
				setAuthError(error.message);
				setIsLoading(false);
			}
		);

		// Cleanup subscription
		return () => unsubscribe();
	}, []);

	// Fetch available sessions
	useEffect(() => {
		const fetchAvailableSessions = async () => {
			if (user) {
				try {
					const activeSessions = await SessionService.fetchActiveSessions();
					setSessionsList(activeSessions);
				} catch (error) {
					console.error("Failed to fetch sessions:", error);
					setAuthError("Failed to load available sessions. Please try again.");
				}
			}
		};

		fetchAvailableSessions();
	}, [user]);

	const handleSessionSelect = (session) => {
		setSelectedSession(session);
	};

	const handleBackToSessions = () => {
		setSelectedSession(null);
	};

	// Error display component
	const AuthErrorDisplay = () => {
		if (!authError) return null;
		return (
			<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
				<span className="block sm:inline">{authError}</span>
			</div>
		);
	};

	if (isLoading) {
		return (
			<div className="flex justify-center items-center h-screen">
				<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
			</div>
		);
	}

	// Guest registration flow
	if (showGuestForm) {
		return (
			<div className="max-w-md mx-auto my-8">
				<AuthErrorDisplay />
				<GuestRegistrationForm onCancel={() => setShowGuestForm(false)} />
			</div>
		);
	}

	// User profile flow
	if (user && !selectedSession) {
		return (
			<div className="max-w-md mx-auto my-8">
				<AuthErrorDisplay />
				<div className="bg-white p-6 rounded-lg shadow-md">
					<h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
						Select Session
					</h2>
					<div className="space-y-4">
						{sessionsList.length > 0 ? (
							sessionsList.map((session) => {
								// 1) Parse the date string from Firebase (if it’s in ISO format)
								const dateObj = new Date(session.date);
								const isValidDate = !isNaN(dateObj.getTime());

								// 2) Format the date: "March 12, 2025"
								const formattedDate = isValidDate
									? dateObj.toLocaleDateString("en-US", {
											month: "long",
											day: "numeric",
											year: "numeric",
									  })
									: session.date; // fallback if not valid

								// 3) Format the time: "8:19 PM"
								const formattedTime = isValidDate
									? dateObj.toLocaleTimeString("en-US", {
											hour: "numeric",
											minute: "2-digit",
									  })
									: session.time;

								// 4) Build a nice label:
								//    Use session.time if it’s not "Not specified", else use formattedTime
								let finalTime =
									session.time && session.time !== "Not specified"
										? session.time
										: formattedTime;

								const buttonLabel = `${session.event} - ${formattedDate} @ ${finalTime}`;

								return (
									<button
										key={session.id}
										onClick={() => handleSessionSelect(session)}
										className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
										{buttonLabel}
									</button>
								);
							})
						) : (
							<p className="text-center text-gray-600">
								No active sessions available
							</p>
						)}
					</div>
					<div className="mt-4">
						<UserProfile user={user} />
					</div>
				</div>
			</div>
		);
	}

	// Reservation slots flow
	if (user && selectedSession) {
		return (
			<div className="max-w-md mx-auto my-8">
				<TeamReservationSlots
					user={user}
					selectedSession={selectedSession}
					onBack={handleBackToSessions}
				/>
			</div>
		);
	}

	// Login flow
	return (
		<div className="max-w-md mx-auto my-8">
			<AuthErrorDisplay />
			<div className="bg-white p-6 rounded-lg shadow-md">
				<h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
					FOOTBALL LIPA APPOINTMENT SYSTEM
				</h2>
				<h3 className="text-lg font-medium text-center text-gray-600 mb-6">
					LOG IN
				</h3>

				<SocialLogins onGuestClick={() => setShowGuestForm(true)} />
			</div>
		</div>
	);
};

export default FirebaseAuth;
