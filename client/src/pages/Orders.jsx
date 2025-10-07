import React, { useEffect, useState } from "react";
import { api } from "../api";
import { useStore } from "../context/StoreContext";
import { Link, useNavigate } from "react-router-dom";

export default function Orders(){
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(""); // which order is being canceled
  const { auth } = useStore();
  const nav = useNavigate();

  const load = async () => {
    try {
      const { data } = await api.get("/orders");
      setOrders(data);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load orders");
      if (e?.response?.status === 401) nav("/login");
    }
  };

  useEffect(()=>{
    if (!auth) return; // wait for auth to hydrate from localStorage
    load();
  },[auth, nav]);

  const cancelOrder = async (id) => {
    if (!window.confirm("Cancel this order?")) return;
    try {
      setBusyId(id);
      await api.patch(`/orders/${id}/cancel`);
      await load();
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to cancel order");
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="card" style={{padding:16}}>
      <h2>Order History</h2>
      {error && <p role="alert">{error}</p>}

      {!orders.length ? (
        <p>No orders yet. <Link to="/shop">Shop now</Link></p>
      ) : (
        <>
          {/* Summary table */}
          <table className="table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Paid</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => {
                const status = o.status || (o.isPaid ? "processing" : "unpaid");
                const canCancel = status === "processing" && !o.isPaid;
                return (
                  <tr key={o._id}>
                    <td>{o._id.slice(-6)}</td>
                    <td>{o.items.reduce((a,b)=>a+b.qty,0)}</td>
                    <td>৳ {o.total.toLocaleString()}</td>
                    <td><StatusBadge status={status} /></td>
                    <td>{o.isPaid ? "Yes" : (o.paymentMethod === "COD" ? "COD" : "No")}</td>
                    <td>
                      {canCancel ? (
                        <button
                          className="btn"
                          disabled={busyId === o._id}
                          onClick={() => cancelOrder(o._id)}
                          title="Cancel this order"
                        >
                          {busyId === o._id ? "Cancelling…" : "Cancel"}
                        </button>
                      ) : (
                        <span style={{opacity:.6}}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Details (with selected options + shipping + tracking + status) */}
          <div style={{marginTop:12}}>
            <h3>Details</h3>
            {orders.map(o => {
              const status = o.status || (o.isPaid ? "processing" : "unpaid");
              const canCancel = status === "processing" && !o.isPaid;
              return (
                <div key={o._id} className="card" style={{padding:12, marginBottom:8}}>
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", gap:8, flexWrap:"wrap"}}>
                    <strong>Order {o._id.slice(-6)}</strong>
                    <div style={{display:"flex", gap:8, alignItems:"center"}}>
                      <StatusBadge status={status} />
                      <span className="badge" title="Paid status">
                        {o.isPaid ? "Paid" : (o.paymentMethod === "COD" ? "COD" : "Unpaid")}
                      </span>
                      {canCancel && (
                        <button
                          className="btn"
                          disabled={busyId === o._id}
                          onClick={() => cancelOrder(o._id)}
                        >
                          {busyId === o._id ? "Cancelling…" : "Cancel Order"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Shipping summary */}
                  {o.shipping && (
                    <div style={{marginTop:6}}>
                      <small>
                        <strong>Ship to:</strong> {o.shipping?.name} — {o.shipping?.phone}<br/>
                        {o.shipping?.address}, {o.shipping?.city}, {o.shipping?.country}
                      </small>
                    </div>
                  )}

                  {/* Tracking */}
                  {(o.trackingNumber || o.deliveredAt) && (
                    <div style={{marginTop:6}}>
                      <small>
                        {o.trackingNumber && <>Tracking: <code>{o.trackingNumber}</code><br/></>}
                        {o.deliveredAt && <>Delivered: {new Date(o.deliveredAt).toLocaleString()}<br/></>}
                      </small>
                    </div>
                  )}

                  <ul style={{listStyle:"none", padding:0, margin:8}}>
                    {o.items.map((it, idx) => (
                      <li key={idx} style={{marginBottom:4}}>
                        {it.name} × {it.qty} — ৳ {(it.qty*it.price).toLocaleString()}
                        {it.selectedOptions && Object.keys(it.selectedOptions).length > 0 && (
                          <div><small>
                            {Object.entries(it.selectedOptions).map(([k,v]) => `${k}: ${v}`).join(" • ")}
                          </small></div>
                        )}
                      </li>
                    ))}
                  </ul>

                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:6}}>
                    <div><small>Placed: {new Date(o.createdAt).toLocaleString()}</small></div>
                    <div><strong>Total:</strong> ৳ {o.total.toLocaleString()}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* ---- Status badge helper ---- */
function StatusBadge({ status }){
  const map = {
    processing: { text: "Not shipped yet", bg: "#FFF4E5", fg: "#8A5A00" },
    shipped:    { text: "Shipped",         bg: "#E7F1FF", fg: "#0B5CAD" },
    delivered:  { text: "Delivered",       bg: "#E8F5E9", fg: "#1B5E20" },
    cancelled:  { text: "Cancelled",       bg: "#FDECEC", fg: "#B71C1C" },
    unpaid:     { text: "Unpaid",          bg: "#EEEEEE", fg: "#424242" }
  };
  const s = map[status] || map.processing;
  return (
    <span
      className="badge"
      style={{ background:s.bg, color:s.fg, padding:"2px 8px", borderRadius:12, fontSize:12, fontWeight:600 }}
      aria-label={`Order status: ${s.text}`}
    >
      {s.text}
    </span>
  );
}
