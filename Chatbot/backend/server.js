const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

// Import models
const User = require("./models/User");

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/sustainability-chatbot";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Check if Gemini API key is available
if (!GEMINI_API_KEY) {
  console.error("Error: GEMINI_API_KEY is not set in environment variables");
  process.exit(1);
}

// Initialize Gemini API client
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("MongoDB connected to", MONGODB_URI))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Chat Schema & Model
const chatSchema = new mongoose.Schema({
  sender: String,
  message: String,
  timestamp: { type: Date, default: Date.now },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
});

const Chat = mongoose.model("Chat", chatSchema);

// Authentication Middleware
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: "Authorization header missing" });
  }

  const token = authHeader.split(" ")[1]; // Format: "Bearer TOKEN"
  
  if (!token) {
    return res.status(401).json({ error: "Token missing" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    console.error("JWT verification error:", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

// ROUTES

// Register Route
app.post("/auth/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    res.json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Server error during registration" });
  }
});

// Login Route
app.post("/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Create and send JWT
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" }); // Token valid for 7 days
    res.json({ message: "Login successful", token, username: user.username });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error during login" });
  }
});

// Logout Route (optional - frontend handles token removal)
app.post("/auth/logout", authMiddleware, (req, res) => {
  // JWT is stateless, so we don't need to invalidate it on the server
  // The frontend will remove the token from localStorage
  res.json({ message: "Logout successful" });
});

// Chat Route - Process messages with Gemini API
app.post("/chat", authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Save user message to database
    await Chat.create({ 
      sender: "User", 
      message, 
      userId: req.userId 
    });

    // Prepare context for sustainability focus
    const sustainabilityContext = 
      "You are a sustainability assistant that helps users reduce their carbon footprint " +
      "and live more eco-friendly lives. Provide practical, actionable advice about " +
      "sustainable living, renewable energy, reducing waste, conserving resources, " +
      "and environmental protection. Keep responses informative but concise.";

    // Call Gemini API with the correct format
    const response = await model.generateContent({
      contents: [
        { 
          parts: [
            { text: sustainabilityContext },
            { text: message }
          ] 
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800,
      }
    });

    // Extract bot reply safely with fallback
    const botReply = 
      response?.response?.candidates?.[0]?.content?.parts?.[0]?.text || 
      "Sorry, I couldn't process that request. Please try again.";

    // Save bot reply to database
    await Chat.create({ 
      sender: "Bot", 
      message: botReply,
      userId: req.userId 
    });

    res.json({ reply: botReply });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Chat History Route
app.get("/history", authMiddleware, async (req, res) => {
  try {
    // Get chat history for the authenticated user
    const history = await Chat.find({ userId: req.userId }).sort({ timestamp: 1 });
    res.json(history);
  } catch (error) {
    console.error("Fetch history error:", error);
    res.status(500).json({ error: "Error fetching chat history" });
  }
});

// Clear Chat History Route
app.delete("/history", authMiddleware, async (req, res) => {
  try {
    // Delete all chat messages for the authenticated user
    await Chat.deleteMany({ userId: req.userId });
    res.json({ message: "Chat history cleared successfully" });
  } catch (error) {
    console.error("Clear history error:", error);
    res.status(500).json({ error: "Error clearing chat history" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
