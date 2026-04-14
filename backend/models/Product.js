const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      default: "",
      trim: true
    },

    price: {
      type: String,
      default: "",
      trim: true
    },

    link: {
      type: String,
      required: true,
      trim: true
    },

    image: {
      type: String,
      default: "",
      trim: true
    },

    images: {
      type: [String],
      default: []
    },

    rating: {
      type: Number,
      default: 4.5
    },

    category: {
      type: String,
      default: "General",
      trim: true
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Product", productSchema);
