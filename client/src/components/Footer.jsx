import React from "react";
export default function Footer(){
  return (
    <footer className="footer">
      <div className="container" role="contentinfo">
        <div style={{display:"grid",gap:8}}>
          <strong>League of Tech</strong>
          <div>Affordable Tech, Unbeatable Prices!</div>
          <div>Contact: <a href="mailto:contact.leagueoftech@gmail.com">contact.leagueoftech@gmail.com</a></div>
          <div><a href="https://www.facebook.com/leagueoftech">Visit Facebook Page</a></div>
          <small>© {new Date().getFullYear()} League of Tech. All rights reserved.</small>
        </div>
      </div>
    </footer>
  );
}
