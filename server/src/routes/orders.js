import express from "express";
import Order from "../models/Order.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

/**
 * Create order (COD)
 * Expects: { items:[{product,_id,name,qty,price,image,selectedOptions}], shipping:{name,address,city,country,phone} }
 * Returns: created order
 */
router.post("/", protect, async (req, res) => {
  try {
    const { items, shipping } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "No items" });
    }

    // sanitize items + recompute total on server
    const cleanedItems = items.map(it => ({
      product: it.product, // ObjectId
      name: String(it.name || ""),
      qty: Number(it.qty || 1),
      price: Number(it.price || 0),
      image: String(it.image || ""),
      selectedOptions:
        it && typeof it.selectedOptions === "object" && it.selectedOptions
          ? it.selectedOptions
          : {}
    }));

    const total = cleanedItems.reduce((sum, it) => sum + (it.qty * it.price), 0);

    const order = await Order.create({
      user: req.user._id,
      items: cleanedItems,
      total,
      shipping: {
        name: shipping?.name || "",
        address: shipping?.address || "",
        city: shipping?.city || "",
        country: shipping?.country || "",
        phone: shipping?.phone || ""
      },
      paymentMethod: "COD", // explicit (also defaulted in schema)
      isPaid: false          // will flip to true when admin marks delivered
    });

    res.status(201).json(order);
  } catch (err) {
    console.error("Create order failed:", err);
    res.status(500).json({ message: "Failed to create order" });
  }
});

/** Get my orders */
router.get("/", protect, async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
});
// Cancel my order (only if still processing and unpaid)
router.patch("/:id/cancel", protect, async (req, res) => {
  try {
    const o = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!o) return res.status(404).json({ message: "Order not found" });

    if (o.isPaid) return res.status(400).json({ message: "Order already paid" });
    if (["shipped", "delivered", "cancelled"].includes(o.status)) {
      return res.status(400).json({ message: `Cannot cancel when status is ${o.status}` });
    }

    o.status = "cancelled";
    await o.save();
    res.json({ message: "Order cancelled", order: o });
  } catch (e) {
    console.error("Cancel order failed:", e);
    res.status(500).json({ message: "Failed to cancel order" });
  }
});


export default router;
