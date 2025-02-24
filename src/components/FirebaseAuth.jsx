import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
	getAuth,
	signInWithEmailAndPassword,
	createUserWithEmailAndPassword,
	signInWithPopup,
	GoogleAuthProvider,
	signOut,
	onAuthStateChanged,
} from "firebase/auth";
import { getDatabase, ref, set, serverTimestamp } from "firebase/database";

// Your Firebase configuration - replace with your actual config
const firebaseConfig = {
	apiKey: "YOUR_API_KEY",
	authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
	databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
	projectId: "YOUR_PROJECT_ID",
	storageBucket: "YOUR_PROJECT_ID.appspot.com",
	messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
	appId: "YOUR_APP_ID",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const googleProvider = new GoogleAuthProvider();

const FirebaseAuth = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [user, setUser] = useState(null);
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	// Listen for auth state changes
	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
			setUser(currentUser);
			setIsLoading(false);
		});

		// Cleanup subscription
		return () => unsubscribe();
	}, []);

	// Save user login info to Realtime Database
	const saveUserLoginInfo = async (user) => {
		try {
			const userRef = ref(
				database,
				`users/${user.uid}/loginHistory/${Date.now()}`
			);
			await set(userRef, {
				timestamp: serverTimestamp(),
				email: user.email,
				displayName: user.displayName || "N/A",
				provider: user.providerData[0]?.providerId || "email/password",
				lastLogin: new Date().toISOString(),
				userAgent: navigator.userAgent,
			});
			console.log("Login information saved to database");
		} catch (error) {
			console.error("Error saving login info:", error);
		}
	};

	// Handle email/password login
	const handleEmailLogin = async (e) => {
		e.preventDefault();
		setIsLoading(true);
		setError("");

		try {
			const userCredential = await signInWithEmailAndPassword(
				auth,
				email,
				password
			);
			await saveUserLoginInfo(userCredential.user);
		} catch (error) {
			setError(error.message);
			setIsLoading(false);
		}
	};

	// Handle signup
	const handleSignup = async (e) => {
		e.preventDefault();
		setIsLoading(true);
		setError("");

		try {
			const userCredential = await createUserWithEmailAndPassword(
				auth,
				email,
				password
			);
			await saveUserLoginInfo(userCredential.user);
		} catch (error) {
			setError(error.message);
			setIsLoading(false);
		}
	};

	// Handle Google login
	const handleGoogleLogin = async () => {
		setIsLoading(true);
		setError("");

		try {
			const userCredential = await signInWithPopup(auth, googleProvider);
			await saveUserLoginInfo(userCredential.user);
		} catch (error) {
			setError(error.message);
			setIsLoading(false);
		}
	};

	// Handle logout
	const handleLogout = async () => {
		try {
			await signOut(auth);
		} catch (error) {
			setError(error.message);
		}
	};

	// If user is logged in, show user info and logout button
	if (user) {
		return (
			<div className="auth-container logged-in">
				<h2>Welcome, {user.displayName || user.email}</h2>
				<div className="user-info">
					<p>
						<strong>Email:</strong> {user.email}
					</p>
					<p>
						<strong>User ID:</strong> {user.uid}
					</p>
					<p>
						<strong>Provider:</strong> {user.providerData[0]?.providerId}
					</p>
				</div>
				<button onClick={handleLogout} className="logout-btn">
					Logout
				</button>
			</div>
		);
	}

	// If user is not logged in, show login form
	return (
		<div className="auth-container">
			<h2>FOOTBALL LIPA APPOINTMENT SYSTEM</h2>
			<h3>LOG IN</h3>

			{error && <div className="error-message">{error}</div>}

			<form onSubmit={handleEmailLogin} className="auth-form">
				<div className="form-group">
					<input
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder="Email Address"
						required
					/>
				</div>
				<div className="form-group">
					<input
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder="Password"
						required
					/>
				</div>
				<div className="auth-buttons">
					<button type="submit" disabled={isLoading} className="login-btn">
						{isLoading ? "Logging in..." : "Login Now"}
					</button>
					<button
						type="button"
						onClick={handleSignup}
						disabled={isLoading}
						className="signup-btn">
						{isLoading ? "Signing up..." : "Sign Up"}
					</button>
				</div>
			</form>

			<div className="divider">OR</div>

			<button
				onClick={handleGoogleLogin}
				disabled={isLoading}
				className="google-btn">
				<img
					src="https://cdn.jsdelivr.net/npm/simple-icons@v7/icons/google.svg"
					alt="Google"
				/>
				Login with Google
			</button>

			<button
				onClick={() => {
					/* Guest login logic */
				}}
				className="guest-btn">
				Login as Guest
			</button>
		</div>
	);
};

export default FirebaseAuth;
