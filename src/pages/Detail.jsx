// src/pages/Detail.jsx
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { InvAPI, ComentAPI, PregAPI } from "../api.js";
import StarRating from "../components/StarRating.jsx";
import RemoteImage from "../components/RemoteImage.jsx";

function isInvestigador(user) {
  return String(user?.roles || "").toLowerCase().includes("investigador");
}
function isAutor(user, inv) {
  const uid = String(user?.id ?? "");
  const aid = String(inv?.autor?.userId ?? inv?.autor?._id ?? "");
  return uid && aid && uid === aid;
}

export default function Detail({ user }) {
  const { id } = useParams();
  const nav = useNavigate();
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState("");
  const [nombre, setNombre] = React.useState("");
  const [texto, setTexto] = React.useState("");
  const [puntaje, setPuntaje] = React.useState(5);
  const [qNombre, setQNombre] = React.useState("");
  const [qTexto, setQTexto] = React.useState("");
  const [idx, setIdx] = React.useState(0);

  async function load() {
    try {
      setErr("");
      setLoading(true);
      const res = await InvAPI.get(id);
      setData(res);
      setIdx(0);
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(); }, [id]);

  async function submitComment(e) {
    e.preventDefault();
    if (!texto.trim()) return;
    await ComentAPI.add(id, { nombreVisitante: nombre || "Anónimo", texto, puntaje });
    setNombre(""); setTexto(""); setPuntaje(5);
    await load();
  }

  async function submitQuestion(e) {
    e.preventDefault();
    if (!qTexto.trim()) return;
    await PregAPI.ask(id, { nombreVisitante: qNombre || "Anónimo", texto: qTexto });
    setQNombre(""); setQTexto("");
    await load();
  }

  async function answer(pregId, respuesta) {
    await PregAPI.answer(pregId, { respuesta });
    await load();
  }

  async function handleDelete() {
    if (!data?.inv?._id) return;
    const ok = window.confirm("¿Deseas eliminar esta investigación? Esta acción no se puede deshacer.");
    if (!ok) return;
    try { await InvAPI.remove(data.inv._id); nav("/"); }
    catch (e) { alert(String(e.message || e)); }
  }

  if (loading) return <div className="section">Cargando…</div>;
  if (err) return <div className="section error">{err}</div>;
  if (!data?.inv) return <div className="section">No encontrado</div>;

  const { inv, comentarios = [], preguntas = [] } = data;
  const puedeBorrar = isInvestigador(user) && isAutor(user, inv);
  const imgCount = (Array.isArray(inv.imagenes) && inv.imagenes.length)
    ? inv.imagenes.length
    : (inv.imagen ? 1 : 0);

  function prev() { if (imgCount > 1) setIdx(i => (i - 1 + imgCount) % imgCount); }
  function next() { if (imgCount > 1) setIdx(i => (i + 1) % imgCount); }

  const fetchUrl = imgCount === 0
    ? null
    : (inv.imagenes?.length > 0
        ? InvAPI.imageUrl(inv._id, idx)
        : InvAPI.imageUrlSingle(inv._id));

  const currentImgDesc = inv.imagenes?.length > 0
    ? (inv.imagenes[idx]?.descripcion || `Imagen ${idx+1}`)
    : (inv.imagen?.descripcion || "Imagen");

  return (
    <div className="section">
      <h1 className="h1">{inv.titulo}</h1>
      <div className="meta">
        <span>Área: <b>{inv.area}</b></span> ·{" "}
        <span>Grado: <b>{inv.gradoAcademico}</b></span> ·{" "}
        <span>Autor: <b>{inv.autor?.nombre}</b></span>
      </div>
      <div className="actions" style={{margin:"12px 0", display:"flex", gap:8, flexWrap:"wrap"}}>
        <a className="btn" href={InvAPI.pdfUrl(inv._id)} target="_blank" rel="noreferrer">Abrir PDF</a>
        {puedeBorrar && <button className="btn danger" onClick={handleDelete}>Eliminar investigación</button>}
      </div>
      <p className="helper">{inv.descripcion}</p>

      <h2 className="h2">Imágenes</h2>
      {imgCount > 0 ? (
        <div className="card" style={{maxWidth: 1000, margin: "0 auto"}}>
          <div style={{display: "flex", alignItems: "center", gap: 20}}>
            {/* Botón anterior */}
            <button className="btn" onClick={prev} disabled={imgCount <= 1}>◀</button>

            {/* Imagen */}
            <div style={{flex: "2 1 60%", textAlign:"center"}}>
              <RemoteImage
                src={fetchUrl}
                alt={currentImgDesc}
                style={{
                  maxHeight: 420,
                  width: "100%",
                  objectFit: "contain",
                  background: "#fff",
                  borderRadius: 8
                }}
              />
              <div className="helper" style={{marginTop: 6}}>
                {imgCount > 1 ? `(${idx+1}/${imgCount})` : ""}
              </div>
            </div>

            {/* Descripción */}
            <div style={{flex: "1 1 40%", padding: "0 12px"}}>
              <h3 className="h3">Descripción</h3>
              <p style={{lineHeight:1.5}}>
                {currentImgDesc}
              </p>
            </div>

            {/* Botón siguiente */}
            <button className="btn" onClick={next} disabled={imgCount <= 1}>▶</button>
          </div>
        </div>
      ) : <div className="helper">Sin imágenes adjuntas.</div>}

      <h2 className="h2">Conclusiones</h2>
      <p>{inv.conclusiones}</p>

      <h2 className="h2">Recomendaciones</h2>
      <p>{inv.recomendaciones}</p>

      <hr className="hr"/>
      <h2 className="h2">Comentarios y calificación</h2>
      <div className="grid">
        {comentarios.map(c => (
          <div className="card" key={c._id}>
            <div className="meta"><b>{c.nombreVisitante}</b> · {new Date(c.createdAt).toLocaleString()}</div>
            <div><StarRating value={c.puntaje} /></div>
            <div>{c.texto}</div>
          </div>
        ))}
      </div>
      <div className="section">
        <form className="form" onSubmit={submitComment}>
          <div className="row cols">
            <div><label>Nombre</label>
              <input type="text" value={nombre} onChange={e=>setNombre(e.target.value)} placeholder="Anónimo"/></div>
            <div><label>Calificación</label><StarRating value={puntaje} onChange={setPuntaje} /></div>
          </div>
          <div className="row">
            <label>Comentario (máx. 100 caracteres)</label>
            <input type="text" maxLength={100} value={texto} onChange={e=>setTexto(e.target.value)} required />
            <div className="helper">{texto.length}/100</div>
          </div>
          <div className="row"><button className="btn accent" type="submit">Enviar comentario</button></div>
        </form>
      </div>

      <hr className="hr"/>
      <h2 className="h2">Preguntas y respuestas</h2>
      <div className="grid">
        {preguntas.map(p => (
          <div className="card" key={p._id}>
            <div className="meta"><b>{p.nombreVisitante}</b> · {new Date(p.createdAt).toLocaleString()}</div>
            <div style={{marginBottom:8}}>{p.texto}</div>
            {p.respuesta
              ? <div className="notice"><b>Respuesta:</b> {p.respuesta}</div>
              : (isInvestigador(user))
                ? <AnswerForm onSubmit={(r)=>answer(p._id, r)} />
                : <div className="helper">Sin respuesta aún.</div>}
          </div>
        ))}
      </div>
      <div className="section">
        <form className="form" onSubmit={submitQuestion}>
          <div className="row cols">
            <div><label>Tu nombre</label>
              <input type="text" value={qNombre} onChange={e=>setQNombre(e.target.value)} placeholder="Anónimo" /></div>
            <div><label>Pregunta</label>
              <input type="text" value={qTexto} onChange={e=>setQTexto(e.target.value)} maxLength={200} required /></div>
          </div>
          <div><button className="btn primary" type="submit">Enviar pregunta</button></div>
        </form>
      </div>
    </div>
  );
}

function AnswerForm({ onSubmit }) {
  const [r, setR] = React.useState("");
  return (
    <form onSubmit={e=>{e.preventDefault(); if(r.trim()) onSubmit(r);}}>
      <div className="row">
        <label>Responder (solo investigador)</label>
        <input type="text" value={r} onChange={e=>setR(e.target.value)} placeholder="Escribe tu respuesta..." />
      </div>
      <button className="btn accent" type="submit">Responder</button>
    </form>
  );
}
