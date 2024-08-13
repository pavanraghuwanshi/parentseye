const express = require("express");
const router = express.Router();
const Geofencing = require('../models/geofence')
const  DriverCollection = require("../models/driver");
const { encrypt } = require('../models/cryptoUtils');
const { generateToken,jwtAuthMiddleware } = require("../jwt");

// Registration route
router.post("/register", async (req, res) => {
  try {
    const data = {
      driverName: req.body.driverName,
      phone_no: req.body.phone_no,
      email: req.body.email,
      address: req.body.address,
      password: req.body.password,
    };
    const { email } = data;
    console.log("Received registration data:", data);

    const existingdriver = await DriverCollection.findOne({ email });
    if (existingdriver) {
      console.log("Email already exists");
      return res.status(400).json({ error: "Email already exists" });
    }

    // Encrypt the password before saving
    data.encryptedPassword = encrypt(data.password);
    console.log("Encrypted password:", data.encryptedPassword);

    const newdriver = new DriverCollection(data);
    const response = await newdriver.save();
    console.log("Data saved:", response);

    const payload = {
      id: response.id,
      email: response.email,
    };
    console.log("JWT payload:", JSON.stringify(payload));
    
    const token = generateToken(payload);
    console.log("Generated token:", token);

    res.status(201).json({ response: { ...response.toObject(), password : data.encryptedPassword }, token });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
// Login route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const driver = await DriverCollection.findOne({ email });
    if (!driver) {
      return res.status(400).json({ error: "Invalid email or password" });
    }
    const isMatch = await driver.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }
    const token = generateToken({
      id: driver._id,
      email: driver.email,
    });
    res.status(200).json({
      success: true,
      message: "Login successful",
      token: token,
    });
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ error: "Server error" });
  }
});
// Get driver's data
router.get('/getdriverData', jwtAuthMiddleware, async (req, res) => {
  try {
    const driverId = req.user.id;
    console.log(`Fetching data for driver with ID: ${driverId}`);

    // Fetch the driver data
    const driver = await DriverCollection.findById(driverId);
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Fetch geofencing data if applicable (e.g., if the driver has a deviceId)
    let geofencingData = [];
    if (driver.deviceId) {
      geofencingData = await Geofencing.find({ deviceId: driver.deviceId }).lean();
    }

    // Transform geofencing data
    const transformedGeofencingData = geofencingData.length
      ? geofencingData.map(area => ({
          id: area._id,
          name: area.name,
          description: area.description || '',
          area: area.area,
          calendarId: area.calendarId,
          attributes: area.attributes || {},
          isCrossed:false
        }))
      : [{ id: null, name: 'No geofencing data available', description: '', area: '', calendarId: null, attributes: {} }];

    // Include driver and geofencing data in the response
    res.status(200).json({ driver, geofencing: transformedGeofencingData });
  } catch (error) {
    console.error('Error fetching driver data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// update driver's data 
router.put('/update', jwtAuthMiddleware, async (req, res) => {
  try {
    const { name, address, phone_no, email } = req.body;
    const driverId = req.user.id;
    const driver = await DriverCollection.findOneAndUpdate(
      { _id: driverId },
      { name, address, phone_no, email },
      { new: true }
    );
    if (!driver) {
      return res.status(404).json({ error: "Driver not found" });
    }
    res.status(200).json({ message: "Driver details updated successfully", driver });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error updating Driver details" });
  }
});
// delete driver's data 
router.delete('/delete', jwtAuthMiddleware, async (req, res) => {
  try {
    const driverId = req.user.id;
    const driver = await DriverCollection.findOneAndDelete({ _id: driverId });
    
    if (!driver) {
      return res.status(404).json({ error: "Driver not found" });
    }

    res.status(200).json({ message: "Driver details deleted successfully", driver });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error deleting driver details" });
  }
});


module.exports = router;
