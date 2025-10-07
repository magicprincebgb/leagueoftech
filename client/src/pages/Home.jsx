import React, { useEffect, useState } from "react";
import { api } from "../api";
import { useStore } from "../context/StoreContext";
import ProductCard from "../components/ProductCard";
import { Link } from "react-router-dom";

export default function Home(){
  const { addToCart, setWishlist, wishlist, setCompare, compare } = useStore();
  const [featured, setFeatured] = useState([]);

  useEffect(()=>{
    api.get("/products").then(({data})=> setFeatured(data.slice(0,6)));
  },[]);

  const onWish = (p) => setWishlist(w => w.some(x=>x._id===p._id)?w:w.concat(p));
  const onCompare = (p) => setCompare(c => c.some(x=>x._id===p._id)?c:c.concat(p));

  return (
    <div style={{display:"grid",gap:24}}>
      <section className="hero card">
        <div className="hero-inner container">
          <h1>Affordable Tech, Unbeatable Prices!</h1>
          <p>Discover gadgets that don't break the bank. Curated tech, fair prices, fast checkout.</p>
          <div className="hero-cta">
            <Link to="/shop" className="btn btn-primary">Shop Now</Link>
            <a className="btn" href="#promos">See Promotions</a>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}} aria-label="shortcut tip">
            {/*<span className="kbd">/</span> to focus search*/}
          </div>
        </div>
      </section>

      <section className="container">
        <h2>Featured Products</h2>
        <div className="grid grid-3">
          {featured.map(p => <ProductCard key={p._id} p={p} onAdd={addToCart} onWish={onWish} onCompare={onCompare} />)}
        </div>
      </section>

      {/*<section id="promos" className="container card" style={{padding:16}}>
        <h2>Limited-Time Promotions</h2>
        <ul>
          <li>Check our Facebook page for promotional updates!</li>
        </ul>
      </section>*/}
    </div>
  );
}
