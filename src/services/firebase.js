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
import { firebaseConfig } from "../components/FirebaseConfig"; 

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();

export const saveUserLoginInfo = async (user, additionalData = {}) => {
	try {
		if (!user || !user.uid) {
			throw new Error("Invalid user authentication");
		}
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

export const loginWithGoogle = () => {
	return signInWithPopup(auth, googleProvider);
};

export const loginAsGuest = () => {
	return signInAnonymously(auth);
};

export const logoutUser = () => {
	return signOut(auth);
};
