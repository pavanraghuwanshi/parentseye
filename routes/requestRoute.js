const express = require("express");
const router = express.Router();
const Request = require("../models/request");
const { jwtAuthMiddleware } = require("../jwt");

// Create Request Route
router.post('/create-request', jwtAuthMiddleware, async (req, res) => {
  try {
    const { requestType, startDate, endDate, childId } = req.body;
    const parentId = req.user.id;  
    if (!['leave', 'pickup', 'drop'].includes(requestType)) {
      return res.status(400).json({ error: 'Invalid request type' });
    }
    if (requestType === 'leave') {
      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Start date and end date are required for leave requests' });
      }
    } else if (requestType === 'pickup' || requestType === 'drop') {
      if (!startDate) {
        return res.status(400).json({ error: 'Date is required for pickup or drop requests' });
      }
    }
    const newRequest = new Request({
      requestType,
      startDate,
      endDate: requestType === 'leave' ? endDate : null,
      parentId,
      childId
    });
    await newRequest.save();
    res.status(201).json({ request: newRequest });
  } catch (error) {
    console.error('Error creating request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
