import React from "react";
import { abs } from "../api";

export default function RemoteImage({ src, alt = "", className = "", style }) {
  const [url, setUrl] = React.useState(null);
  const [err, setErr] = React.useState(null);

  React.useEffect(() => {
    let alive = true;
    let objectUrl;

    async function load() {
      setErr(null);
      setUrl(null);
      try {
        // omitimos credenciales porque el endpoint es público y así evitamos reglas de ACAO+credenciales
        const res = await fetch(abs(src) + (src.includes("?") ? "&" : "?") + "_cb=" + Date.now(), {
          method: "GET",
          credentials: "omit",
          mode: "cors",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        objectUrl = URL.createObjectURL(blob);
        if (alive) setUrl(objectUrl);
      } catch (e) {
        if (alive) setErr(e.message || "No se pudo cargar la imagen");
      }
    }

    if (src) load();
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  if (err) {
    return (
      <div className={`img-fallback ${className}`} style={{ background:"#eee", color:"#999", display:"grid", placeItems:"center", ...style }}>
        <span>Sin imagen</span>
      </div>
    );
  }
  if (!url) {
    return (
      <div className={`img-fallback ${className}`} style={{ background:"#f6f6f6", color:"#bbb", display:"grid", placeItems:"center", ...style }}>
        <span>Cargando…</span>
      </div>
    );
  }
  return <img src={url} alt={alt} className={className} style={style} />;
}
