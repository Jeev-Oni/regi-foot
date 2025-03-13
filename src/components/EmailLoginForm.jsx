import React, { useState } from "react";
import { loginWithMobileNumber, saveUserLoginInfo } from "../services/firebase";
import ErrorMessage from "./ErrorMessage";

const EmailLoginForm = () => {
	const [mobileNumber, setMobileNumber] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const handleMobileLogin = async (e) => {
		e.preventDefault();
		setIsLoading(true);
		setError("");

		try {
			const userCredential = await loginWithMobileNumber(
				mobileNumber,
				password
			);
			await saveUserLoginInfo(userCredential.user);

			
			setIsLoading(false);
		} catch (error) {
			setError(error.message);
			setIsLoading(false);
		}
	};

	return (
		<>
			<ErrorMessage message={error} />

			<form onSubmit={handleMobileLogin} className="space-y-4">
				<div>
					<input
						type="tel"
						value={mobileNumber}
						onChange={(e) => setMobileNumber(e.target.value)}
						placeholder="Mobile Number"
						required
						className="w-full p-2 border border-gray-300 rounded"
					/>
				</div>
				<div>
					<input
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder="Password"
						required
						className="w-full p-2 border border-gray-300 rounded"
					/>
				</div>
				<button
					type="submit"
					disabled={isLoading}
					className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50">
					{isLoading ? "Logging in..." : "Login Now"}
				</button>
			</form>
		</>
	);
};

export default EmailLoginForm;
