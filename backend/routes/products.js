const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const productsFilePath = path.join(__dirname, "../data/products.json");

// GET all products
router.get("/", (req, res) => {
  fs.readFile(productsFilePath, "utf8", (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Failed to read products data" });
    }

    const products = JSON.parse(data);
    res.json(products);
  });
});

// GET single product by id
router.get("/:id", (req, res) => {
  fs.readFile(productsFilePath, "utf8", (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Failed to read products data" });
    }

    const products = JSON.parse(data);
    const product = products.find((p) => p.id === parseInt(req.params.id));

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
  });
});

module.exports = router;
