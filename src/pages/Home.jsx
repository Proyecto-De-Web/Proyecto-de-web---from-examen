// src/pages/Home.jsx
import React from "react";
import Card from "../components/Card.jsx";
import { InvAPI } from "../api.js";

export default function Home() {
  const [items, setItems] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const [area, setArea] = React.useState("");
  const [grado, setGrado] = React.useState("");
  const [q, setQ] = React.useState("");

  async function load() {
    const data = await InvAPI.list({ area, grado, q });
    setItems(data.items || []);
    setTotal(data.total || 0);
  }

  React.useEffect(() => { load(); }, []); // primer render

  return (
    <div className="section">
      <h1 className="h1">Investigaciones</h1>
      <div className="filters">
        <input
          type="text"
          placeholder="Buscar por título o descripción..."
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        <select value={area} onChange={e => setArea(e.target.value)}>
          <option value="">Área (todas)</option>
          <option>matemáticas</option>
          <option>biología</option>
          <option>social</option>
          <option>física</option>
          <option>química</option>
          <option>informática</option>
        </select>
        <select value={grado} onChange={e => setGrado(e.target.value)}>
          <option value="">Grado (todos)</option>
          <option value="7">7</option>
          <option value="8">8</option>
          <option value="9">9</option>
          <option value="10">10</option>
          <option value="11">11</option>
          <option value="12">12</option>
        </select>
        <button className="btn" onClick={load}>Aplicar filtros</button>
      </div>

      <div className="helper">{total} resultado(s)</div>

      <div className="grid">
        {items.map(it => <Card key={it._id} item={it} />)}
      </div>
    </div>
  );
}
