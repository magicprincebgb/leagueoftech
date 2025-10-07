import React, { useEffect, useRef, useState } from "react";
import { api } from "../api";
import { useNavigate } from "react-router-dom";

export default function SearchBar(){
  const [q, setQ] = useState("");
  const [sug, setSug] = useState([]);
  const nav = useNavigate();
  const box = useRef();
  const inputRef = useRef();

  useEffect(()=>{
    const onKey = (e)=>{
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return ()=>document.removeEventListener("keydown", onKey);
  },[]);

  useEffect(()=>{
    let active = true;
    const run = async () => {
      if (!q) return setSug([]);
      const { data } = await api.get(`/products/search?q=${encodeURIComponent(q)}`);
      if (active) setSug(data);
    };
    const t = setTimeout(run, 180);
    return ()=>{active=false;clearTimeout(t)};
  },[q]);

  useEffect(()=>{
    const onDoc = (e)=>{ if (box.current && !box.current.contains(e.target)) setSug([]) };
    document.addEventListener("click", onDoc);
    return ()=>document.removeEventListener("click", onDoc);
  },[]);

  return (
    <div className="search" ref={box}>
      <input ref={inputRef} aria-label="Search products" placeholder="Search tech… (press / to focus)" value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter"){ nav(`/shop?q=${encodeURIComponent(q)}`); setSug([]); }}}/>
      {sug.length>0 && (
        <ul className="suggestions" role="listbox" aria-label="Search suggestions">
          {sug.map(s => <li key={s._id} role="option" onClick={()=>{ nav(`/product/${s._id}`); setSug([]); }}>{s.name}</li>)}
        </ul>
      )}
    </div>
  );
}
