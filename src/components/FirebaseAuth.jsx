// File: src/components/firebase/FirebaseAuth.jsx
import React, { useState, useEffect } from "react";
import { auth } from "../services/firebase";
import { onAuthStateChanged } from "firebase/auth";

// Import components
import EmailLoginForm from "./EmailLoginForm";
import SocialLogins from "./SocialLogins";
import GuestRegistrationForm from "./GuestRegistrationForm";
import UserProfile from "./UserProfile";

const FirebaseAuth = () => {
	const [user, setUser] = useState(null);
	const [showGuestForm, setShowGuestForm] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	// Listen for auth state changes
	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
			setUser(currentUser);
			setIsLoading(false);
		});

		// Cleanup subscription
		return () => unsubscribe();
	}, []);

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
				<GuestRegistrationForm onCancel={() => setShowGuestForm(false)} />
			</div>
		);
	}

	if (user) {
		return (
			<div className="max-w-md mx-auto my-8">
				<UserProfile user={user} />
			</div>
		);
	}

	return (
		<div className="max-w-md mx-auto my-8">
			<div className="bg-white p-6 rounded-lg shadow-md">
				<h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
					FOOTBALL LIPA APPOINTMENT SYSTEM
				</h2>
				<h3 className="text-lg font-medium text-center text-gray-600 mb-6">
					LOG IN
				</h3>

				<EmailLoginForm />
				<SocialLogins onGuestClick={() => setShowGuestForm(true)} />
			</div>
		</div>
	);
};

export default FirebaseAuth;
