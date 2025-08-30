import React from "react";
import { useNavigate } from "react-router-dom";
import { AuthAPI } from "../api.js";

export default function Signup() {
  const [fullname, setFull] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [username, setUser] = React.useState("");
  const [password, setPass] = React.useState("");
  const [rol, setRol] = React.useState("investigador");
  const [msg, setMsg] = React.useState("");
  const [err, setErr] = React.useState("");
  const nav = useNavigate();

  async function submit(e){
    e.preventDefault();
    try{
      setErr(""); setMsg("");
      await AuthAPI.signup({ fullname, email, username, password, rol });
      setMsg("Usuario creado. Ahora puedes iniciar sesión.");
      setTimeout(()=>nav("/login"), 900);
    }catch(e){ setErr(String(e.message || e)); }
  }

  return (
    <div className="section">
      <h1 className="h1">Crear cuenta</h1>
      {msg && <div className="notice">{msg}</div>}
      {err && <div className="error">{err}</div>}
      <form className="form" onSubmit={submit}>
        <div className="row cols">
          <div>
            <label>Nombre completo</label>
            <input value={fullname} onChange={e=>setFull(e.target.value)} required />
          </div>
          <div>
            <label>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
          </div>
        </div>
        <div className="row cols">
          <div>
            <label>Usuario</label>
            <input value={username} onChange={e=>setUser(e.target.value)} required />
          </div>
          <div>
            <label>Contraseña</label>
            <input type="password" value={password} onChange={e=>setPass(e.target.value)} required />
          </div>
        </div>
        <div className="row">
          <label>Rol</label>
          <select value={rol} onChange={e=>setRol(e.target.value)}>
            <option value="investigador">Investigador</option>
            <option value="explorador" disabled>Explorador (no requiere cuenta)</option>
          </select>
        </div>
        <button className="btn accent">Registrarme</button>
      </form>
    </div>
  );
}
