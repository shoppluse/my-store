const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    mobile: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    password: {
      type: String,
      required: true
    },

    // Email verification not used
    isVerified: {
      type: Boolean,
      default: true
    },

    // Store multiple FCM tokens directly inside user doc
    fcmTokens: {
      type: [String],
      default: []
    },

    // AFFILIATE STATUS
    isAffiliate: {
      type: Boolean,
      default: false
    },

    affiliateStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("User", userSchema);
