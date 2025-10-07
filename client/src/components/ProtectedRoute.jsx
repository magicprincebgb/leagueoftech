import React from "react";
import { Navigate } from "react-router-dom";
import { useStore } from "../context/StoreContext";

export default function ProtectedRoute({ children, admin=false }){
  const { auth } = useStore();
  if (!auth) return <Navigate to="/login" replace/>;
  if (admin && !auth.user.isAdmin) return <Navigate to="/" replace/>;
  return children;
}
