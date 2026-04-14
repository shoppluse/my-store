// models/Product.js
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
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
      type: mongoose.Schema.Types.Mixed,
      default: ""
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

    category: {
      type: String,
      default: "Overall",
      trim: true
    },

    brand: {
      type: String,
      default: "",
      trim: true
    },

    link: {
      type: String,
      default: "",
      trim: true
    },

    rating: {
      type: Number,
      default: null
    },

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    ownerName: {
      type: String,
      default: "",
      trim: true
    },

    source: {
      type: String,
      default: "affiliate",
      trim: true
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.models.Product || mongoose.model("Product", productSchema);
