import React, { useEffect, useState } from "react";
import { api } from "../api";

export default function Addresses(){
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ label:"Home", name:"", phone:"", address:"", city:"", country:"Bangladesh", isDefault:false });
  const [editing, setEditing] = useState(null);

  const load = async () => {
    const { data } = await api.get("/account/addresses");
    setList(data);
  };
  useEffect(()=>{ load(); },[]);

  const submit = async (e) => {
    e.preventDefault();
    if (editing){
      await api.put(`/account/addresses/${editing}`, form);
      setEditing(null);
    } else {
      await api.post("/account/addresses", form);
    }
    setForm({ label:"Home", name:"", phone:"", address:"", city:"", country:"Bangladesh", isDefault:false });
    load();
  };

  const del = async (id) => {
    if (!window.confirm("Delete this address?")) return;
    await api.delete(`/account/addresses/${id}`);
    load();
  };

  const setDefault = async (id) => {
    const a = list.find(x => x._id === id);
    await api.put(`/account/addresses/${id}`, { isDefault: true, ...a }); // keep fields
    load();
  };

  const startEdit = (a) => {
    setEditing(a._id);
    setForm({ label:a.label||"", name:a.name||"", phone:a.phone||"", address:a.address||"", city:a.city||"", country:a.country||"", isDefault: !!a.isDefault });
  };

  return (
    <div className="grid" style={{ gap:16 }}>
      <section className="card" style={{ padding:16 }}>
        <h2>Saved Addresses</h2>
        {!list.length ? <p>No addresses yet.</p> : (
          <div style={{display:"grid", gap:8}}>
            {list.map(a => (
              <div key={a._id} className="card" style={{padding:12, display:"grid", gap:6}}>
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                  <strong>{a.label || "Address"}</strong>
                  {a.isDefault && <span className="badge">Default</span>}
                </div>
                <div>{a.name} — {a.phone}</div>
                <div>{a.address}</div>
                <div>{a.city}, {a.country}</div>
                <div style={{display:"flex", gap:8}}>
                  <button className="btn" onClick={()=>startEdit(a)}>Edit</button>
                  <button className="btn" onClick={()=>del(a._id)}>Delete</button>
                  {!a.isDefault && <button className="btn" onClick={()=>setDefault(a._id)}>Make Default</button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <form className="card" style={{ padding:16 }} onSubmit={submit}>
        <h3>{editing ? "Edit Address" : "Add Address"}</h3>
        <div className="label">Label</div>
        <input className="input" value={form.label} onChange={e=>setForm({...form,label:e.target.value})} placeholder="Home / Office" />
        <div className="label">Name</div>
        <input className="input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required />
        <div className="label">Phone</div>
        <input className="input" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} required />
        <div className="label">Address</div>
        <input className="input" value={form.address} onChange={e=>setForm({...form,address:e.target.value})} required />
        <div className="label">City</div>
        <input className="input" value={form.city} onChange={e=>setForm({...form,city:e.target.value})} required />
        <div className="label">Country</div>
        <input className="input" value={form.country} onChange={e=>setForm({...form,country:e.target.value})} required />
        <label style={{display:"flex", gap:8, alignItems:"center", marginTop:8}}>
          <input type="checkbox" checked={form.isDefault} onChange={e=>setForm({...form,isDefault:e.target.checked})} />
          Set as default
        </label>
        <div style={{display:"flex", gap:8, marginTop:12}}>
          {editing && <button type="button" className="btn" onClick={()=>{ setEditing(null); setForm({ label:"Home", name:"", phone:"", address:"", city:"", country:"Bangladesh", isDefault:false }); }}>Cancel</button>}
          <button className="btn btn-primary" type="submit">{editing ? "Save Changes" : "Add Address"}</button>
        </div>
      </form>
    </div>
  );
}
