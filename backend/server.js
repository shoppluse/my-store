const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const productsRouter = require("./routes/products");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("My Store Backend is running...");
});

// API routes
app.use("/api/products", productsRouter);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
