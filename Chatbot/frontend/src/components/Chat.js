import React, { useState, useEffect, useRef } from "react";
import "./styles/Chat.css";

export default function Chat({ resetFlag }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const chatEndRef = useRef(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5000/history", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (Array.isArray(data)) setMessages(data);
      } catch (error) {
        console.error("Error fetching chat history:", error);
      }
    };

    const clearHistory = async () => {
      try {
        const token = localStorage.getItem("token");
        await fetch("http://localhost:5000/history", {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessages([]);
      } catch (error) {
        console.error("Error clearing chat history:", error);
      }
    };

    if (resetFlag) {
      clearHistory();
    } else {
      fetchHistory();
    }
  }, [resetFlag]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: "User", message: input, timestamp: new Date() };
    setMessages((msgs) => [...msgs, userMessage]);
    setInput("");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();
      setMessages((msgs) => [
        ...msgs,
        { sender: "Bot", message: data.reply || "Error", timestamp: new Date() },
      ]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((msgs) => [
        ...msgs,
        {
          sender: "Bot",
          message: "Sorry, there was an error processing your request.",
          timestamp: new Date(),
        },
      ]);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-box">
        {messages.length === 0 ? (
          <div className="welcome-message">
            <h2>Welcome! Start a new conversation.</h2>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`chat-message ${msg.sender.toLowerCase()}`}>
              <div className="message-bubble">
                {msg.message}
                <div className="timestamp">{formatTimestamp(msg.timestamp)}</div>
              </div>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>
      <div className="chat-input-container">
        <div className="chat-input-inner">
          <input
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button className="send-button" onClick={sendMessage}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
