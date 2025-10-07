import React from "react";
import { Link } from "react-router-dom";

/** Compute min/max delta from options (supports both strings and objects) */
function getDeltaRange(p) {
  const opts = Array.isArray(p?.options) ? p.options : [];
  if (!opts.length) return { min: 0, max: 0 };

  let min = 0, max = 0;
  for (const o of opts) {
    const values = Array.isArray(o?.values) ? o.values : [];
    if (!values.length) continue;

    // Normalize: "128GB" => { label:"128GB", priceDelta:0 }
    const norm = values.map(v =>
      typeof v === "object" ? { label: v.label ?? String(v.value ?? v), priceDelta: Number(v.priceDelta ?? v.delta ?? 0) }
                            : { label: String(v), priceDelta: 0 }
    );
    const deltas = norm.map(x => x.priceDelta);
    const minDelta = Math.min(...deltas);
    const maxDelta = Math.max(...deltas);
    min += minDelta;
    max += maxDelta;
  }
  return { min, max };
}

export default function ProductCard({ p, onAdd, onWish, onCompare }){
  const { min, max } = getDeltaRange(p);
  const base = Number(p.price || 0);
  const from = base + Math.min(0, min); // in case someone sets negative deltas later
  const to   = base + Math.max(0, max);

  const priceLabel = (to > from)
    ? `৳ ${from.toLocaleString()} – ৳ ${to.toLocaleString()}`
    : `৳ ${from.toLocaleString()}`;

  return (
    <div className="card p-card" aria-label={p.name}>
      <Link to={`/product/${p._id}`} className="p-thumb" aria-label={p.name}>
        <img src={p.image} alt={p.name} loading="lazy" />
      </Link>

      <div style={{display:"grid",gap:6}}>
        <Link to={`/product/${p._id}`}><strong>{p.name}</strong></Link>
        <div className="price">{priceLabel}</div>
        <div aria-label="rating">
          {'★'.repeat(Math.round(p.rating||0))}
          {'☆'.repeat(5-Math.round(p.rating||0))}
          <small> ({p.numReviews||0})</small>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <button className="btn btn-primary" onClick={()=>onAdd(p)}>Add to Cart</button>
          <button className="btn" onClick={()=>onWish?.(p)}>♡ Wishlist</button>
          <button className="btn" onClick={()=>onCompare?.(p)}>⇄ Compare</button>
        </div>
      </div>
    </div>
  );
}
