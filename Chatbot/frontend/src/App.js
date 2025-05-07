import React, { useState } from "react";
import Login from "./components/Login";
import Register from "./components/Register";
import Chat from "./components/Chat";
import "./components/styles/App.css";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("token")
  );
  const [showRegister, setShowRegister] = useState(false);
  const [resetChatFlag, setResetChatFlag] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
  };

  const handleNewChat = () => {
    setResetChatFlag((prev) => !prev); // toggles the flag to reset chat
  };

  if (!isAuthenticated) {
    return (
      <div className="app-background">
        <div className="centered-box">
          {showRegister ? (
            <Register onSwitchToLogin={() => setShowRegister(false)} />
          ) : (
            <Login
              onLogin={() => setIsAuthenticated(true)}
              onSwitchToRegister={() => setShowRegister(true)}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app-background">
      <div className="centered-box">
        <div className="header">
          <h1>Sustainability Assistant</h1>
          <div>
            <button className="btn" onClick={handleNewChat}>
              New Chat
            </button>
            <button className="btn logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
        <Chat resetFlag={resetChatFlag} />
      </div>
    </div>
  );
}

export default App;
