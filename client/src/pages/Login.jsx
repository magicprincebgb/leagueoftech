import React, { useState } from "react";
import { api } from "../api";
import { useStore } from "../context/StoreContext";
import { useNavigate } from "react-router-dom";

export default function Login(){
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { setAuth } = useStore();
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    const { data } = await api.post("/auth/login", { email, password });
    setAuth(data);
    nav("/");
  };

  return (
    <form className="card" style={{padding:16,maxWidth:520,margin:"0 auto"}} onSubmit={submit}>
      <h2>Login</h2>
      <div className="label">Email</div>
      <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required/>
      <div className="label">Password</div>
      <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} required/>
      <button className="btn btn-primary" type="submit">Login</button>
    </form>
  );
}
