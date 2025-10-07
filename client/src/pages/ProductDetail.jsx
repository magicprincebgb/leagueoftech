import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api";
import { useStore } from "../context/StoreContext";

function normalizeValues(values){
  const arr = Array.isArray(values) ? values : [];
  return arr.map(v =>
    typeof v === "object"
      ? { label: v.label ?? String(v.value ?? v), priceDelta: Number(v.priceDelta ?? v.delta ?? 0) }
      : { label: String(v), priceDelta: 0 }
  );
}

export default function ProductDetail(){
  const { id } = useParams();
  const [p, setP] = useState(null);
  const [main, setMain] = useState("");
  const [qty, setQty] = useState(1);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const { addToCart, auth } = useStore();

  const [selected, setSelected] = useState({}); // { OptionName: "ValueLabel" }

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setError("");
        const { data } = await api.get(`/products/${encodeURIComponent(id)}`);
        if (!alive) return;
        setP(data || {});
        const first = data?.image || (Array.isArray(data?.images) && data.images[0]) || "";
        setMain(first);
      } catch (e) {
        console.error("Product load failed:", e);
        if (!alive) return;
        setError(e?.response?.data?.message || "Failed to load product.");
        setP({ name: "Not found", price: 0, description: "", images: [], options: [], reviews: [], rating: 0, numReviews: 0 });
        setMain("");
      }
    })();
    return () => { alive = false; };
  }, [id]);

  const safeRating = useMemo(() => {
    const r = Number(p?.rating || 0);
    return Math.max(0, Math.min(5, Math.round(r)));
  }, [p]);

  const optionsNorm = useMemo(() => {
    const opts = Array.isArray(p?.options) ? p.options : [];
    return opts.map(o => ({ name: o?.name || "Option", values: normalizeValues(o?.values) }));
  }, [p]);

  const canAdd = useMemo(() => {
    if (!optionsNorm.length) return true;
    return optionsNorm.every(o => selected[o.name]);
  }, [optionsNorm, selected]);

  // compute sum of selected deltas
  const deltaSum = useMemo(() => {
    let sum = 0;
    for (const o of optionsNorm) {
      const valLabel = selected[o.name];
      if (!valLabel) continue;
      const found = o.values.find(v => v.label === valLabel);
      sum += Number(found?.priceDelta || 0);
    }
    return sum;
  }, [optionsNorm, selected]);

  const finalPrice = useMemo(() => Number(p?.price || 0) + deltaSum, [p, deltaSum]);

  // thumbnails list (primary + gallery)
  const thumbnails = useMemo(() => {
    const list = [ p?.image, ...((Array.isArray(p?.images) ? p.images : []) || []) ].filter(Boolean);
    return Array.from(new Set(list));
  }, [p]);

  const add = () => {
    if (!canAdd) return;
    const item = { ...p, selectedOptions: selected, price: finalPrice, _finalPrice: finalPrice };
    addToCart(item, qty);
  };

  if (!p) return <div className="card" style={{padding:16}}>Loading…</div>;

  return (
    <div className="grid" style={{gridTemplateColumns:"1fr 1fr", gap:24}}>
      {/* Gallery */}
      <div className="card" style={{padding:16}}>
        <div className="p-gallery">
          {/* Fixed-size main image area */}
          <div className="p-gallery-main">
            <img
              src={main || "/images/placeholder.png"}
              alt={p?.name || "Product image"}
              decoding="async"
              fetchpriority="high"
              onError={(e)=>{ e.currentTarget.src = "/images/placeholder.png"; }}
            />
          </div>

          {/* Uniform thumbnails */}
          {thumbnails.length > 1 && (
            <div className="p-gallery-thumbs">
              {thumbnails.map((url, i) => (
                <button
                  key={`${url}-${i}`}
                  type="button"
                  className={`p-gallery-thumb${main === url ? " is-active" : ""}`}
                  aria-label={`Preview ${i+1}`}
                  onClick={()=>setMain(url)}
                >
                  <img
                    src={url}
                    alt={`${p?.name || "Product"} ${i+1}`}
                    loading="lazy"
                    decoding="async"
                    onError={(e)=>{ e.currentTarget.src = "/images/placeholder.png"; }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="card" style={{padding:16, display:"grid", gap:10}}>
        {error && <div role="alert" style={{color:"var(--error, #c00)"}}>{error}</div>}

        <h2>{p?.name || "Product"}</h2>
        <div className="price">৳ {finalPrice.toLocaleString()}</div>
        <div aria-label="rating">
          {"★".repeat(safeRating)}{"☆".repeat(5 - safeRating)}
          <small> ({Number(p?.numReviews || 0)})</small>
        </div>
        <p>{p?.description || ""}</p>

        {optionsNorm.map((opt, idx) => (
          <div key={opt.name || `opt-${idx}`}>
            <div className="label">{opt.name}</div>
            <select
              className="input"
              value={selected[opt.name] || ""}
              onChange={e => setSelected(s => ({ ...s, [opt.name]: e.target.value }))}
            >
              <option value="">Select {opt.name}</option>
              {opt.values.map(v => (
                <option key={`${opt.name}-${v.label}`} value={v.label}>
                  {v.label}{v.priceDelta ? ` (+৳${Number(v.priceDelta).toLocaleString()})` : ""}
                </option>
              ))}
            </select>
          </div>
        ))}

        <div style={{display:"flex", gap:8, alignItems:"center"}}>
          <label className="label" htmlFor="qty">Qty</label>
          <input
            id="qty"
            className="input"
            type="number"
            min="1"
            max="99"
            value={qty}
            onChange={e => {
              const n = parseInt(e.target.value || "1", 10);
              setQty(Number.isFinite(n) ? Math.max(1, Math.min(99, n)) : 1);
            }}
            style={{width:100}}
          />
          <button className="btn btn-primary" onClick={add} disabled={!canAdd}>
            {canAdd ? "Add to Cart" : "Select options"}
          </button>
        </div>

        {Object.keys(selected).length > 0 && (
          <div style={{marginTop:4}}>
            <small>Selected: {Object.entries(selected).map(([k,v]) => `${k}: ${v}`).join(" • ")}</small>
          </div>
        )}
      </div>

      {/* Reviews */}
      <div className="card" style={{padding:16, gridColumn:"1/3"}}>
        <h3>Reviews</h3>
        <ul style={{display:"grid", gap:8, listStyle:"none", padding:0}}>
          {(Array.isArray(p?.reviews) ? p.reviews : []).map((r, i) => {
            const rr = Math.max(0, Math.min(5, Number(r?.rating || 0)));
            return (
              <li key={r?._id || `${r?.name || "user"}-${i}`} className="card" style={{padding:12}}>
                <strong>{r?.name || "User"}</strong> — {"★".repeat(rr)}{"☆".repeat(5 - rr)}
                <div>{r?.comment || ""}</div>
              </li>
            );
          })}
        </ul>

        {auth ? (
          <div style={{marginTop:12, display:"grid", gap:8}}>
            <div className="label">Your rating</div>
            <select value={rating} onChange={e => setRating(Number(e.target.value))}>
              {[5,4,3,2,1].map(v => <option key={v} value={v}>{v}</option>)}
            </select>

            <div className="label">Comment</div>
            <textarea
              className="input"
              rows="3"
              value={comment}
              onChange={e => setComment(e.target.value)}
            />

            <button className="btn btn-primary" onClick={async () => {
              try {
                await api.post(`/products/${encodeURIComponent(id)}/reviews`, { rating, comment });
                const { data } = await api.get(`/products/${encodeURIComponent(id)}`);
                setP(data);
                setComment("");
              } catch (e) {
                console.error(e);
                alert("Failed to submit review");
              }
            }}>Submit Review</button>
          </div>
        ) : (
          <div>Please login to write a review.</div>
        )}
      </div>
    </div>
  );
}
