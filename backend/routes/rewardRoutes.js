const express = require("express");
const router = express.Router();
const RewardClaim = require("../models/RewardClaim");

// POST /api/rewards/claim
router.post("/claim", async (req, res) => {
  try {
    const {
      userId,
      name,
      email,
      mobile,
      productId,
      productName,
      orderReference,
      purchaseDate,
      proofNote
    } = req.body;

    if (
      !userId ||
      !name ||
      !email ||
      !mobile ||
      !productId ||
      !productName ||
      !orderReference ||
      !purchaseDate
    ) {
      return res.status(400).json({
        message: "All required fields must be filled"
      });
    }

    const newClaim = new RewardClaim({
      userId,
      name,
      email,
      mobile,
      productId,
      productName,
      orderReference,
      purchaseDate,
      proofNote: proofNote || ""
    });

    await newClaim.save();

    res.status(201).json({
      message: "Reward claim submitted successfully",
      claim: newClaim
    });

  } catch (error) {
    console.error("Reward claim error:", error);
    res.status(500).json({
      message: "Server error while submitting reward claim"
    });
  }
});

// GET /api/rewards/user/:userId
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const claims = await RewardClaim.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json({ claims });
  } catch (error) {
    console.error("Fetch user claims error:", error);
    res.status(500).json({
      message: "Server error while fetching reward claims"
    });
  }
});

module.exports = router;
