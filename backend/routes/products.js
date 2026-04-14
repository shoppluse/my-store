const express = require("express");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const User = require("../models/User");

const router = express.Router();

// =======================================
// GET ALL PRODUCTS (Public)
// =======================================
router.get("/", async (req, res) => {
  try {
    const products = await Product.find({ status: "active" })
      .sort({ createdAt: -1 });

    const formattedProducts = products.map((p) => ({
      id: p._id,
      name: p.name,
      description: p.description,
      price: p.price,
      link: p.link,
      image: p.image,
      images: p.images,
      rating: p.rating,
      category: p.category,
      ownerId: p.ownerId
    }));

    res.status(200).json(formattedProducts);
  } catch (error) {
    console.error("Get all products error:", error);
    res.status(500).json({
      message: "Failed to fetch products",
      error: error.message
    });
  }
});

// =======================================
// GET SINGLE PRODUCT BY ID (Public)
// =======================================
router.get("/:id", async (req, res) => {
  try {
    const productId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        message: "Invalid product ID"
      });
    }

    const product = await Product.findById(productId);

    if (!product || product.status !== "active") {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    res.status(200).json({
      id: product._id,
      name: product.name,
      description: product.description,
      price: product.price,
      link: product.link,
      image: product.image,
      images: product.images,
      rating: product.rating,
      category: product.category,
      ownerId: product.ownerId
    });
  } catch (error) {
    console.error("Get single product error:", error);
    res.status(500).json({
      message: "Failed to fetch product",
      error: error.message
    });
  }
});

// =======================================
// ADD PRODUCT (Affiliate only + Plan limit)
// =======================================
router.post("/add", async (req, res) => {
  try {
    const {
      userId,
      name,
      description,
      price,
      link,
      image,
      images,
      rating,
      category
    } = req.body;

    if (!userId || !name || !link) {
      return res.status(400).json({
        message: "userId, name and link are required"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: "Invalid userId"
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    // Must be approved affiliate
    if (user.affiliateStatus !== "approved") {
      return res.status(403).json({
        message: "Only approved affiliates can add products"
      });
    }

    // Must have active plan
    if (user.planStatus !== "active") {
      return res.status(403).json({
        message: "Please activate a plan before adding products"
      });
    }

    // Must have valid plan
    if (!["starter", "growth", "elite"].includes(user.affiliatePlan)) {
      return res.status(403).json({
        message: "Invalid or missing affiliate plan"
      });
    }

    // Count current products by this user
    const currentProductCount = await Product.countDocuments({
      ownerId: user._id,
      status: "active"
    });

    // maxProducts = -1 => unlimited
    if (user.maxProducts !== -1 && currentProductCount >= user.maxProducts) {
      return res.status(403).json({
        message: `Product limit reached for your ${user.affiliatePlan} plan`,
        currentProductCount,
        maxProducts: user.maxProducts
      });
    }

    const safeImages = Array.isArray(images)
      ? images.filter(Boolean)
      : [];

    const product = await Product.create({
      ownerId: user._id,
      name: String(name).trim(),
      description: (description || "").trim(),
      price: price !== undefined && price !== null ? String(price).trim() : "",
      link: String(link).trim(),
      image: (image || "").trim(),
      images: safeImages,
      rating: typeof rating === "number" ? rating : 4.5,
      category: (category || "General").trim(),
      status: "active"
    });

    res.status(201).json({
      message: "Product added successfully",
      product: {
        id: product._id,
        ownerId: product.ownerId,
        name: product.name,
        description: product.description,
        price: product.price,
        link: product.link,
        image: product.image,
        images: product.images,
        rating: product.rating,
        category: product.category
      },
      planInfo: {
        affiliatePlan: user.affiliatePlan,
        currentProductCount: currentProductCount + 1,
        maxProducts: user.maxProducts
      }
    });
  } catch (error) {
    console.error("Add product error:", error);
    res.status(500).json({
      message: "Failed to add product",
      error: error.message
    });
  }
});

// =======================================
// GET MY PRODUCTS
// =======================================
router.post("/my-products", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "userId is required"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: "Invalid userId"
      });
    }

    const products = await Product.find({
      ownerId: userId,
      status: "active"
    }).sort({ createdAt: -1 });

    res.status(200).json({
      message: "My products fetched successfully",
      count: products.length,
      products: products.map((p) => ({
        id: p._id,
        name: p.name,
        description: p.description,
        price: p.price,
        link: p.link,
        image: p.image,
        images: p.images,
        rating: p.rating,
        category: p.category,
        createdAt: p.createdAt
      }))
    });
  } catch (error) {
    console.error("My products error:", error);
    res.status(500).json({
      message: "Failed to fetch your products",
      error: error.message
    });
  }
});

// =======================================
// DELETE MY PRODUCT
// =======================================
router.post("/delete", async (req, res) => {
  try {
    const { userId, productId } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({
        message: "userId and productId are required"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        message: "Invalid userId or productId"
      });
    }

    const product = await Product.findOne({
      _id: productId,
      ownerId: userId,
      status: "active"
    });

    if (!product) {
      return res.status(404).json({
        message: "Product not found or not owned by this user"
      });
    }

    product.status = "inactive";
    await product.save();

    res.status(200).json({
      message: "Product deleted successfully"
    });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({
      message: "Failed to delete product",
      error: error.message
    });
  }
});

// =======================================
// GET PLAN PRODUCT USAGE
// =======================================
router.post("/plan-usage", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "userId is required"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: "Invalid userId"
      });
    }

    const user = await User.findById(userId).select(
      "affiliatePlan planStatus maxProducts affiliateStatus isAffiliate"
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const currentProductCount = await Product.countDocuments({
      ownerId: userId,
      status: "active"
    });

    res.status(200).json({
      message: "Plan usage fetched successfully",
      user: {
        isAffiliate: user.isAffiliate,
        affiliateStatus: user.affiliateStatus,
        affiliatePlan: user.affiliatePlan,
        planStatus: user.planStatus,
        maxProducts: user.maxProducts
      },
      usage: {
        currentProductCount,
        remainingProducts:
          user.maxProducts === -1
            ? "unlimited"
            : Math.max(user.maxProducts - currentProductCount, 0)
      }
    });
  } catch (error) {
    console.error("Plan usage error:", error);
    res.status(500).json({
      message: "Failed to fetch plan usage",
      error: error.message
    });
  }
});

module.exports = router;
