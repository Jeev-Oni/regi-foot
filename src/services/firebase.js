import { initializeApp } from "firebase/app";
import {
	getAuth,
	signInWithPopup,
	GoogleAuthProvider,
	signInAnonymously,
	signOut,
} from "firebase/auth";
import { getDatabase, ref, set, serverTimestamp } from "firebase/database";
import { firebaseConfig } from "../components/FirebaseConfig";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();

// Save user login information
export const saveUserLoginInfo = async (user, additionalData = {}) => {
	try {
		console.log("Saving user login info:", user.uid, additionalData);

		// Ensure user object exists
		if (!user || !user.uid) {
			console.error("Invalid user object", user);
			throw new Error("Invalid user authentication");
		}

		// Prepare user data
		const userData = {
			userId: user.uid,
			timestamp: serverTimestamp(),
			email: user.email || "anonymous",
			displayName: user.displayName || additionalData.name || "Guest",
			provider: user.providerData[0]?.providerId || "anonymous",
			lastLogin: new Date().toISOString(),
			userAgent: navigator.userAgent,
			...additionalData,
		};

		// Save login history
		const loginHistoryRef = ref(
			database,
			`users/${user.uid}/loginHistory/${Date.now()}`
		);
		await set(loginHistoryRef, userData);

		// Save or update profile
		const profileRef = ref(database, `users/${user.uid}/profile`);
		await set(profileRef, {
			name: additionalData.name || user.displayName || "Guest",
			email: user.email || "anonymous",
			age: additionalData.age || "",
			contactNumber: additionalData.contactNumber || "",
			preferredSession: additionalData.timeframe || "",
			lastUpdated: serverTimestamp(),
		});

		console.log("User information saved successfully");
		return true;
	} catch (error) {
		console.error("Error saving user info:", error);
		throw error;
	}
};

// Authentication methods
export const loginWithGoogle = () => {
	console.log("Attempting Google login");
	return signInWithPopup(auth, googleProvider);
};

export const loginAsGuest = () => {
	console.log("Attempting anonymous login");
	return signInAnonymously(auth);
};

export const logoutUser = () => {
	console.log("Logging out user");
	return signOut(auth);
};
