import React, { useState } from "react";
import { loginWithGoogle, saveUserLoginInfo } from "../services/firebase";

const SocialLogins = ({ onGuestClick }) => {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");

	const handleGoogleLogin = async () => {
		setIsLoading(true);
		setError("");

		try {
			const userCredential = await loginWithGoogle();
			await saveUserLoginInfo(userCredential.user);
		} catch (error) {
			setError(error.message);
			setIsLoading(false);
		}
	};

	return (
		<div className="space-y-4">
			<button
				onClick={handleGoogleLogin}
				disabled={isLoading}
				className="w-full flex items-center justify-center space-x-2 bg-white border border-gray-300 text-gray-700 font-medium py-2 px-4 rounded hover:bg-gray-50">
				<svg className="w-5 h-5" viewBox="0 0 24 24">
					<path
						fill="#4285F4"
						d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z"
					/>
				</svg>
				<span>Login with Google</span>
			</button>

			<button
				onClick={onGuestClick}
				className="w-full flex items-center justify-center space-x-2 bg-gray-100 border border-gray-300 text-gray-700 font-medium py-2 px-4 rounded hover:bg-gray-200">
				<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
					<path
						fillRule="evenodd"
						d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
						clipRule="evenodd"
					/>
				</svg>
				<span>Login as Guest</span>
			</button>

			{error && (
				<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4">
					<span className="block sm:inline">{error}</span>
				</div>
			)}
		</div>
	);
};

export default SocialLogins;
