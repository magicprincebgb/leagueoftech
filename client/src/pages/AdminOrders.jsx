import React, { useEffect, useState } from "react";
import { api } from "../api";

export default function AdminOrders(){
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState(false);

  const load = async () => {
    const { data } = await api.get("/admin/orders");
    setOrders(data);
  };
  useEffect(()=>{ load(); }, []);

  const open = async (id) => {
    const { data } = await api.get(`/admin/orders/${id}`);
    setSelected(data);
  };

  const updateOrder = async (patch) => {
    if (!selected?._id) return;
    setUpdating(true);
    await api.patch(`/admin/orders/${selected._id}`, patch);
    setUpdating(false);
    await load();
    await open(selected._id);
  };

  return (
    <div className="grid" style={{ gridTemplateColumns:"1fr 420px", gap:16 }}>
      <div className="card" style={{padding:16}}>
        <h2>Orders</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Date</th><th>Order #</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o._id}>
                <td>{new Date(o.createdAt).toLocaleString()}</td>
                <td>{o._id.slice(-6)}</td>
                <td>{o.user?.name}<br/><small>{o.user?.email}</small></td>
                <td>{o.items.reduce((a,b)=>a+b.qty,0)}</td>
                <td>৳ {o.total.toLocaleString()}</td>
                <td>{o.status || (o.isPaid ? "processing" : "unpaid")}</td>
                <td><button className="btn" onClick={()=>open(o._id)}>View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Details drawer */}
      <aside className="card" style={{padding:16}}>
        <h3>Order details</h3>
        {!selected ? <p>Select an order →</p> : (
          <div style={{display:"grid", gap:8}}>
            <div><strong>Order:</strong> {selected._id}</div>
            <div><strong>Date:</strong> {new Date(selected.createdAt).toLocaleString()}</div>
            <div><strong>Customer:</strong> {selected.user?.name} ({selected.user?.email})</div>
            <div>
              <strong>Ship to:</strong><br/>
              {selected.shipping?.name}<br/>
              {selected.shipping?.address}<br/>
              {selected.shipping?.city}, {selected.shipping?.country}<br/>
              {selected.shipping?.phone}
            </div>
            <div><strong>Payment:</strong> {selected.isPaid ? `Paid (${selected.paymentRef})` : "Unpaid"}</div>

            <div>
              <strong>Items</strong>
              <ul style={{listStyle:"none", padding:0, display:"grid", gap:6}}>
              {selected.items.map((it, idx)=>(
              <li key={idx} className="card" style={{padding:8}}>
              {it.name} × {it.qty} — ৳ {(it.qty*it.price).toLocaleString()}
              {it.selectedOptions && Object.keys(it.selectedOptions).length > 0 && (
             <div>
             <small>
             {Object.entries(it.selectedOptions)
              .map(([k, v]) => `${k}: ${v}`)
              .join(" • ")}
             </small>
             </div>
              )}
             </li>
              ))}
             </ul>

              <div><strong>Total:</strong> ৳ {selected.total.toLocaleString()}</div>
            </div>

            <div>
              <div className="label">Status</div>
              <select
                className="input"
                value={selected.status || "processing"}
                onChange={(e)=>updateOrder({ status: e.target.value })}
                disabled={updating}
              >
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="label">Tracking Number</div>
            <TrackingEditor
              value={selected.trackingNumber || ""}
              onSave={(v)=>updateOrder({ trackingNumber: v })}
              disabled={updating}
            />

            <div className="label">Notes</div>
            <NotesEditor
              value={selected.notes || ""}
              onSave={(v)=>updateOrder({ notes: v })}
              disabled={updating}
            />
          </div>
        )}
      </aside>
    </div>
  );
}

function TrackingEditor({ value, onSave, disabled }){
  const [v, setV] = React.useState(value);
  React.useEffect(()=>setV(value), [value]);
  return (
    <div style={{display:"flex", gap:8}}>
      <input className="input" value={v} onChange={e=>setV(e.target.value)} />
      <button className="btn" disabled={disabled} onClick={()=>onSave(v)}>Save</button>
    </div>
  );
}

function NotesEditor({ value, onSave, disabled }){
  const [v, setV] = React.useState(value);
  React.useEffect(()=>setV(value), [value]);
  return (
    <div style={{display:"flex", gap:8}}>
      <input className="input" value={v} onChange={e=>setV(e.target.value)} />
      <button className="btn" disabled={disabled} onClick={()=>onSave(v)}>Save</button>
    </div>
  );
}
