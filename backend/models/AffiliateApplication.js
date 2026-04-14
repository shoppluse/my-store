const mongoose = require("mongoose");

const affiliateApplicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    fullName: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },

    mobile: {
      type: String,
      required: true,
      trim: true
    },

    socialPlatform: {
      type: String,
      default: "",
      trim: true
    },

    socialLink: {
      type: String,
      default: "",
      trim: true
    },

    promoMethod: {
      type: String,
      default: "",
      trim: true
    },

    whyJoin: {
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
