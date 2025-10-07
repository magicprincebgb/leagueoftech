import React from "react";
import { useStore } from "../context/StoreContext";

export default function ThemeToggle(){
  const { theme, setTheme } = useStore();
  return (
    <button className="btn" aria-label="Toggle theme" onClick={()=>setTheme(theme==="light"?"dark":"light")}>
      {theme==="light"?"🌙 Dark":"☀️ Light"}
    </button>
  );
}
