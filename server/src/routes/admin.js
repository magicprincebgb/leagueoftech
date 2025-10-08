import express from "express";
import multer from "multer";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import { protect, adminOnly } from "../middleware/auth.js";

// ===== Cloudinary (persistent image storage) =====
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer in-memory storage -> we stream buffers to Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per image
  fileFilter: (req, file, cb) => {
    if (/\.(jpg|jpeg|png|webp)$/i.test(file.originalname)) return cb(null, true);
    cb(new Error("Only image files allowed (jpg, jpeg, png, webp)"));
  }
});

// Upload single file buffer to Cloudinary, return secure_url (+ public_id)
const uploadToCloudinary = (file) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "leagueoftech/products", resource_type: "image" },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(file.buffer);
  });

// Optional helper to delete by public_id if you want to truly remove from Cloudinary
async function destroyFromCloudinaryByUrl(url) {
  try {
    // Expecting URLs like: https://res.cloudinary.com/<cloud>/image/upload/v123/leagueoftech/products/<public_id>.<ext>
    const m = url.match(/\/upload\/(?:v\d+\/)?(.+)\.(?:jpg|jpeg|png|webp)$/i);
    if (!m) return;
    const publicId = m[1];
    await cloudinary.uploader.destroy(publicId);
  } catch {
    // swallow errors (safe best-effort)
  }
}

/** Normalize options payload into
 *  [{ name, values:[{label, priceDelta}] }]
 *  Accepts previous shape where values were strings or { label, priceDelta } objects.
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

const router = express.Router();

/* ===========================
   PRODUCTS (ADMIN)
   =========================== */

// CREATE product (primary + gallery + options with deltas)
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

      // Upload primary image
      let primaryUrl = null;
      if (req.files?.image?.[0]) {
        const up = await uploadToCloudinary(req.files.image[0]);
        primaryUrl = up.secure_url;
      }

      // Upload gallery
      const gallery = [];
      if (req.files?.images?.length) {
        for (const f of req.files.images) {
          const up = await uploadToCloudinary(f);
          gallery.push(up.secure_url);
        }
      }

      const product = await Product.create({
        name,
        description,
        price: Number(price),
        keywords: kws,
        category: category || "General",
        image: primaryUrl,
        images: gallery,
        options: normalizeOptions(options)
      });

      res.json({ message: "Product created", product });
    } catch (e) {
      console.error("Create product failed:", e);
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

      if (options !== undefined) {
        p.options = normalizeOptions(options);
      }

      // Primary image
      if (req.files?.image?.[0]) {
        const up = await uploadToCloudinary(req.files.image[0]);
        p.image = up.secure_url;
      }
      // Gallery images
      if (req.files?.images?.length) {
        const newOnes = [];
        for (const f of req.files.images) {
          const up = await uploadToCloudinary(f);
          newOnes.push(up.secure_url);
        }
        if (String(replaceGallery) === "true") p.images = newOnes;
        else p.images.push(...newOnes);
      }

      await p.save();
      res.json({ message: "Updated", product: p });
    } catch (err) {
      console.error("Update product failed:", err);
      res.status(500).json({ message: "Error updating product", error: err.message });
    }
  }
);

// DELETE product
router.delete("/products/:id", protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Optional: remove images from Cloudinary too (best-effort)
    const allUrls = [product.image, ...(product.images || [])].filter(Boolean);
    await Promise.all(allUrls.map(u => destroyFromCloudinaryByUrl(u)));

    await product.deleteOne();
    res.json({ message: "Product deleted" });
  } catch (err) {
    console.error("Delete product failed:", err);
    res.status(500).json({ message: "Error deleting product", error: err.message });
  }
});

// DELETE a single image from a product
router.delete("/products/:id/image", protect, adminOnly, async (req, res) => {
  const { url } = req.query; // /api/admin/products/:id/image?url=<full_cloudinary_url>
  const p = await Product.findById(req.params.id);
  if (!p) return res.status(404).json({ message: "Product not found" });

  p.images = (p.images || []).filter(i => i !== url);
  if (p.image === url) p.image = null;

  // Optional: remove from Cloudinary (best-effort)
  if (url && /^https?:\/\/res\.cloudinary\.com\//.test(url)) {
    await destroyFromCloudinaryByUrl(url);
  }

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

// update order meta (status, tracking, notes) — auto-paid on delivery for COD/legacy method
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

    // Auto mark as paid when delivered for COD or legacy (missing paymentMethod)
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
