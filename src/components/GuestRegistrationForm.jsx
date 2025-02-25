// File: src/components/firebase/GuestRegistrationForm.jsx
import React, { useState } from "react";
import { loginAsGuest, saveUserLoginInfo } from "../services/firebase";
import { availableSessions } from "./FirebaseConfig";
import ErrorMessage from "./ErrorMessage";

const GuestRegistrationForm = ({ onCancel }) => {
	const [guestName, setGuestName] = useState("");
	const [guestAge, setGuestAge] = useState("");
	const [guestTimeframe, setGuestTimeframe] = useState("");
	const [guestContactNumber, setGuestContactNumber] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const handleGuestFormSubmit = async (e) => {
		e.preventDefault();
		setIsLoading(true);
		setError("");

		if (!guestName || !guestAge || !guestTimeframe || !guestContactNumber) {
			setError("Please fill in all fields");
			setIsLoading(false);
			return;
		}

		try {
			// Sign in anonymously
			const userCredential = await loginAsGuest();

			// Save guest user info to database
			await saveUserLoginInfo(userCredential.user, {
				name: guestName,
				age: guestAge,
				timeframe: guestTimeframe,
				contactNumber: guestContactNumber,
				isGuest: true,
			});
		} catch (error) {
			setError(error.message);
			setIsLoading(false);
		}
	};

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

				<div>
					<label
						htmlFor="guestTimeframe"
						className="block text-sm font-medium text-gray-700 mb-1">
						Session Schedule
					</label>
					<select
						id="guestTimeframe"
						value={guestTimeframe}
						onChange={(e) => setGuestTimeframe(e.target.value)}
						required
						className="w-full p-2 border border-gray-300 rounded">
						<option value="">Select a session</option>
						{availableSessions.map((session, index) => (
							<option key={index} value={session}>
								{session}
							</option>
						))}
					</select>
				</div>

				<div className="flex space-x-4 pt-2">
					<button
						type="submit"
						disabled={isLoading}
						className="w-1/2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50">
						{isLoading ? "Processing..." : "Confirm Information"}
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
					*Note: On-site registration is first come, first served and is subject
					to session capacity.
				</p>
			</div>
		</div>
	);
};

export default GuestRegistrationForm;
