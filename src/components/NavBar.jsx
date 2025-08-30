import React from "react";
import { Link, useLocation } from "react-router-dom";

function isInvestigador(user) {
  const r = String(user?.roles || "").toLowerCase();
  return r.includes("investigador");
}

export default function NavBar({ user, onLogout }) {
  const loc = useLocation();

  return (
    <>
      <Link to="/" className="brand">
        <span className="brand-badge" />
        Académico
        <span className="badge">UTN</span>
      </Link>

      <div className="nav-actions">
        <Link to="/" className="btn">Inicio</Link>

        {isInvestigador(user) && (
          <Link to="/nueva" className="btn primary">Publicar investigación</Link>
        )}

        {!user ? (
          <>
            {loc.pathname !== "/login" && <Link to="/login" className="btn">Ingresar</Link>}
            {loc.pathname !== "/signup" && <Link to="/signup" className="btn accent">Crear cuenta</Link>}
          </>
        ) : (
          <>
            <span className="helper">
              Sesión: <b>{user.username || user.email}</b> · Rol: <b>{user.roles}</b>
            </span>
            <button className="btn danger" onClick={onLogout}>Salir</button>
          </>
        )}
      </div>
    </>
  );
}
