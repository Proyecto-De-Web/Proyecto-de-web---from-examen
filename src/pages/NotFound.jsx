import React from "react";
import { Link } from "react-router-dom";

export default function NotFound(){
  return (
    <div className="section">
      <h1 className="h1">404</h1>
      <p className="helper">No encontramos lo que buscabas.</p>
      <Link to="/" className="btn">Volver al inicio</Link>
    </div>
  );
}
