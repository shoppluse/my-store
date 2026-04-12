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

    // Since email OTP verification is removed,
    // keep users verified by default
    isVerified: {
      type: Boolean,
      default: true
    },

    // Store multiple device notification tokens (for all logged-in devices)
    // Best for future Firebase FCM integration
    fcmTokens: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("User", userSchema);
