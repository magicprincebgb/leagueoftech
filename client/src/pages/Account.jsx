import React from "react";
import { Link } from "react-router-dom";
import { useStore } from "../context/StoreContext";

export default function Account(){
  const { auth } = useStore();
  return (
    <div className="card" style={{padding:16}}>
      <h2>My Account</h2>
      <p>Name: {auth.user.name}</p>
      <p>Email: {auth.user.email}</p>
      <Link to="/orders" className="btn">Order History</Link>
    </div>
  );
}
