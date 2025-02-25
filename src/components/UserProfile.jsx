// File: src/components/firebase/UserProfile.jsx
import React from "react";
import { logoutUser } from "../services/firebase";

const UserProfile = ({ user }) => {
	const handleLogout = async () => {
		try {
			await logoutUser();
		} catch (error) {
			console.error("Logout error:", error);
		}
	};

	return (
		<div className="bg-white p-6 rounded-lg shadow-md">
			<h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
				Welcome, {user.displayName || "Guest"}
			</h2>

			<div className="space-y-2 mb-6">
				<p className="text-gray-700">
					<span className="font-medium">Email:</span>{" "}
					{user.email || "Anonymous User"}
				</p>
				<p className="text-gray-700">
					<span className="font-medium">User ID:</span> {user.uid}
				</p>
				<p className="text-gray-700">
					<span className="font-medium">Provider:</span>{" "}
					{user.isAnonymous ? "Guest" : user.providerData[0]?.providerId}
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
