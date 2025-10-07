import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import SearchBar from "./SearchBar";
import ThemeToggle from "./ThemeToggle";

export default function Navbar(){
  const { totals, auth, setAuth } = useStore();
  const nav = useNavigate();

  // swap to PNG if SVG missing
  const [logoSrc, setLogoSrc] = React.useState("/logo.svg");
  const handleLogoError = React.useCallback(() => setLogoSrc("/logo.png"), []);

  const logout = () => { setAuth(null); nav("/login"); };

  return (
    <nav className="nav" role="navigation" aria-label="Main">
      <div className="container nav-inner" style={{display:"flex", alignItems:"center", gap:12}}>
        {/* Brand */}
        <Link to="/" className="brand" aria-label="League of Tech" style={{display:"flex", alignItems:"center", gap:10, textDecoration:"none"}}>
          <img
            src={logoSrc}
            onError={handleLogoError}
            alt="League of Tech"
            style={{ height: 36, width: "auto", display: "block" }}
          />
          {/* Keep a visually-hidden text fallback for accessibility/SEO */}
          <span style={{
            position:"absolute",
            width:1,height:1,overflow:"hidden",clip:"rect(1px, 1px, 1px, 1px)",
            whiteSpace:"nowrap",border:0,padding:0,margin:-1
          }}>
            League of Tech
          </span>
        </Link>

        {/* Search */}
        <div style={{flex:1, minWidth: 200}}>
          <SearchBar />
        </div>

        {/* Links + actions */}
        <div className="nav-links" style={{display:"flex", alignItems:"center", gap:12}}>
          <NavLink to="/shop">Shop</NavLink>
          <NavLink to="/about">About</NavLink>
          <NavLink to="/orders">Orders</NavLink>
          

          {auth ? (
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <NavLink to="/account">Hi, {auth.user.name?.split(" ")[0] || "User"}</NavLink>
              {auth.user.isAdmin && <NavLink to="/admin">Admin</NavLink>}
              <button className="btn" onClick={logout} title="Logout">Logout</button>
            </div>
          ) : (
            <>
              <NavLink to="/login">Login</NavLink>
              <NavLink to="/register">Register</NavLink>
            </>
          )}

          <NavLink to="/cart" aria-label="Cart" style={{display:"inline-flex", alignItems:"center", gap:6}}>
            <span aria-hidden="true">🛒</span>
            <span className="badge" aria-live="polite">{totals.items}</span>
          </NavLink>

          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
