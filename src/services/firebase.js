// firebase.js
import { initializeApp } from "firebase/app";
import {
	getAuth,
	signInWithPopup,
	GoogleAuthProvider,
	signInAnonymously,
	signOut,
} from "firebase/auth";
import {
	getDatabase,
	ref,
	set,
	update,
	serverTimestamp,
} from "firebase/database";
import { firebaseConfig } from "../components/FirebaseConfig"; // or wherever your config is

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();

// --- MODIFIED saveUserLoginInfo ---
// Use update() instead of set() so we don't overwrite existing child nodes.
export const saveUserLoginInfo = async (user, additionalData = {}) => {
	try {
		if (!user || !user.uid) {
			throw new Error("Invalid user authentication");
		}

		// We'll store some basic login info, but do NOT overwrite entire "profile"
		const loginHistoryRef = ref(
			database,
			`users/${user.uid}/loginHistory/${Date.now()}`
		);
		await set(loginHistoryRef, {
			userId: user.uid,
			timestamp: serverTimestamp(),
			email: user.email || "anonymous",
			displayName: user.displayName || additionalData.name || "Guest",
			provider: user.providerData[0]?.providerId || "anonymous",
			lastLogin: new Date().toISOString(),
			userAgent: navigator.userAgent,
			...additionalData,
		});

		// Now update the profile node (instead of overwriting with set())
		const profileRef = ref(database, `users/${user.uid}/profile`);
		await update(profileRef, {
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
	return signInWithPopup(auth, googleProvider);
};

export const loginAsGuest = () => {
	return signInAnonymously(auth);
};

export const logoutUser = () => {
	return signOut(auth);
};
