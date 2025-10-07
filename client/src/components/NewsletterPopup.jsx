import React, { useEffect, useState } from "react";
const KEY = "lot_newsletter_dismissed";

export default function NewsletterPopup(){
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(()=>{
    const dismissed = localStorage.getItem(KEY);
    if (!dismissed) {
      const t = setTimeout(()=>setOpen(true), 1200);
      return ()=>clearTimeout(t);
    }
  },[]);

  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label="Newsletter signup" style={{position:"fixed",inset:0,display:"grid",placeItems:"center",background:"rgba(0,0,0,.35)",zIndex:100}}>
      <div className="card" style={{padding:16,maxWidth:420}}>
        <h3>Join our newsletter</h3>
        <p>Get promos & new drops. No spam.</p>
        <input className="input" type="email" placeholder="you@email.com" value={email} onChange={e=>setEmail(e.target.value)}/>
        <div style={{display:"flex",gap:8,marginTop:8,justifyContent:"flex-end"}}>
          <button className="btn" onClick={()=>{localStorage.setItem(KEY,"1"); setOpen(false);}}>Maybe later</button>
          <button className="btn btn-primary" onClick={()=>{localStorage.setItem(KEY,"1"); alert("Thanks for subscribing!"); setOpen(false);}}>Subscribe</button>
        </div>
      </div>
    </div>
  );
}
