import React, { useState, useEffect } from "react";
import { auth } from "../services/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { availableSessions } from "./FirebaseConfig";

// Import components
import SocialLogins from "./SocialLogins";
import GuestRegistrationForm from "./GuestRegistrationForm";
import UserProfile from "./UserProfile";
import TeamReservationSlots from "../components/TeamReservationSlots";

const FirebaseAuth = () => {
	const [user, setUser] = useState(null);
	const [showGuestForm, setShowGuestForm] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
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
						{availableSessions.map((session, index) => (
							<button
								key={index}
								onClick={() => setSelectedSession(session)}
								className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
								{session}
							</button>
						))}
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
