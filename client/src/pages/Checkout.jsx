import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api";
import { useStore } from "../context/StoreContext";

export default function Checkout() {
  const nav = useNavigate();
  const { cart, clearCart } = useStore();
  const [loading, setLoading] = useState(false);

  // Saved addresses
  const [addresses, setAddresses] = useState([]);
  const [selectedId, setSelectedId] = useState("");

  // Manual (new) address
  const [shipping, setShipping] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    country: "Bangladesh",
  });
  const [saveNewAddress, setSaveNewAddress] = useState(true);

  // City list (for searchable dropdown)
  const cities = [
    "Dhaka","Bagerhat","Bandarban","Barguna","Barisal","Bhola","Bogura",
    "Brahmanbaria","Chandpur","Chapai Nawabganj","Chattogram","Chuadanga",
    "Cox’s Bazar","Cumilla","Dinajpur","Faridpur","Feni","Gaibandha",
    "Gazipur","Gopalganj","Habiganj","Jamalpur","Jashore","Jhalokati",
    "Jhenaidah","Joypurhat","Khagrachhari","Khulna","Kishoreganj",
    "Kurigram","Kushtia","Lakshmipur","Lalmonirhat","Madaripur","Magura",
    "Manikganj","Meherpur","Moulvibazar","Munshiganj","Mymensingh",
    "Naogaon","Narail","Narayanganj","Narsingdi","Natore","Netrokona",
    "Nilphamari","Noakhali","Pabna","Panchagarh","Patuakhali","Pirojpur",
    "Rajbari","Rajshahi","Rangamati","Rangpur","Satkhira","Shariatpur",
    "Sherpur","Sirajganj","Sunamganj","Sylhet","Tangail","Thakurgaon"
  ];

  // Load saved addresses
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await api.get("/account/addresses");
        if (!alive) return;
        setAddresses(Array.isArray(data) ? data : []);
        const def = data.find(a => a.isDefault) || data[0];
        if (def) setSelectedId(def._id);
      } catch {
        // ignore
      }
    })();
    return () => { alive = false; };
  }, []);

  // Choose final shipping (saved vs manual)
  const chosen = useMemo(
    () => (selectedId ? addresses.find(a => a._id === selectedId) : null),
    [selectedId, addresses]
  );
  const finalShipping = useMemo(() => {
    if (chosen) {
      const { name, phone, address, city, country } = chosen;
      return { name, phone, address, city, country };
    }
    return shipping;
  }, [chosen, shipping]);

  // Totals
  const items = cart || [];
  const subtotal = useMemo(
    () => items.reduce((sum, it) => sum + (Number(it.price) || 0) * (Number(it.qty) || 1), 0),
    [items]
  );

  // Shipping fee: 60 for Dhaka, 110 for others (0 if city empty)
  const shippingFee = useMemo(() => {
    const city = finalShipping.city?.trim()?.toLowerCase();
    if (!city) return 0;
    return city === "dhaka" ? 60 : 110;
  }, [finalShipping.city]);

  const grandTotal = subtotal + shippingFee;

  // Validation
  const shippingValid = useMemo(() => {
    const s = finalShipping;
    return Boolean(s?.name && s?.phone && s?.address && s?.city && s?.country);
  }, [finalShipping]);
  const canPlace = items.length > 0 && shippingValid && !loading;

  // Create COD order
  const placeOrder = async () => {
    if (!canPlace) return;
    setLoading(true);
    try {
      if (!selectedId && saveNewAddress && shippingValid) {
        await api.post("/account/addresses", {
          label: "Home",
          ...shipping,
          isDefault: true,
        }).catch(() => {});
      }

      await api.post("/orders", {
        items: items.map(i => ({
          product: i._id,
          name: i.name,
          qty: i.qty,
          price: i.price,
          image: i.image,
          selectedOptions: i.selectedOptions || {},
        })),
        total: grandTotal,
        shipping: finalShipping
        // paymentMethod defaults to COD on server; isPaid=false until delivered
      });

      if (typeof clearCart === "function") clearCart();
      nav("/orders");
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  // Filter cities for datalist based on current input (shipping.city)
  const filteredCities = useMemo(() => {
    const q = (shipping.city || "").toLowerCase();
    return cities.filter(c => c.toLowerCase().includes(q));
  }, [shipping.city]);

  return (
    <div className="grid" style={{ gap:16, gridTemplateColumns: "2fr 1fr" }}>
      {/* LEFT: Shipping */}
      <section className="card" style={{ padding:16 }}>
        <h2>Shipping Address</h2>

        {/* Saved addresses chooser */}
        {!!addresses.length && (
          <div className="card" style={{ padding:12, marginBottom:12 }}>
            <strong>Choose a saved address</strong>
            <div style={{ display:"grid", gap:8, marginTop:8 }}>
              {addresses.map(a => (
                <label key={a._id} className="card" style={{ padding:8, display:"flex", gap:8 }}>
                  <input
                    type="radio"
                    name="addr"
                    checked={selectedId === a._id}
                    onChange={() => setSelectedId(a._id)}
                  />
                  <div>
                    <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                      <strong>{a.label || "Address"}</strong>
                      {a.isDefault && <span className="badge">Default</span>}
                    </div>
                    <div>{a.name} — {a.phone}</div>
                    <div>{a.address}</div>
                    <div>{a.city}, {a.country}</div>
                  </div>
                </label>
              ))}
            </div>
            <button className="btn" style={{ marginTop:8 }} onClick={() => setSelectedId("")}>
              + Use a new address
            </button>
          </div>
        )}

        {/* Manual address (shown if no saved selected) */}
        {(!addresses.length || !selectedId) && (
          <div className="card" style={{ padding:12 }}>
            <div className="label">Name</div>
            <input
              className="input"
              value={shipping.name}
              onChange={e => setShipping({ ...shipping, name: e.target.value })}
              required
            />

            <div className="label">Phone</div>
            <input
              className="input"
              value={shipping.phone}
              onChange={e => setShipping({ ...shipping, phone: e.target.value })}
              required
            />

            <div className="label">Address</div>
            <input
              className="input"
              value={shipping.address}
              onChange={e => setShipping({ ...shipping, address: e.target.value })}
              required
            />

            {/* Searchable City (immediate update, no button) */}
            <div className="label">City</div>
            <input
              className="input"
              placeholder="Start typing to search…"
              value={shipping.city}
              onChange={e => setShipping({ ...shipping, city: e.target.value })}
              list="city-options"
              required
            />
            <datalist id="city-options">
              {filteredCities.map((c, i) => (
                <option key={i} value={c} />
              ))}
            </datalist>
            {shipping.city && (
              <div style={{ marginTop: 4, fontSize: 14 }}>
                Selected: <strong>{shipping.city}</strong>
              </div>
            )}

            <div className="label">Country</div>
            <input
              className="input"
              value={shipping.country}
              onChange={e => setShipping({ ...shipping, country: e.target.value })}
              required
            />

            <label style={{ display:"flex", gap:8, alignItems:"center", marginTop:8 }}>
              <input
                type="checkbox"
                checked={saveNewAddress}
                onChange={e => setSaveNewAddress(e.target.checked)}
              />
              Save this address to my account (and make default)
            </label>
          </div>
        )}

        {/* COD info */}
        <div className="card" style={{ padding:12, marginTop:12 }}>
          <strong style={{display:"flex", alignItems:"center", gap:8}}>
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 6h18a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zm2 2a2 2 0 0 1-2 2v4a2 2 0 0 1 2 2h14a2 2 0 0 1 2-2v-4a2 2 0 0 1-2-2H5zm7 1a3 3 0 1 1 0 6a3 3 0 0 1 0-6z" fill="currentColor"/>
            </svg>
            Cash on Delivery
          </strong>
          <div><small>Pay with cash when your order is delivered.</small></div>
        </div>
      </section>

      {/* RIGHT: Order summary */}
      <aside className="card" style={{ padding:16 }}>
        <h2>Order Summary</h2>

        {!items.length ? (
          <p>Your cart is empty. <Link to="/shop">Shop now</Link></p>
        ) : (
          <>
            <ul style={{ listStyle:"none", padding:0, display:"grid", gap:8 }}>
              {items.map((it, idx) => (
                <li key={idx} className="card" style={{ padding:8 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", gap:8 }}>
                    <span>{it.name} × {it.qty}</span>
                    <span>৳ {(it.qty * it.price).toLocaleString()}</span>
                  </div>
                  {it.selectedOptions && Object.keys(it.selectedOptions).length > 0 && (
                    <div><small>{Object.entries(it.selectedOptions).map(([k,v]) => `${k}: ${v}`).join(" • ")}</small></div>
                  )}
                </li>
              ))}
            </ul>

            <div style={{ borderTop:"1px solid #eee", marginTop:12, paddingTop:12, display:"grid", gap:6 }}>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <span>Subtotal</span>
                <strong>৳ {subtotal.toLocaleString()}</strong>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <span>Shipping</span>
                <strong>৳ {shippingFee.toLocaleString()}</strong>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:18 }}>
                <span>Total</span>
                <strong>৳ {grandTotal.toLocaleString()}</strong>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
                <span>Payment Method</span>
                <strong>Cash on Delivery</strong>
              </div>
            </div>

            <button
              className="btn btn-primary"
              style={{ marginTop:12, width:"100%" }}
              disabled={!canPlace}
              onClick={placeOrder}
            >
              {loading ? "Placing Order..." : "Place Order (COD)"}
            </button>
          </>
        )}
      </aside>
    </div>
  );
}
