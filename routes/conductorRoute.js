// routes/conductor.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const Conductor = require("../models/conductor");
const { generateToken} = require("../jwt");

// Registration route
router.post("/register", async (req, res) => {
  try {
    const data = req.body;
    const { email } = data;

    console.log("Received registration data:", data);

    const existingConductor = await Conductor.findOne({ email });
    if (existingConductor) {
      console.log("Email already exists");
      return res.status(400).json({ error: "Email already exists" });
    }

    const newConductor = new Conductor(data);
    const response = await newConductor.save();
    console.log("Data saved:", response);

    const payload = {
      id: response.id,
      username: response.email,
    };

    console.log("JWT payload:", JSON.stringify(payload));
    const token = generateToken(payload);
    console.log("Generated token:", token);

    res.status(201).json({ response, token });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Login route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const conductor = await Conductor.findOne({ email });
    if (!conductor) {
      return res.status(400).json({ error: "Invalid email or password" });
    }
    const isMatch = await conductor.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }
    const token = generateToken({ id: conductor._id, email: conductor.email });
    res.status(200).json({
      success: true,
      message: "Login successful",
      token: token
    });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
