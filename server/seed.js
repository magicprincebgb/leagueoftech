import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "./src/config/db.js";
import User from "./src/models/User.js";
import Product from "./src/models/Product.js";

dotenv.config();
const run = async () => {
  await connectDB();
  await User.deleteMany({});
  await Product.deleteMany({});

  const admin = await User.create({ name: "Admin", email: "admin@leagueoftech.com", password: "Admin@1234", isAdmin: true });
  const user = await User.create({ name: "Demo User", email: "user@leagueoftech.com", password: "User@1234", isAdmin: false });

  const products = [
    {
      name: "Wireless Mouse Pro",
      description: "Ergonomic 2.4G wireless mouse with silent clicks.",
      price: 990,
      category: "Accessories",
      keywords: ["mouse", "wireless", "peripheral"],
      image: "/images/mouse.jpg",
      rating: 4.5, numReviews: 2, stock: 25
    },
    {
      name: "Mechanical Keyboard Lite",
      description: "Compact 87-key mechanical keyboard with blue switches.",
      price: 3490,
      category: "Accessories",
      keywords: ["keyboard", "mechanical", "gaming"],
      image: "/images/keyboard.jpg",
      rating: 4.2, numReviews: 4, stock: 15
    },
    {
      name: "Noise-Cancelling Headphones",
      description: "Over-ear ANC headphones, 30h battery, Type‑C.",
      price: 5990,
      category: "Audio",
      keywords: ["headphones", "ANC", "audio"],
      image: "/images/headphones.jpg",
      rating: 4.7, numReviews: 6, stock: 12
    },
    {
      name: "1080p USB Webcam",
      description: "Full HD webcam with dual mics and privacy shutter.",
      price: 2490,
      category: "Cameras",
      keywords: ["webcam", "camera", "video"],
      image: "/images/webcam.jpg",
      rating: 4.1, numReviews: 3, stock: 20
    }
  ];
  await Product.insertMany(products);
  console.log("Seeded users & products");
  process.exit(0);
};
run();
