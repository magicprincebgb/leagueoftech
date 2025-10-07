import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  name: String,
  qty: Number,
  price: Number,
  image: String,

  // NEW: store selected options per item (e.g., { Color: "Black", Storage: "128GB" })
  selectedOptions: { type: Object, default: {} }
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [orderItemSchema],
  total: Number,
  isPaid: { type: Boolean, default: false },
  paidAt: Date,
  paymentRef: String,
  shipping: {
    name: String,
    address: String,
    city: String,
    country: String,
    phone: String
  },
  // basic fulfillment tracking
  status: { type: String, enum: ["processing","shipped","delivered","cancelled"], default: "processing" },
  deliveredAt: Date,
  trackingNumber: String,
  notes: String
}, { timestamps: true });

export default mongoose.model("Order", orderSchema);
