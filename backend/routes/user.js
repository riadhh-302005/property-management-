const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const User = require("../models/User");

// ✅ Get all tenants
router.get("/tenants", protect, async (req, res) => {
  try {
    const tenants = await User.find({ role: "tenant" })
      .select("_id name email");

    res.json({
      success: true,
      tenants
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;