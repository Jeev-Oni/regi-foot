// File: src/App.jsx
import React from "react";
import FirebaseAuth from "./components/FirebaseAuth";
import "./App.css";

function App() {
	return (
		<div className="min-h-screen bg-gray-100">
			<FirebaseAuth />
		</div>
	);
}

export default App;
