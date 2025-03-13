import { database } from "./firebase";
import { ref, get } from "firebase/database";

export const SessionService = {
	fetchActiveSessions: async () => {
		try {
			const sessionsRef = ref(database, "sessions");
			const snapshot = await get(sessionsRef);
			if (!snapshot.exists()) {
				return [];
			}
			const sessionsData = snapshot.val();
			const activeSessions = [];
			Object.entries(sessionsData).forEach(([sessionId, sessionData]) => {
				
				if (sessionData.status === "active") {
					
					const formattedSession = {
						id: sessionId,
						date: sessionData.date || sessionData.createdAt,
						event: sessionData.event || "Football Session",
						time: sessionData.time || "Not specified",
						teams: sessionData.teams || initializeDefaultTeams(),
					};

					activeSessions.push(formattedSession);
				}
			});

			return activeSessions;
		} catch (error) {
			console.error("Error fetching sessions:", error);
			throw new Error("Failed to load sessions. Please try again.");
		}
	},
	getSessionDetails: async (sessionId) => {
		try {
			const sessionRef = ref(database, `sessions/${sessionId}`);
			const snapshot = await get(sessionRef);

			if (!snapshot.exists()) {
				throw new Error("Session not found");
			}

			const sessionData = snapshot.val();

			
			if (!sessionData.teams) {
				sessionData.teams = initializeDefaultTeams();
			}

			return {
				id: sessionId,
				date: sessionData.date || sessionData.createdAt,
				event: sessionData.event || "Football Session",
				time: sessionData.time || "Not specified",
				teams: sessionData.teams,
				status: sessionData.status || "active",
			};
		} catch (error) {
			console.error("Error fetching session details:", error);
			throw new Error("Failed to load session details. Please try again.");
		}
	},
};
function initializeDefaultTeams() {
	const createEmptySlots = (count = 8) => Array(count).fill(null);

	return {
		"Team A": {
			slots: createEmptySlots(),
		},
		"Team B": {
			slots: createEmptySlots(),
		},
		"Team C": {
			slots: createEmptySlots(),
		},
	};
}
export default SessionService;
