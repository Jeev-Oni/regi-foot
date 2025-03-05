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
import { getDatabase, ref, set, serverTimestamp, get } from "firebase/database";
import { firebaseConfig } from "../components/FirebaseConfig";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();

// Enhanced mobile number authentication
export const loginWithMobileNumber = async (mobileNumber, password) => {
	console.log("Attempting mobile number login:", mobileNumber);

	try {
		// First, find the user with the matching mobile number
		const usersRef = ref(database, "users");
		const snapshot = await get(usersRef);

		if (snapshot.exists()) {
			const users = snapshot.val();
			const matchingUser = Object.entries(users).find(
				([uid, userData]) =>
					userData.profile && userData.profile.mobileNumber === mobileNumber
			);

			if (!matchingUser) {
				throw new Error("Mobile number not registered");
			}

			// Get the user ID
			const [userId, userData] = matchingUser;

			// Check credentials
			const credentialsRef = ref(database, `users/${userId}/credentials`);
			const credentialsSnapshot = await get(credentialsRef);

			if (credentialsSnapshot.exists()) {
				const credentials = credentialsSnapshot.val();

				// Verify mobile number and password
				if (
					credentials.mobileNumber === mobileNumber &&
					credentials.password === password
				) {
					// Use synthetic email for Firebase Authentication
					const syntheticEmail = `${mobileNumber}@mobile.app`;
					return signInWithEmailAndPassword(auth, syntheticEmail, password);
				} else {
					throw new Error("Incorrect mobile number or password");
				}
			} else {
				throw new Error("No credentials found");
			}
		} else {
			throw new Error("No users found in the database");
		}
	} catch (error) {
		console.error("Mobile login error:", error);
		throw error;
	}
};

// Updated signup method to ensure mobile number is unique
export const signupWithMobileNumber = async (
	mobileNumber,
	password,
	additionalData = {}
) => {
	console.log("Attempting mobile number signup:", mobileNumber);

	try {
		// Check if mobile number already exists
		const usersRef = ref(database, "users");
		const snapshot = await get(usersRef);

		if (snapshot.exists()) {
			const users = snapshot.val();
			const existingUser = Object.entries(users).find(
				([uid, userData]) =>
					userData.profile && userData.profile.mobileNumber === mobileNumber
			);

			if (existingUser) {
				throw new Error("Mobile number already registered");
			}
		}

		// Create user with a synthetic email
		const syntheticEmail = `${mobileNumber}@mobile.app`;
		const userCredential = await createUserWithEmailAndPassword(
			auth,
			syntheticEmail,
			password
		);

		// Save user login info with mobile number
		await saveUserLoginInfo(userCredential.user, {
			mobileNumber,
			...additionalData,
		});

		return userCredential;
	} catch (error) {
		console.error("Mobile signup error:", error);

		// Provide more specific error messages
		switch (error.code) {
			case "auth/email-already-in-use":
				throw new Error("Mobile number is already registered");
			case "auth/weak-password":
				throw new Error("Password is too weak. Use a stronger password.");
			default:
				throw error;
		}
	}
};

// Existing save user login info method remains the same
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
			mobileNumber: additionalData.mobileNumber || "",
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
			mobileNumber: additionalData.mobileNumber || "",
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

// Other existing methods remain the same
export const loginWithEmail = (email, password) => {
	console.log("Attempting email login:", email);
	return signInWithEmailAndPassword(auth, email, password);
};

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
