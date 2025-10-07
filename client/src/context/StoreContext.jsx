import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, setAuth } from "../api";

const Ctx = createContext(null);
export const useStore = () => useContext(Ctx);

const LS = {
  THEME: "lot_theme",
  CART: "lot_cart",
  WISH: "lot_wishlist",
  CMP: "lot_compare",
  AUTH: "lot_auth"
};

export default function StoreProvider({ children }) {
  const [theme, setTheme] = useState(localStorage.getItem(LS.THEME) || "light");
  const [cart, setCart] = useState(JSON.parse(localStorage.getItem(LS.CART) || "[]"));
  const [wishlist, setWishlist] = useState(JSON.parse(localStorage.getItem(LS.WISH) || "[]"));
  const [compare, setCompare] = useState(JSON.parse(localStorage.getItem(LS.CMP) || "[]"));
  const [auth, setAuthState] = useState(JSON.parse(localStorage.getItem(LS.AUTH) || "null"));

  useEffect(() => { document.documentElement.classList.toggle("dark", theme === "dark"); localStorage.setItem(LS.THEME, theme); }, [theme]);
  useEffect(() => { localStorage.setItem(LS.CART, JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem(LS.WISH, JSON.stringify(wishlist)); }, [wishlist]);
  useEffect(() => { localStorage.setItem(LS.CMP, JSON.stringify(compare)); }, [compare]);
  useEffect(() => { localStorage.setItem(LS.AUTH, JSON.stringify(auth)); setAuth(auth?.token); }, [auth]);

  const addToCart = (p, qty=1) => setCart(prev => {
    const price = Number(p._finalPrice ?? p.price ?? 0); // <- use computed price if provided
    const selectedOptions = p.selectedOptions || {};
    const key = `${p._id}|${JSON.stringify(selectedOptions)}`;

    const ex = prev.find(i => `${i._id}|${JSON.stringify(i.selectedOptions || {})}` === key);
    if (ex) {
      return prev.map(i => (
        `${i._id}|${JSON.stringify(i.selectedOptions || {})}` === key
          ? { ...i, qty: Math.min(99, i.qty + qty) }
          : i
      ));
    }
    return [...prev, { ...p, price, qty, selectedOptions }];
  });

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i._id !== id));
  const updateQty = (id, qty) => setCart(prev => prev.map(i => i._id===id?{...i, qty:Math.max(1,Math.min(99,qty))}:i));

  const totals = useMemo(() => ({
    items: cart.reduce((a,b)=>a+b.qty,0),
    amount: cart.reduce((a,b)=>a+b.qty*Number(b.price || 0),0)
  }), [cart]);

  const clearCart = () => setCart([]);
  const value = { theme, setTheme, cart, addToCart, removeFromCart, updateQty, totals, wishlist, setWishlist, compare, setCompare, auth, setAuth: setAuthState, clearCart };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
