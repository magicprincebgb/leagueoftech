import express from "express";
import mongoose from "mongoose"; 
import Product from "../models/Product.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// GET /api/products (with filters)
router.get("/", async (req, res) => {
  const { category, min, max, rating, q } = req.query;
  const filter = {};
  if (category) filter.category = category;
  if (rating) filter.rating = { $gte: Number(rating) };
  if (min || max) filter.price = { ...(min?{ $gte: Number(min)}:{}), ...(max?{ $lte: Number(max)}:{}) };
  if (q) filter.$or = [
    { name: { $regex: q, $options: "i" } },
    { keywords: { $elemMatch: { $regex: q, $options: "i" } } }
  ];
  const products = await Product.find(filter).sort({ createdAt: -1 }).limit(100);
  res.json(products);
});

// Live suggestions
router.get("/search", async (req, res) => {
  const q = req.query.q || "";
  const products = await Product.find({ name: { $regex: q, $options: "i" } }).select("name _id").limit(8);
  res.json(products);
});

// single
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid product id" });
  }
  try {
    const p = await Product.findById(id);
    if (!p) return res.status(404).json({ message: "Not found" });
    res.json(p);
  } catch (err) {
    console.error("GET /products/:id failed:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// review
router.post("/:id/reviews", protect, async (req, res) => {
  const { rating, comment } = req.body;
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });
  const already = product.reviews.find(r => r.user.toString() === req.user._id.toString());
  if (already) return res.status(400).json({ message: "Already reviewed" });
  product.reviews.push({ user: req.user._id, name: req.user.name, rating, comment });
  product.numReviews = product.reviews.length;
  product.rating = product.reviews.reduce((a, b) => a + b.rating, 0) / product.reviews.length;
  await product.save();
  res.json({ message: "Review added" });
});

export default router;
