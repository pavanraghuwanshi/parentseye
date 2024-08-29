const DriverCollection = require("../models/driver");
const { generateToken } = require("../jwt");
const School = require("../models/school");

// exports.registerDriver = async (req, res) => {
//   try {
//     const data = {
//       driverName: req.body.driverName,
//       phone_no: req.body.phone_no,
//       email: req.body.email,
//       address: req.body.address,
//       password: req.body.password,
//       busName: req.body.busName,
//       deviceId: req.body.deviceId
//     };
//     const { email } = data;
//     console.log("Received registration data:", data);

//     const existingDriver = await DriverCollection.findOne({ email });
//     if (existingDriver) {
//       console.log("Email already exists");
//       return res.status(400).json({ error: "Email already exists" });
//     }

//     const newDriver = new DriverCollection(data);
//     const response = await newDriver.save();
//     console.log("Data saved:", response);

//     const payload = { id: response.id, email: response.email };
//     const token = generateToken(payload);

//     res.status(201).json({ response: { ...response.toObject(), password: undefined }, token }); 
//   } catch (error) {
//     console.error("Error during registration:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };


// Fetch School List Route
exports.getSchools =  async (req, res) => {
  try {
    const schools = await School.find({}, 'schoolName');
    res.status(200).json({ schools });
  } catch (error) {
    console.error('Error fetching school list:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Driver Registration Route
exports.registerDriver =  async (req, res) => {
  try {
    const {
      driverName,
      email,
      password,
      schoolName,
      licenseNumber,
      vehicleId,
      address,
      phone_no,
      fcmToken
    } = req.body;

    console.log(`Registering driver with schoolName: "${schoolName.trim()}"`);

    // Check if driver email already exists
    const existingDriver = await DriverCollection.findOne({ email });
    if (existingDriver) {
      return res.status(400).json({ error: 'Driver email already exists' });
    }

    // Find the school by name
    const school = await School.findOne({ schoolName: new RegExp(`^${schoolName.trim()}$`, 'i') });

    if (!school) {
      console.log('School not found:', schoolName.trim());
      return res.status(400).json({ error: 'School not found' });
    }

    // Create new driver with a pending status
    const newDriver = new DriverCollection({
      driverName,
      email,
      password, // No need to hash here, it will be done in the schema
      phone_no,
      licenseNumber,
      vehicleId,
      fcmToken,
      address,
      schoolId: school._id, // Link to the school's ID
      statusOfRegister: 'pending'
    });
    await newDriver.save();

    // Generate JWT token
    const payload = { id: newDriver._id, email: newDriver.email, schoolId: school._id };
    const token = generateToken(payload);

    res.status(201).json({ driver: newDriver, token });
  } catch (error) {
    console.error('Error during driver registration:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

exports.loginDriver = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Find the driver by email
    const driver = await DriverCollection.findOne({ email });
    if (!driver) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Check if the password matches
    const isMatch = await driver.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Generate token including schoolId if needed
    const token = generateToken({ 
      id: driver._id, 
      email: driver.email, 
      schoolId: driver.schoolId // Include schoolId in the token payload
    });

    res.status(200).json({ success: true, message: "Login successful", token });
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ error: "Server error" });
  }
};


exports.getDriverData = async (req, res) => {
  try {
    const driverId = req.user.id;
    const schoolId = req.user.schoolId; // Assuming schoolId is part of the token payload or user info

    // Find the driver by ID and ensure it matches the school context
    const driver = await DriverCollection.findOne({ _id: driverId, schoolId });
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found or does not belong to the school' });
    }

    // Return the driver data
    res.status(200).json({ driver });
  } catch (error) {
    console.error('Error fetching driver data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};



exports.updateDriver = async (req, res) => {
  try {
    const { driverName, address, phone_no, email } = req.body;
    const driverId = req.user.id;
    const schoolId = req.user.schoolId; // Assuming schoolId is part of the token payload or user info

    // Find and update the driver by ID and ensure it matches the school context
    const driver = await DriverCollection.findOneAndUpdate(
      { _id: driverId, schoolId }, // Include schoolId in the query to ensure proper association
      { driverName, address, phone_no, email },
      { new: true }
    );

    if (!driver) {
      return res.status(404).json({ error: "Driver not found or does not belong to the school" });
    }

    res.status(200).json({ message: "Driver details updated successfully", driver });
  } catch (error) {
    console.error('Error updating driver details:', error);
    res.status(500).json({ error: "Error updating driver details" });
  }
};


exports.deleteDriver = async (req, res) => {
  try {
    const driverId = req.user.id;
    const schoolId = req.user.schoolId; // Assuming schoolId is part of the token payload or user info

    // Find and delete the driver by ID and ensure it matches the school context
    const driver = await DriverCollection.findOneAndDelete({ _id: driverId, schoolId });

    if (!driver) {
      return res.status(404).json({ error: "Driver not found or does not belong to the school" });
    }

    res.status(200).json({ message: "Driver details deleted successfully", driver });
  } catch (error) {
    console.error('Error deleting driver details:', error);
    res.status(500).json({ error: "Error deleting driver details" });
  }
};
