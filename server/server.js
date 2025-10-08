import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./src/config/db.js";
import authRoutes from "./src/routes/auth.js";
import productRoutes from "./src/routes/products.js";
import orderRoutes from "./src/routes/orders.js";
import adminRoutes from "./src/routes/admin.js";
import accountRoutes from "./src/routes/account.js";

dotenv.config();
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5000;
const ORIGIN = process.env.ORIGIN || "http://localhost:5173";

// DB
await connectDB();

// Middlewares
app.use(cors({ origin: ORIGIN, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));
//app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.get("/api/health", (req, res) => res.json({ ok: true, name: "League of Tech API" }));
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/account", accountRoutes);

// Dummy payment
app.post("/api/pay", (req, res) => {
  // pretend success
  const { amount } = req.body || {};
  return res.json({ success: true, reference: "PAY-" + Math.random().toString(36).slice(2), amount });
});
// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({ message: err.message || "Server error" });
  res.set("Cache-Control", "no-store");
  next();
});


app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
