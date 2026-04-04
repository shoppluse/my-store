const mongoose = require("mongoose");

const rewardClaimSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true
    },
    mobile: {
      type: String,
      required: true,
      trim: true
    },
    productId: {
      type: String,
      required: true,
      trim: true
    },
    productName: {
      type: String,
      required: true,
      trim: true
    },
    orderReference: {
      type: String,
      required: true,
      trim: true
    },
    purchaseDate: {
      type: String,
      required: true
    },
    proofNote: {
      type: String,
      default: "",
      trim: true
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "paid"],
      default: "pending"
    },
    rewardAmount: {
      type: Number,
      default: 0
    },
    adminNote: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("RewardClaim", rewardClaimSchema);
