import React, { useState } from "react";
import { loginAsGuest, saveUserLoginInfo } from "../services/firebase";
import { database } from "../services/firebase";
import { ref, set } from "firebase/database";
import { updateProfile } from "firebase/auth";
import ErrorMessage from "./ErrorMessage";

const GuestRegistrationForm = ({ onCancel }) => {
	const [guestName, setGuestName] = useState("");
	const [guestAge, setGuestAge] = useState("");
	const [guestContactNumber, setGuestContactNumber] = useState("");
	const [guestPassword, setGuestPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [registrationComplete, setRegistrationComplete] = useState(false);

	const handleGuestFormSubmit = async (e) => {
		e.preventDefault();
		setIsLoading(true);
		setError("");

		if (!guestName || !guestAge || !guestContactNumber) {
			setError("Please fill in all fields");
			setIsLoading(false);
			return;
		}

		try {
			const userCredential = await loginAsGuest();
			const user = userCredential.user;

			// Update the user's display name to the guest's name
			await updateProfile(user, { displayName: guestName });

			const guestUserData = {
				name: guestName,
				age: guestAge,
				contactNumber: guestContactNumber,
				mobileNumber: guestContactNumber,
				isGuest: true,
			};

			await saveUserLoginInfo(user, guestUserData);

			const passwordRef = ref(database, `users/${user.uid}/credentials`);
			await set(passwordRef, {
				mobileNumber: guestContactNumber,
				password: guestPassword,
			});

			setRegistrationComplete(true);
		} catch (error) {
			setError(error.message || "Guest registration failed");
			setIsLoading(false);
		}
	};

	if (registrationComplete) {
		return null;
	}

	return (
		<div className="min-h-screen inset-0 flex items-center justify-center">
			<div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
				<h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
					Guest Registration
				</h2>

				<ErrorMessage message={error} />

				<form onSubmit={handleGuestFormSubmit} className="space-y-4">
					<div>
						<label
							htmlFor="guestName"
							className="block text-sm font-medium text-gray-700 mb-1">
							Full Name
						</label>
						<input
							id="guestName"
							type="text"
							value={guestName}
							onChange={(e) => setGuestName(e.target.value)}
							placeholder="Full Name"
							required
							className="w-full bg-transparent border-b-2 border-gray-400 focus:border-gray-900 outline-none text-gray-800 placeholder-gray-500 p-2"
						/>
					</div>

					<div>
						<label
							htmlFor="guestAge"
							className="block text-sm font-medium text-gray-700 mb-1">
							Age
						</label>
						<input
							id="guestAge"
							type="number"
							value={guestAge}
							onChange={(e) => setGuestAge(e.target.value)}
							placeholder="Age"
							min="5"
							max="100"
							required
							className="w-full bg-transparent border-b-2 border-gray-400 focus:border-gray-900 outline-none text-gray-800 placeholder-gray-500 p-2"
						/>
					</div>

					<div>
						<label
							htmlFor="guestContactNumber"
							className="block text-sm font-medium text-gray-700 mb-1">
							Contact Number
						</label>
						<input
							id="guestContactNumber"
							type="number"
							value={guestContactNumber}
							onChange={(e) => setGuestContactNumber(e.target.value)}
							placeholder="Contact Number"
							required
							className="w-full bg-transparent border-b-2 border-gray-400 focus:border-gray-900 outline-none text-gray-800 placeholder-gray-500 p-2"
						/>
					</div>

					<div className="flex space-x-4 pt-2">
						<button
							type="submit"
							disabled={isLoading}
							className="w-1/2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50">
							{isLoading ? "Processing..." : "Register"}
						</button>
						<button
							type="button"
							onClick={onCancel}
							className="w-1/2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded">
							Cancel
						</button>
					</div>
				</form>

				<div className="mt-4 text-sm text-gray-600 italic">
					<p>
						*Note: Continuing as guest means you are needed to take note of your
						user-id
					</p>
				</div>
			</div>
		</div>
	);
};

export default GuestRegistrationForm;
