import React from "react";
import { useNavigate } from "react-router-dom";
import { AuthAPI } from "../api.js";

export default function Login({ onLogin }) {
  const [username, setUser] = React.useState("");
  const [password, setPass] = React.useState("");
  const [err, setErr] = React.useState("");
  const nav = useNavigate();

  async function submit(e){
    e.preventDefault();
    try{
      setErr("");
      const user = await AuthAPI.signin({ username, password }); // normalizado
      onLogin?.(user); // levanta el estado en App
      nav("/");
    }catch(e){ setErr(String(e.message || e)); }
  }

  return (
    <div className="section">
      <h1 className="h1">Ingresar</h1>
      {err && <div className="error">{err}</div>}
      <form className="form" onSubmit={submit}>
        <div className="row">
          <label>Usuario</label>
          <input value={username} onChange={e=>setUser(e.target.value)} required />
        </div>
        <div className="row">
          <label>Contraseña</label>
          <input type="password" value={password} onChange={e=>setPass(e.target.value)} required />
        </div>
        <button className="btn primary">Entrar</button>
      </form>
    </div>
  );
}
