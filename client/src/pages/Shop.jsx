import React, { useEffect, useState } from "react";
import { api } from "../api";
import { useLocation } from "react-router-dom";
import Filters from "../components/Filters";
import ProductCard from "../components/ProductCard";
import { useStore } from "../context/StoreContext";

export default function Shop(){
  const loc = useLocation();
  const urlQ = new URLSearchParams(loc.search).get("q") || "";
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState({min:"",max:""});
  const [rating, setRating] = useState("");
  const [list, setList] = useState([]);
  const { addToCart, setWishlist, setCompare } = useStore();

  const fetchList = async () => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (price.min) params.set("min", price.min);
    if (price.max) params.set("max", price.max);
    if (rating) params.set("rating", rating);
    if (urlQ) params.set("q", urlQ);
    const { data } = await api.get(`/products?${params.toString()}`);
    setList(data);
  };

  useEffect(()=>{ fetchList(); },[category, price.min, price.max, rating, urlQ]);

  return (
    <div style={{display:"grid",gridTemplateColumns:"280px 1fr",gap:16}}>
      <Filters category={category} setCategory={setCategory} price={price} setPrice={setPrice} rating={rating} setRating={setRating} />
      <div>
        <h2>Shop {urlQ && <>— results for “{urlQ}”</>}</h2>
        <div className="grid grid-3">
          {list.map(p => <ProductCard key={p._id} p={p} onAdd={addToCart} onWish={(x)=>setWishlist(w=>w.concat(x))} onCompare={(x)=>setCompare(c=>c.concat(x))}/>)}
        </div>
      </div>
    </div>
  );
}
