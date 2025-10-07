import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = express.Router();

// __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads dir exists (prevents ENOENT on Windows)
const uploadDir = path.join(__dirname, "../../uploads");
fs.mkdirSync(uploadDir, { recursive: true });

// Multer setup (primary + gallery)
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB per image
  fileFilter: (req, file, cb) => {
    if (/\.(jpg|jpeg|png|webp)$/i.test(file.originalname)) return cb(null, true);
    cb(new Error("Only image files allowed (jpg, jpeg, png, webp)"));
  }
});

const fileUrl = f => `/uploads/${f.filename}`;

/** Normalize options payload into
 *  [{ name, values:[{label, priceDelta}] }]
 *  Accepts previous shape where values were strings.
 */
function normalizeOptions(input) {
  if (!input) return [];
  let raw = input;
  try { if (typeof raw === "string") raw = JSON.parse(raw); } catch { /* ignore */ }
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(x => x?.name && Array.isArray(x.values))
    .map(x => ({
      name: String(x.name),
      values: x.values.map(v => {
        if (v && typeof v === "object") {
          const label = String(v.label ?? v.value ?? "");
          const priceDelta = Number(v.priceDelta ?? v.delta ?? 0) || 0;
          return { label, priceDelta };
        }
        return { label: String(v ?? ""), priceDelta: 0 };
      })
    }));
}

/* ===========================
   PRODUCTS (ADMIN)
   =========================== */

// CREATE product (supports: primary image + gallery + options with deltas)
router.post(
  "/products",
  protect,
  adminOnly,
  upload.fields([{ name: "image", maxCount: 1 }, { name: "images", maxCount: 8 }]),
  async (req, res) => {
    try {
      const { name, description, price, keywords, category, options } = req.body;
      if (!name || !description || !price) {
        return res.status(400).json({ message: "Name, description, price required" });
      }

      const kws = (keywords || "").split(",").map(k => k.trim()).filter(Boolean);
      const primary = req.files?.image?.[0] ? fileUrl(req.files.image[0]) : null;
      const gallery = (req.files?.images || []).map(fileUrl);

      const product = await Product.create({
        name,
        description,
        price: Number(price),
        keywords: kws,
        category: category || "General",
        image: primary,
        images: gallery,
        options: normalizeOptions(options)   // <-- keep deltas
      });

      res.json({ message: "Product created", product });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }
);

// UPDATE product (fields + options + images)
router.patch(
  "/products/:id",
  protect,
  adminOnly,
  upload.fields([{ name: "image", maxCount: 1 }, { name: "images", maxCount: 8 }]),
  async (req, res) => {
    try {
      const { name, description, price, stock, category, keywords, options, replaceGallery } = req.body;
      const p = await Product.findById(req.params.id);
      if (!p) return res.status(404).json({ message: "Product not found" });

      if (name !== undefined) p.name = name;
      if (description !== undefined) p.description = description;
      if (price !== undefined) p.price = Number(price);
      if (stock !== undefined) p.stock = Number(stock);
      if (category !== undefined) p.category = category;
      if (keywords !== undefined) {
        p.keywords = String(keywords).split(",").map(k => k.trim()).filter(Boolean);
      }

      // options (now supports deltas)
      if (options !== undefined) {
        p.options = normalizeOptions(options);
      }

      // images
      if (req.files?.image?.[0]) p.image = fileUrl(req.files.image[0]);
      if (req.files?.images?.length) {
        const newOnes = req.files.images.map(fileUrl);
        if (String(replaceGallery) === "true") p.images = newOnes;
        else p.images.push(...newOnes);
      }

      await p.save();
      res.json({ message: "Updated", product: p });
    } catch (err) {
      res.status(500).json({ message: "Error updating product", error: err.message });
    }
  }
);

// DELETE product
router.delete("/products/:id", protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    await product.deleteOne();
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting product", error: err.message });
  }
});

// DELETE a single image from a product (optional)
router.delete("/products/:id/image", protect, adminOnly, async (req, res) => {
  const { url } = req.query; // /api/admin/products/:id/image?url=/uploads/abc.webp
  const p = await Product.findById(req.params.id);
  if (!p) return res.status(404).json({ message: "Product not found" });
  p.images = (p.images || []).filter(i => i !== url);
  if (p.image === url) p.image = null;
  await p.save();
  res.json({ message: "Image removed", product: p });
});

/* ===========================
   ORDERS (ADMIN)
   =========================== */

// summary (count + revenue)
router.get("/orders/summary", protect, adminOnly, async (req, res) => {
  const count = await Order.countDocuments({});
  const agg = await Order.aggregate([{ $group: { _id: null, revenue: { $sum: "$total" } } }]);
  res.json({ count, revenue: agg[0]?.revenue || 0 });
});

// list (with customer info)
router.get("/orders", protect, adminOnly, async (req, res) => {
  const list = await Order.find({})
    .populate("user", "name email")
    .sort({ createdAt: -1 })
    .limit(200);
  res.json(list);
});

// one order
router.get("/orders/:id", protect, adminOnly, async (req, res) => {
  const o = await Order.findById(req.params.id).populate("user", "name email");
  if (!o) return res.status(404).json({ message: "Order not found" });
  res.json(o);
});

// update order meta (status, tracking, notes) — auto-paid on delivery for COD or legacy (missing) method
router.patch("/orders/:id", protect, adminOnly, async (req, res) => {
  try {
    const { status, trackingNumber, deliveredAt, notes } = req.body;
    const o = await Order.findById(req.params.id);
    if (!o) return res.status(404).json({ message: "Order not found" });

    const allowed = ["processing", "shipped", "delivered", "cancelled"];
    if (status && !allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    if (status) o.status = status;
    if (trackingNumber !== undefined) o.trackingNumber = trackingNumber;
    if (notes !== undefined) o.notes = notes;

    // Auto mark as paid when delivered for COD/legacy
    const isCODOrLegacy = !o.paymentMethod || o.paymentMethod === "COD";
    if (isCODOrLegacy && status === "delivered") {
      if (!o.isPaid) {
        o.isPaid = true;
        o.paidAt = new Date();
      }
      o.deliveredAt = o.deliveredAt || new Date();
    }

    if (deliveredAt !== undefined) {
      o.deliveredAt = deliveredAt ? new Date(deliveredAt) : null;
    }

    await o.save();
    res.json({ message: "Updated", order: o });
  } catch (err) {
    console.error("Admin update order failed:", err);
    res.status(500).json({ message: "Error updating order" });
  }
});

export default router;
