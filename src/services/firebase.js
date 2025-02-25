// File: src/services/firebase.js
import { initializeApp } from "firebase/app";
import {
	getAuth,
	signInWithEmailAndPassword,
	createUserWithEmailAndPassword,
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

// Save user login info to Realtime Database
export const saveUserLoginInfo = async (user, additionalData = {}) => {
	try {
		const userRef = ref(
			database,
			`users/${user.uid}/loginHistory/${Date.now()}`
		);
		await set(userRef, {
			timestamp: serverTimestamp(),
			email: user.email || "anonymous",
			displayName: user.displayName || additionalData.name || "Guest",
			provider: user.providerData[0]?.providerId || "anonymous",
			lastLogin: new Date().toISOString(),
			userAgent: navigator.userAgent,
			...additionalData,
		});

		// If this is first login or we have additional profile data, save to profile
		if (additionalData.name || additionalData.age) {
			const profileRef = ref(database, `users/${user.uid}/profile`);
			await set(profileRef, {
				name: additionalData.name || user.displayName || "Guest",
				email: user.email || "anonymous",
				age: additionalData.age || "",
				contactNumber: additionalData.contactNumber || "",
				preferredSession: additionalData.timeframe || "",
				lastUpdated: serverTimestamp(),
			});
		}

		console.log("User information saved to database");
		return true;
	} catch (error) {
		console.error("Error saving user info:", error);
		throw error;
	}
};

// Auth methods
export const loginWithEmail = (email, password) => {
	return signInWithEmailAndPassword(auth, email, password);
};

export const signupWithEmail = (email, password) => {
	return createUserWithEmailAndPassword(auth, email, password);
};

export const loginWithGoogle = () => {
	return signInWithPopup(auth, googleProvider);
};

export const loginAsGuest = () => {
	return signInAnonymously(auth);
};

export const logoutUser = () => {
	return signOut(auth);
};
