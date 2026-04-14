const mongoose = require("mongoose");

const affiliateApplicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
      lowercase: true,
      trim: true
    },

    mobile: {
      type: String,
      required: true,
      trim: true
    },

    instagram: {
      type: String,
      default: "",
      trim: true
    },

    youtube: {
      type: String,
      default: "",
      trim: true
    },

    telegram: {
      type: String,
      default: "",
      trim: true
    },

    audienceType: {
      type: String,
      default: "",
      trim: true
    },

    experience: {
      type: String,
      default: "",
      trim: true
    },

    reason: {
      type: String,
      default: "",
      trim: true
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("AffiliateApplication", affiliateApplicationSchema);
