# 🌍 Sustainability Assistant Chatbot

A full-stack AI-powered chatbot web application to help users live more sustainably. Built with the **MERN** stack and **Google Gemini API**, it features user authentication, persistent chat history, and a modern ChatGPT-inspired interface.

---

## 📑 Table of Contents

- [Features](#features)
- [Project Architecture](#project-architecture)
- [Installation](#installation)

---

## 🌟 Features

- 🌱 **AI-Powered Sustainability Assistant** using Google Gemini to provide eco-friendly tips, product suggestions, and lifestyle guidance  
- 🔒 **User Authentication** (JWT-secured Register/Login system)  
- 💬 **Persistent Chat History** for each user  
- 🆕 **New Chat** button to start a fresh session  
- 🚪 **Logout** functionality to securely end sessions  
- 🖥️ **Modern, responsive ChatGPT-style UI**  
- 🗃️ **MongoDB storage** for user and chat data  

---

## 🏗️ Project Architecture

[ User (Browser) ]
|
v
[ React Frontend (App.js, Login.js, Register.js, Chat.js) ]
|
v
[ Express Backend (Node.js) ]
|
|---> [ MongoDB Atlas (users, chats) ]
|
'---> [ Gemini AI API (Google) ]


---

## ⚙️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/chatbot.git
cd chatbot

# Set up the Backend
cd backend
npm install
# Create a .env file with the following:
# MONGODB_URI=your_mongodb_atlas_uri
# JWT_SECRET=your_jwt_secret
# GEMINI_API_KEY=your_gemini_api_key
npm start

# Set up the Frontend
cd ../frontend
npm install
# Create a .env file with:
# REACT_APP_API_URL=http://localhost:5000
npm start



