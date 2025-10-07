import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStore } from "../context/StoreContext";

export default function Cart(){
  const { cart, removeFromCart, updateQty, totals } = useStore();
  const nav = useNavigate();
  return (
    <div className="grid" style={{gridTemplateColumns:"2fr 1fr",gap:16}}>
      <div className="card" style={{padding:16}}>
        <h2>Your Cart</h2>
        {cart.length===0 ? <p>Cart is empty. <Link to="/shop">Shop now</Link></p> : (
          <table className="table" aria-label="cart table">
            <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th></th></tr></thead>
            <tbody>
            {cart.map(i => (
              <tr key={i._id}>
                <td>{i.name}</td>
                <td><input className="input" type="number" min="1" max="99" value={i.qty} onChange={e=>updateQty(i._id, parseInt(e.target.value||"1"))} style={{width:90}}/></td>
                <td>৳ {(i.price*i.qty).toLocaleString()}</td>
                <td><button className="btn" onClick={()=>removeFromCart(i._id)}>Remove</button></td>
              </tr>
            ))}
            </tbody>
          </table>
        )}
      </div>
      <aside className="card" style={{padding:16}}>
        <h3>Summary</h3>
        <div>Items: {totals.items}</div>
        <div>Total: <strong>৳ {totals.amount.toLocaleString()}</strong></div>
        <button className="btn btn-primary" disabled={!cart.length} onClick={()=>nav("/checkout")}>Checkout</button>
      </aside>
    </div>
  );
}
