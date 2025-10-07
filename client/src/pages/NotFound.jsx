import React from "react";
import { Link } from "react-router-dom";
export default function NotFound(){
  return (
    <div className="card" style={{padding:16, textAlign:"center"}}>
      <h2>Page not found</h2>
      <Link className="btn btn-primary" to="/">Go Home</Link>
    </div>
  );
}
