import React from "react";
export default function Filters({ category, setCategory, price, setPrice, rating, setRating }){
  return (
    <div className="card" style={{padding:16, position:"sticky", top:72}} aria-label="filters">
      <div className="label">Category</div>
      <select value={category} onChange={e=>setCategory(e.target.value)} aria-label="Category">
        <option value="">All</option>
        <option>Accessories</option>
        <option>Audio</option>
        <option>Cameras</option>
        <option>Laptops</option>
        <option>Storage</option>
        <option>General</option>
      </select>
      <div className="label">Price (৳)</div>
      <div style={{display:"flex",gap:8}}>
        <input className="input" placeholder="Min" value={price.min} onChange={e=>setPrice(p=>({...p,min:e.target.value.replace(/\D/g,'')}))}/>
        <input className="input" placeholder="Max" value={price.max} onChange={e=>setPrice(p=>({...p,max:e.target.value.replace(/\D/g,'')}))}/>
      </div>
      <div className="label">Rating</div>
      <select value={rating} onChange={e=>setRating(e.target.value)} aria-label="Rating">
        <option value="">All</option>
        <option value="4">4★ & up</option>
        <option value="3">3★ & up</option>
        <option value="2">2★ & up</option>
        <option value="1">1★ & up</option>
      </select>
    </div>
  );
}
