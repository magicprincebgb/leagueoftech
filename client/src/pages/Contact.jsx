import React from "react";
export default function Contact(){
  return (
    <div className="grid" style={{gridTemplateColumns:"1fr 1fr",gap:16}}>
      <form className="card" style={{padding:16}} onSubmit={(e)=>{e.preventDefault(); alert("Thanks! We will email you soon.");}}>
        <h2>Contact Us</h2>
        <div className="label">Your Name</div>
        <input className="input" required/>
        <div className="label">Email</div>
        <input type="email" className="input" required/>
        <div className="label">Message</div>
        <textarea className="input" rows="4" required></textarea>
        <button className="btn btn-primary">Send</button>
        <p>Or email us at <a href="mailto:contact.leagueoftech@gmail.com">contact.leagueoftech@gmail.com</a></p>
      </form>
      <div className="card" style={{padding:0,overflow:"hidden"}}>
        <iframe title="Map" aria-label="Map" width="100%" height="100%" style={{minHeight:380,border:0}} loading="lazy"
          src="https://www.openstreetmap.org/export/embed.html?bbox=90.356%2C23.780%2C90.420%2C23.815&layer=mapnik&marker=23.796%2C90.388"></iframe>
      </div>
    </div>
  );
}
