// src/components/Card.jsx
import React from "react";
import { Link } from "react-router-dom";
import { InvAPI } from "../api.js";
import RemoteImage from "./RemoteImage.jsx";

export default function Card({ item }) {
  return (
    <div className="card">
      {/* Miniatura de la investigación */}
      <div className="thumb" style={{ marginBottom: "12px" }}>
        <RemoteImage
          src={InvAPI.imageUrl(item._id, 0)}
          alt={item.titulo}
          style={{
            width: "100%",
            height: "180px",
            objectFit: "cover",
            borderRadius: 8,
            background: "#fafafa"
          }}
        />
      </div>

      {/* Meta e info */}
      <div className="meta">
        <span>Área: <b>{item.area}</b></span> ·{" "}
        <span>Grado: <b>{item.gradoAcademico}</b></span>
      </div>

      <div className="title">{item.titulo}</div>
      <div className="helper">{item.descripcion}</div>

      {/* Acciones */}
      <div className="actions" style={{ marginTop: "10px", display:"flex", gap:"8px", flexWrap:"wrap" }}>
        <a
          className="btn"
          href={InvAPI.pdfUrl(item._id)}
          target="_blank"
          rel="noreferrer"
        >
          Ver PDF
        </a>
        <Link className="btn primary" to={`/investigacion/${item._id}`}>
          Ver detalle
        </Link>
      </div>
    </div>
  );
}
