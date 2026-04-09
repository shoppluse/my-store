const mongoose = require("mongoose");

const fcmTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    user: {
      type: String,
      default: "guest",
      trim: true,
    },
    platform: {
      type: String,
      default: "web",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("FcmToken", fcmTokenSchema);
