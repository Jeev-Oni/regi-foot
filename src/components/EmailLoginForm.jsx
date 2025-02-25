// File: src/components/firebase/EmailLoginForm.jsx
import React, { useState } from "react";
import {
	loginWithEmail,
	signupWithEmail,
	saveUserLoginInfo,
} from "../services/firebase";
import ErrorMessage from "./ErrorMessage";

const EmailLoginForm = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const handleEmailLogin = async (e) => {
		e.preventDefault();
		setIsLoading(true);
		setError("");

		try {
			const userCredential = await loginWithEmail(email, password);
			await saveUserLoginInfo(userCredential.user);
		} catch (error) {
			setError(error.message);
			setIsLoading(false);
		}
	};

	const handleSignup = async () => {
		setIsLoading(true);
		setError("");

		try {
			const userCredential = await signupWithEmail(email, password);
			await saveUserLoginInfo(userCredential.user);
		} catch (error) {
			setError(error.message);
			setIsLoading(false);
		}
	};

	return (
		<>
			<ErrorMessage message={error} />

			<form onSubmit={handleEmailLogin} className="space-y-4">
				<div>
					<input
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder="Email Address"
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
				<div className="flex space-x-4">
					<button
						type="submit"
						disabled={isLoading}
						className="w-1/2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50">
						{isLoading ? "Logging in..." : "Login Now"}
					</button>
					<button
						type="button"
						onClick={handleSignup}
						disabled={isLoading}
						className="w-1/2 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50">
						{isLoading ? "Signing up..." : "Sign Up"}
					</button>
				</div>
			</form>
		</>
	);
};

export default EmailLoginForm;
