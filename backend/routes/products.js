const express = require("express");
const router = express.Router();

const Product = require("../models/Product");
const User = require("../models/User");

/* =========================================================
   GET ALL PRODUCTS (latest first)
   Route: GET /api/products
========================================================= */
router.get("/", async (req, res) => {
  try {
    const products = await Product.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error("GET /api/products error:", error);
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

/* =========================================================
   GET MY PRODUCTS
   Route: GET /api/products/my-products/:userId
========================================================= */
router.get("/my-products/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const products = await Product.find({
      ownerId: userId,
      isActive: true
    }).sort({ createdAt: -1 });

    res.json({
      products,
      count: products.length
    });
  } catch (error) {
    console.error("GET /api/products/my-products/:userId error:", error);
    res.status(500).json({ message: "Failed to fetch your products" });
  }
});

/* =========================================================
   GET SINGLE PRODUCT BY ID
   Route: GET /api/products/:id
========================================================= */
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      isActive: true
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    console.error("GET /api/products/:id error:", error);
    res.status(500).json({ message: "Failed to fetch product" });
  }
});

/* =========================================================
   ADD NEW PRODUCT
   Route: POST /api/products
========================================================= */
router.post("/", async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      image,
      images,
      category,
      brand,
      link,
      rating,
      ownerId,
      ownerName
    } = req.body;

    if (!name || !description || !price || !image || !category || !link || !ownerId) {
      return res.status(400).json({
        message: "Missing required fields"
      });
    }

    const user = await User.findById(ownerId);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    if (!user.isAffiliate || user.affiliateStatus !== "approved") {
      return res.status(403).json({
        message: "Only approved affiliates can add products"
      });
    }

    const affiliatePlan = user.affiliatePlan || "starter";
    const planStatus = user.planStatus || "inactive";

    if (planStatus !== "active") {
      return res.status(403).json({
        message: "Your affiliate plan is not active"
      });
    }

    // ===============================
    // USE maxProducts DIRECTLY FROM USER DOCUMENT
    // -1 means unlimited
    // ===============================
    let maxProducts = typeof user.maxProducts === "number" ? user.maxProducts : 3;

    // fallback mapping only if maxProducts is missing
    if (user.maxProducts === undefined || user.maxProducts === null) {
      if (affiliatePlan === "starter") maxProducts = 3;
      if (affiliatePlan === "basic") maxProducts = 20;
      if (affiliatePlan === "elite") maxProducts = -1;
    }

    const activeProductsCount = await Product.countDocuments({
      ownerId: user._id,
      isActive: true
    });

    // Only block if NOT unlimited
    if (maxProducts !== -1 && activeProductsCount >= maxProducts) {
      return res.status(403).json({
        message: `Your ${affiliatePlan} plan allows only ${maxProducts} active products`
      });
    }

    let cleanImages = Array.isArray(images)
      ? images.map(img => String(img || "").trim()).filter(Boolean)
      : [];

    const mainImage = String(image).trim();

    if (!cleanImages.includes(mainImage)) {
      cleanImages.unshift(mainImage);
    }

    cleanImages = [...new Set(cleanImages)];

    let cleanRating = null;
    if (rating !== null && rating !== undefined && rating !== "") {
      const parsedRating = Number(rating);
      if (!isNaN(parsedRating) && parsedRating >= 0 && parsedRating <= 5) {
        cleanRating = Number(parsedRating.toFixed(1));
      }
    }

    const cleanPrice = Number(price);

    if (isNaN(cleanPrice) || cleanPrice < 0) {
      return res.status(400).json({
        message: "Invalid price"
      });
    }

    const newProduct = new Product({
      name: String(name).trim(),
      description: String(description).trim(),
      price: cleanPrice,
      image: mainImage,
      images: cleanImages,
      category: String(category).trim(),
      brand: String(brand || "").trim(),
      link: String(link).trim(),
      rating: cleanRating,
      ownerId: user._id,
      ownerName: String(ownerName || user.name || "").trim(),
      source: "affiliate",
      isActive: true
    });

    const savedProduct = await newProduct.save();

    res.status(201).json({
      message: "Product added successfully",
      product: savedProduct
    });
  } catch (error) {
    console.error("POST /api/products error:", error);
    res.status(500).json({
      message: "Failed to add product",
      error: error.message
    });
  }
});

/* =========================================================
   DELETE PRODUCT (owner only)
   Route: DELETE /api/products/:id
========================================================= */
router.delete("/:id", async (req, res) => {
  try {
    const { ownerId } = req.body;

    if (!ownerId) {
      return res.status(400).json({ message: "ownerId is required" });
    }

    const product = await Product.findById(req.params.id);

    if (!product || !product.isActive) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (String(product.ownerId) !== String(ownerId)) {
      return res.status(403).json({ message: "You can delete only your own products" });
    }

    product.isActive = false;
    await product.save();

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/products/:id error:", error);
    res.status(500).json({ message: "Failed to delete product" });
  }
});

module.exports = router;
