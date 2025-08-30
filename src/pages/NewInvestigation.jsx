// src/pages/NewInvestigation.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { InvAPI } from "../api.js";

const GRADOS = ["7","8","9","10","11","12"];
const AREAS = ["matemáticas","biología","social","física","química","informática"];

export default function NewInvestigation() {
  const nav = useNavigate();
  const [form, setForm] = React.useState({
    titulo: "", area: "", gradoAcademico: "",
    descripcion: "", conclusiones: "", recomendaciones: "",
    pdf: null, imagenes: [], descripciones: []
  });
  const [err, setErr] = React.useState("");
  const [msg, setMsg] = React.useState("");

  function setField(k, v){ setForm(s => ({...s, [k]: v})); }

  // al seleccionar imágenes
  function onImagesChange(files) {
    const arr = Array.from(files || []);
    setForm(s => ({
      ...s,
      imagenes: arr,
      // resetear las descripciones al número de imágenes seleccionadas
      descripciones: arr.map(() => "")
    }));
  }

  // actualizar descripción por índice
  function onDescChange(i, val) {
    setForm(s => {
      const d = [...s.descripciones];
      d[i] = val;
      return { ...s, descripciones: d };
    });
  }

  async function submit(e){
    e.preventDefault();
    try {
      setErr(""); setMsg("");
      if (!form.pdf) throw new Error("Debes adjuntar un PDF");

      // ⚡ al enviar pasamos también las descripciones
      const res = await InvAPI.create({
        ...form,
        descripciones: form.descripciones
      });

      setMsg("Investigación creada 🎉");
      setTimeout(()=> nav(`/investigacion/${res._id}`), 800);
    } catch(e) {
      setErr(String(e.message || e));
    }
  }

  return (
    <div className="section">
      <h1 className="h1">Nueva investigación</h1>
      {msg && <div className="notice">{msg}</div>}
      {err && <div className="error">{err}</div>}

      <form className="form" onSubmit={submit}>
        <div className="row cols">
          <div>
            <label>Título</label>
            <input value={form.titulo} onChange={e=>setField("titulo", e.target.value)} required maxLength={120}/>
          </div>
          <div>
            <label>Área</label>
            <select value={form.area} onChange={e=>setField("area", e.target.value)} required>
              <option value="">Selecciona...</option>
              {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>

        <div className="row cols">
          <div>
            <label>Grado académico</label>
            <select value={form.gradoAcademico} onChange={e=>setField("gradoAcademico", e.target.value)} required>
              <option value="">Selecciona...</option>
              {GRADOS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label>PDF (máx 10MB)</label>
            <input type="file" accept="application/pdf"
                   onChange={e=>setField("pdf", e.target.files?.[0] || null)} required />
          </div>
        </div>

        <div className="row">
          <label>Descripción (máx 500)</label>
          <textarea maxLength={500} value={form.descripcion}
                    onChange={e=>setField("descripcion", e.target.value)} required/>
          <div className="helper">{form.descripcion.length}/500</div>
        </div>

        <div className="row">
          <label>Imágenes (0..N, cada una ≤ 5MB)</label>
          <input type="file" multiple
                 accept="image/png,image/jpeg,image/webp,image/gif"
                 onChange={e=>onImagesChange(e.target.files)} />
          {form.imagenes.length > 0 && (
            <div className="grid" style={{marginTop:8}}>
              {form.imagenes.map((f, i) => (
                <div className="card" key={i}>
                  <div className="meta">
                    <b>{f.name}</b> · {(f.size/1024/1024).toFixed(2)} MB
                  </div>
                  <input type="text"
                         placeholder="Descripción opcional"
                         value={form.descripciones[i] || ""}
                         onChange={e=>onDescChange(i, e.target.value)} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="row cols">
          <div>
            <label>Conclusiones (máx 500)</label>
            <textarea maxLength={500} value={form.conclusiones}
                      onChange={e=>setField("conclusiones", e.target.value)} required/>
            <div className="helper">{form.conclusiones.length}/500</div>
          </div>
          <div>
            <label>Recomendaciones (máx 500)</label>
            <textarea maxLength={500} value={form.recomendaciones}
                      onChange={e=>setField("recomendaciones", e.target.value)} required/>
            <div className="helper">{form.recomendaciones.length}/500</div>
          </div>
        </div>

        <button className="btn accent">Crear investigación</button>
      </form>
    </div>
  );
}
