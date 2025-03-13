import React, { useState, useEffect } from "react";
import { auth } from "../services/firebase";
import { onAuthStateChanged } from "firebase/auth";
import SessionService from "../services/SessionService";
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
	const [refreshing, setRefreshing] = useState(false);


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
		return () => unsubscribe();
	}, []);

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

	const handleRefreshSessions = async () => {
		if (!user) return;

		try {
			setRefreshing(true);
			setAuthError(null);
			const activeSessions = await SessionService.fetchActiveSessions();
			setSessionsList(activeSessions);
		} catch (error) {
			console.error("Failed to refresh sessions:", error);
			setAuthError("Failed to refresh sessions. Please try again.");
		} finally {
			setRefreshing(false);
		}
	};

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


	if (showGuestForm) {
		return (
			<div className="max-w-md mx-auto my-8">
				<AuthErrorDisplay />
				<GuestRegistrationForm onCancel={() => setShowGuestForm(false)} />
			</div>
		);
	}


	if (user && !selectedSession) {
		return (
			<div className="max-w-md mx-auto my-8">
				<AuthErrorDisplay />
				<div className="bg-white p-6 rounded-lg shadow-md">
					<div className="flex justify-between items-center mb-6">
						<h2 className="text-2xl font-bold text-gray-800">Select Session</h2>
						<button
							onClick={handleRefreshSessions}
							disabled={refreshing}
							className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded flex items-center">
							{refreshing ? (
								<>
									<svg
										className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24">
										<circle
											className="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											strokeWidth="4"></circle>
										<path
											className="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
									</svg>
									Refreshing...
								</>
							) : (
								<>
									<svg
										className="w-4 h-4 mr-1"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										xmlns="http://www.w3.org/2000/svg">
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
									</svg>
									Refresh Sessions
								</>
							)}
						</button>
					</div>

					<div className="space-y-4">
						{sessionsList.length > 0 ? (
							sessionsList.map((session) => {
								const dateObj = new Date(session.date);
								const isValidDate = !isNaN(dateObj.getTime());
								const formattedDate = isValidDate
									? dateObj.toLocaleDateString("en-US", {
											month: "long",
											day: "numeric",
											year: "numeric",
									  })
									: session.date;
								const formattedTime = isValidDate
									? dateObj.toLocaleTimeString("en-US", {
											hour: "numeric",
											minute: "2-digit",
									  })
									: session.time;
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
							<div className="text-center text-gray-600 py-4">
								<p>No active sessions available</p>
								<button
									onClick={handleRefreshSessions}
									className="text-blue-500 hover:text-blue-700 underline mt-2">
									Click to refresh
								</button>
							</div>
						)}
					</div>
					<div className="mt-4">
						<UserProfile user={user} />
					</div>
				</div>
			</div>
		);
	}

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
