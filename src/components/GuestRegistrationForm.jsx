import React, { useState } from "react";
import { loginAsGuest, saveUserLoginInfo } from "../services/firebase";
import { database } from "../services/firebase";
import { ref, set } from "firebase/database";
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

		// Validation checks
		if (!guestName || !guestAge || !guestContactNumber) {
			setError("Please fill in all fields");
			setIsLoading(false);
			return;
		}

		try {
			// Sign in anonymously
			const userCredential = await loginAsGuest();
			const user = userCredential.user;

			// Prepare guest user info
			const guestUserData = {
				name: guestName,
				age: guestAge,
				contactNumber: guestContactNumber,
				mobileNumber: guestContactNumber,
				isGuest: true,
			};

			// Save user login info
			await saveUserLoginInfo(user, guestUserData);

			// Save password securely in the database
			const passwordRef = ref(database, `users/${user.uid}/credentials`);
			await set(passwordRef, {
				mobileNumber: guestContactNumber,
				password: guestPassword, // In a real-world scenario, this should be hashed
			});

			// Set registration complete to trigger state change
			setRegistrationComplete(true);
		} catch (error) {
			setError(error.message || "Guest registration failed");
			setIsLoading(false);
		}
	};

	// If registration is complete, return null to allow parent component to handle
	if (registrationComplete) {
		return null;
	}

	return (
		<div className="bg-white p-6 rounded-lg shadow-md">
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
						className="w-full p-2 border border-gray-300 rounded"
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
						className="w-full p-2 border border-gray-300 rounded"
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
						type="tel"
						value={guestContactNumber}
						onChange={(e) => setGuestContactNumber(e.target.value)}
						placeholder="Contact Number"
						required
						className="w-full p-2 border border-gray-300 rounded"
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
				<p>*Note: Continuing as guest means you are needed to take note of your user-id</p>
			</div>
		</div>
	);
};

export default GuestRegistrationForm;