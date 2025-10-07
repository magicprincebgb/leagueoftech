import mongoose from "mongoose";

/** Option value supports either:
 *  - { label: "128GB", priceDelta: 1500 }
 *  - or legacy plain string "128GB" (auto-converted to {label:"128GB", priceDelta:0})
 */
const optionValueSchema = new mongoose.Schema({
  label: { type: String, required: true },
  priceDelta: { type: Number, default: 0 }
}, { _id: false });

const optionSchema = new mongoose.Schema({
  name: { type: String, required: true },         // e.g., "Storage", "Color"
  values: {
    type: [optionValueSchema],
    default: [],
    // Convert legacy strings into {label, priceDelta:0}
    set(arr) {
      if (!Array.isArray(arr)) return [];
      return arr.map(v => {
        if (v && typeof v === "object") {
          const label = String(v.label ?? v.value ?? "");
          const priceDelta = Number(v.priceDelta ?? v.delta ?? 0) || 0;
          return { label, priceDelta };
        }
        return { label: String(v ?? ""), priceDelta: 0 };
      });
    }
  }
}, { _id: false });

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: String,
  rating: { type: Number, min: 1, max: 5 },
  comment: String
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true }, // Base price (৳)
  category: { type: String, default: "General" },
  keywords: [String],
  image: { type: String },
  images: { type: [String], default: [] },   // Gallery
  rating: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  reviews: [reviewSchema],
  stock: { type: Number, default: 10 },

  // Options with price deltas (backward compatible via setter above)
  options: [optionSchema]
}, { timestamps: true });

export default mongoose.model("Product", productSchema);
