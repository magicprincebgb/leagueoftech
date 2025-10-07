import express from "express";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Get saved addresses
router.get("/addresses", protect, async (req, res) => {
  const user = await User.findById(req.user._id).select("addresses");
  res.json(user.addresses || []);
});

// Add address
router.post("/addresses", protect, async (req, res) => {
  const { label, name, phone, address, city, country, isDefault } = req.body;
  if (!name || !phone || !address || !city || !country) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  const user = await User.findById(req.user._id);
  const addr = { label, name, phone, address, city, country, isDefault: !!isDefault };
  if (addr.isDefault) user.addresses.forEach(a => a.isDefault = false);
  user.addresses.push(addr);
  await user.save();
  res.json({ message: "Saved", addresses: user.addresses });
});

// Update address (label/fields / set default)
router.put("/addresses/:addrId", protect, async (req, res) => {
  const { addrId } = req.params;
  const user = await User.findById(req.user._id);
  const a = user.addresses.id(addrId);
  if (!a) return res.status(404).json({ message: "Address not found" });
  const { label, name, phone, address, city, country, isDefault } = req.body;
  if (label !== undefined) a.label = label;
  if (name !== undefined) a.name = name;
  if (phone !== undefined) a.phone = phone;
  if (address !== undefined) a.address = address;
  if (city !== undefined) a.city = city;
  if (country !== undefined) a.country = country;
  if (isDefault !== undefined) {
    if (isDefault) user.addresses.forEach(x => x.isDefault = false);
    a.isDefault = !!isDefault;
  }
  await user.save();
  res.json({ message: "Updated", addresses: user.addresses });
});

// Delete address
router.delete("/addresses/:addrId", protect, async (req, res) => {
  const { addrId } = req.params;
  const user = await User.findById(req.user._id);
  const a = user.addresses.id(addrId);
  if (!a) return res.status(404).json({ message: "Address not found" });
  a.deleteOne();
  await user.save();
  res.json({ message: "Deleted", addresses: user.addresses });
});

export default router;
