import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import NewsletterPopup from "./components/NewsletterPopup";
import StoreProvider from "./context/StoreContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminOrders from "./pages/AdminOrders";

import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Account from "./pages/Account";
import Orders from "./pages/Orders";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import ErrorBoundary from "./components/ErrorBoundary";

export default function App(){
  return (
    <StoreProvider>
      <Navbar />
      <main className="container" style={{padding:"1rem 0"}}>
        <Suspense fallback={<div>Loading…</div>}>
          <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Home/>}/>
            <Route path="/admin/orders" element={<ProtectedRoute admin><AdminOrders/></ProtectedRoute>}/>
            <Route path="/admin" element={<ProtectedRoute admin><Admin/></ProtectedRoute>}/>
            <Route path="/shop" element={<Shop/>}/>
            <Route path="/product/:id" element={<ProductDetail/>}/>
            <Route path="/cart" element={<Cart/>}/>
            <Route path="/checkout" element={<ProtectedRoute><Checkout/></ProtectedRoute>}/>
            <Route path="/about" element={<About/>}/>
            <Route path="/contact" element={<Contact/>}/>
            <Route path="/login" element={<Login/>}/>
            <Route path="/register" element={<Register/>}/>
            <Route path="/account" element={<ProtectedRoute><Account/></ProtectedRoute>}/>
            <Route path="/orders" element={<ProtectedRoute><Orders/></ProtectedRoute>}/>
            
            <Route path="*" element={<NotFound/>}/>
          </Routes>
          </ErrorBoundary>
        </Suspense>
      </main>
      <NewsletterPopup />
      <Footer />
    </StoreProvider>
  );
}
