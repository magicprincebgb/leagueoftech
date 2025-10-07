import React, { useEffect, useRef, useState } from "react";
import { api } from "../api";
import { Link } from "react-router-dom";

function parseValuesCsv(csv){
  // supports "Label:+1500" or just "Label"
  return csv.split(",").map(s => s.trim()).filter(Boolean).map(token => {
    const [labelPart, deltaPart] = token.split(":").map(x => x?.trim());
    const label = labelPart || "";
    const priceDelta = deltaPart ? Number(deltaPart.replace(/[^\-\d.]/g,"")) : 0;
    return { label, priceDelta: Number.isFinite(priceDelta) ? priceDelta : 0 };
  });
}

export default function Admin(){
  const [form, setForm] = useState({ name:"", description:"", price:"", keywords:"", category:"General" });
  const [preview, setPreview] = useState(null);
  const [stats, setStats] = useState({ count: 0, revenue: 0 });
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState("");
  const fileRef = useRef();

  // EDIT modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editOptions, setEditOptions] = useState([]); // [{name, values:[{label,priceDelta}], _csv:''}]
  const [replaceGallery, setReplaceGallery] = useState(false);
  const editPrimaryRef = useRef();
  const editGalleryRef = useRef();

  const loadProducts = async (query = "") => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    params.set("_", Date.now());
    const { data } = await api.get(`/products?${params.toString()}`);
    setProducts(data);
  };

  useEffect(()=>{
    loadProducts();
    api.get("/admin/orders/summary").then(({data}) => setStats(data)).catch(()=>{});
  },[]);

  useEffect(()=>{
    const t = setTimeout(()=> loadProducts(q.trim()), 250);
    return ()=> clearTimeout(t);
  }, [q]);

  // ------- CREATE -------
  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.description || !form.price) return alert("Name, description, and price are required.");
    const fd = new FormData();
    for (const k of Object.keys(form)) fd.append(k, form[k]);
    if (fileRef.current?.files?.[0]) fd.append("image", fileRef.current.files[0]);
    const { data } = await api.post("/admin/products", fd, { headers: { "Content-Type": "multipart/form-data" } });
    alert("Created: " + data.product.name);
    setForm({ name:"", description:"", price:"", keywords:"", category:"General" });
    setPreview(null); if (fileRef.current) fileRef.current.value = "";
    loadProducts(q);
  };

  const deleteProduct = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    await api.delete(`/admin/products/${id}`);
    loadProducts(q);
  };

  // ------- EDIT -------
  const openEdit = (p) => {
    setEditing(p);
    const opts = Array.isArray(p.options) ? p.options : [];
    const normalized = opts.map(o => {
      const values = Array.isArray(o.values) ? o.values : [];
      const norm = values.map(v => (typeof v === "object" ? { label: v.label ?? String(v.value ?? v), priceDelta: Number(v.priceDelta ?? v.delta ?? 0) } : { label: String(v), priceDelta: 0 }));
      const csv = norm.map(v => v.priceDelta ? `${v.label}:+${v.priceDelta}` : v.label).join(", ");
      return { name: o.name || "", values: norm, _csv: csv };
    });
    setEditOptions(normalized);
    setReplaceGallery(false);
    setEditOpen(true);
  };

  const addEditOption = () => setEditOptions(prev => [...prev, { name:"", values:[], _csv:"" }]);
  const removeEditOption = (i) => setEditOptions(prev => prev.filter((_,idx)=>idx!==i));
  const setEditOptionName = (i, val) => setEditOptions(prev => prev.map((o,idx)=> idx===i ? {...o, name:val} : o));
  const setEditOptionValues = (i, csv) => {
    const values = parseValuesCsv(csv);
    setEditOptions(prev => prev.map((o,idx)=> idx===i ? {...o, values, _csv:csv} : o));
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editing) return;
    const fd = new FormData();
    fd.append("name", editing.name || "");
    fd.append("description", editing.description || "");
    fd.append("price", editing.price ?? "");
    fd.append("stock", editing.stock ?? "");
    fd.append("category", editing.category || "");
    fd.append("keywords", (editing.keywords || []).join(","));
    // send normalized options
    const sendOptions = editOptions.map(o => ({ name: o.name, values: (o.values || []).map(v => ({ label: v.label, priceDelta: Number(v.priceDelta || 0) })) }));
    fd.append("options", JSON.stringify(sendOptions));
    fd.append("replaceGallery", replaceGallery ? "true" : "false");
    if (editPrimaryRef.current?.files?.[0]) fd.append("image", editPrimaryRef.current.files[0]);
    if (editGalleryRef.current?.files?.length) {
      [...editGalleryRef.current.files].forEach(f => fd.append("images", f));
    }
    const { data } = await api.patch(`/admin/products/${editing._id}`, fd, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    setEditOpen(false); setEditing(null);
    loadProducts(q);
    alert("Updated: " + data.product.name);
  };

  const removeImage = async (url) => {
    if (!editing) return;
    if (!window.confirm("Remove this image from gallery?")) return;
    await api.delete(`/admin/products/${editing._id}/image`, { params: { url } });
    const fresh = await api.get(`/products/${editing._id}`);
    setEditing(fresh.data);
  };

  return (
    <div style={{display:"grid", gap:16}}>
      {/* Overview */}
      <section className="card" style={{padding:16}}>
        <h2>Admin — Overview</h2>
        <div style={{display:"flex", gap:12, flexWrap:"wrap", alignItems:"center"}}>
          <div>Total Orders: <strong>{stats.count}</strong></div>
          <div>Total Revenue: <strong>৳ {Number(stats.revenue).toLocaleString()}</strong></div>
          <div>Quick links: <Link to="/admin/orders" className="btn">Orders</Link></div>
        </div>
      </section>

      {/* Search */}
      <section className="card" style={{padding:16}}>
        <div className="label">Search products</div>
        <input className="input" placeholder="Search by name or keywords..." value={q} onChange={e=>setQ(e.target.value)} />
      </section>

      {/* Listing */}
      <section className="card" style={{padding:16}}>
        <h2>Product Listings</h2>
        {!products.length ? <p>No products found.</p> : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Options</th><th>Images</th><th></th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p._id}>
                  <td>{p.name}</td>
                  <td>{p.category || "—"}</td>
                  <td>৳ {Number(p.price).toLocaleString()}</td>
                  <td>{p.stock ?? "—"}</td>
                  <td>
                    {Array.isArray(p.options) && p.options.length
                      ? p.options.map(o => (
                          <div key={o.name}>
                            <strong>{o.name}:</strong>{" "}
                            {(o.values || []).map(v => (typeof v === "object" ? v.label : v))
                              .map((label, i) => {
                                const vv = (o.values || [])[i];
                                const d = typeof vv === "object" ? Number(vv.priceDelta || vv.delta || 0) : 0;
                                return d ? `${label} (+৳${d})` : label;
                              })
                              .join(", ")}
                          </div>
                        ))
                      : <span>—</span>}
                  </td>
                  <td>{(p.images?.length || 0) + (p.image ? 1 : 0)}</td>
                  <td style={{display:"flex",gap:8}}>
                    <button className="btn" onClick={()=>openEdit(p)}>Edit</button>
                    <button className="btn" onClick={()=>deleteProduct(p._id, p.name)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Create */}
      <form className="card" style={{padding:16,maxWidth:720,margin:"0 auto"}} onSubmit={submit}>
        <h2>Add Product</h2>
        <div className="label">Name</div>
        <input className="input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/>
        <div className="label">Description</div>
        <textarea className="input" rows="4" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} required/>
        <div className="label">Price (৳)</div>
        <input className="input" inputMode="numeric" value={form.price} onChange={e=>setForm({...form,price:e.target.value.replace(/\D/g,'')})} required/>
        <div className="label">Category</div>
        <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
          <option>General</option><option>Accessories</option><option>Audio</option><option>Cameras</option><option>Laptops</option><option>Storage</option>
        </select>
        <div className="label">Keywords (comma-separated)</div>
        <input className="input" value={form.keywords} onChange={e=>setForm({...form,keywords:e.target.value})}/>
        <div className="label">Primary Image</div>
        <input ref={fileRef} type="file" accept="image/*" onChange={e=> setPreview(e.target.files?.[0] ? URL.createObjectURL(e.target.files[0]) : null)}/>
        {preview && <img alt="preview" src={preview} style={{marginTop:8,maxHeight:220,borderRadius:12}}/>}
        <button className="btn btn-primary" type="submit" style={{marginTop:12}}>Create Product</button>
      </form>

      {/* EDIT MODAL / DRAWER */}
      {editOpen && editing && (
        <div role="dialog" aria-modal="true" style={{position:"fixed",inset:0,background:"rgba(0,0,0,.35)",display:"grid",placeItems:"center",zIndex:50}}>
          <form className="card" style={{padding:16, width:"min(920px, 96vw)", maxHeight:"90vh", overflow:"auto"}} onSubmit={saveEdit}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <h2>Edit: {editing.name}</h2>
              <button type="button" className="btn" onClick={()=>{ setEditOpen(false); setEditing(null); }}>Close</button>
            </div>

            <div className="grid" style={{gridTemplateColumns:"1fr 1fr", gap:12}}>
              <div>
                <div className="label">Name</div>
                <input className="input" value={editing.name || ""} onChange={e=>setEditing(s=>({...s, name:e.target.value}))}/>
              </div>
              <div>
                <div className="label">Category</div>
                <input className="input" value={editing.category || ""} onChange={e=>setEditing(s=>({...s, category:e.target.value}))}/>
              </div>
              <div>
                <div className="label">Price (৳)</div>
                <input className="input" value={editing.price ?? ""} onChange={e=>setEditing(s=>({...s, price:e.target.value.replace(/\D/g,'')}))}/>
              </div>
              <div>
                <div className="label">Stock</div>
                <input className="input" value={editing.stock ?? ""} onChange={e=>setEditing(s=>({...s, stock:e.target.value.replace(/\D/g,'')}))}/>
              </div>
            </div>

            <div className="label">Description</div>
            <textarea className="input" rows="4" value={editing.description || ""} onChange={e=>setEditing(s=>({...s, description:e.target.value}))}/>

            <div className="label">Keywords (comma-separated)</div>
            <input className="input" value={(editing.keywords || []).join(",")} onChange={e=>setEditing(s=>({...s, keywords:e.target.value.split(",").map(t=>t.trim()).filter(Boolean)}))}/>

            {/* Options builder with price deltas */}
            <div className="card" style={{padding:12, marginTop:12}}>
              <h3>Options</h3>
              <div style={{display:"grid", gap:8}}>
                {editOptions.map((opt, idx) => (
                  <div key={idx} className="card" style={{padding:8}}>
                    <div className="label">Option Name</div>
                    <input className="input" value={opt.name} onChange={e=>setEditOptionName(idx, e.target.value)} />
                    <div className="label">Values (e.g. <em>128GB:+0, 256GB:+1500</em>)</div>
                    <input
                      className="input"
                      value={opt._csv ?? ""}
                      onChange={e=>setEditOptionValues(idx, e.target.value)}
                      placeholder="Black, Blue, Red  OR  128GB:+0, 256GB:+1500"
                    />
                    <button type="button" className="btn" style={{marginTop:8}} onClick={()=>removeEditOption(idx)}>Remove</button>
                  </div>
                ))}
                <button type="button" className="btn" onClick={addEditOption}>+ Add Option</button>
              </div>
            </div>

            {/* Images */}
            <div className="card" style={{padding:12, marginTop:12}}>
              <h3>Images</h3>
              <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
                {editing.image && (
                  <div className="card" style={{padding:8}}>
                    <img src={editing.image} alt="primary" style={{height:80}} />
                    <div><small>Primary</small></div>
                  </div>
                )}
                {(editing.images || []).map(url => (
                  <div key={url} className="card" style={{padding:8}}>
                    <img src={url} alt="" style={{height:80}} />
                    <div style={{display:"flex", gap:6, marginTop:6}}>
                      <button type="button" className="btn" onClick={()=>removeImage(url)}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="label" style={{marginTop:8}}>Replace primary</div>
              <input ref={editPrimaryRef} type="file" accept="image/*" />
              <div className="label" style={{marginTop:8}}>Add gallery images (you can select multiple)</div>
              <input ref={editGalleryRef} type="file" accept="image/*" multiple />
              <label style={{display:"flex", alignItems:"center", gap:6, marginTop:8}}>
                <input type="checkbox" checked={replaceGallery} onChange={e=>setReplaceGallery(e.target.checked)} />
                Replace existing gallery instead of appending
              </label>
            </div>

            <div style={{display:"flex", justifyContent:"flex-end", gap:8, marginTop:12}}>
              <button type="button" className="btn" onClick={()=>{ setEditOpen(false); setEditing(null); }}>Cancel</button>
              <button className="btn btn-primary" type="submit">Save Changes</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
