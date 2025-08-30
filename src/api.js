// ==========================
// BASE URL + helper abs()
// ==========================
const BASE =
  (import.meta.env.VITE_API_URL || import.meta.env.VITE_API || "").replace(/\/+$/, "") ||
  "http://localhost:5010";

// Helper para garantizar URL absoluta
function abs(u) {
  if (!u) return u;
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  if (u.startsWith("//")) return window.location.protocol + u;
  if (u.startsWith("/")) return `${BASE}${u}`;        // raíz absoluta
  return `${BASE}/${u}`;                              // relativa
}

// ==========================
// core fetch helper
// ==========================
async function api(path, opts = {}) {
  const isFormData = opts.body instanceof FormData;

  const res = await fetch(abs(path), {
    method: opts.method || "GET",
    credentials: "include",
    mode: "cors",
    headers: isFormData
      ? (opts.headers || undefined)
      : { "Content-Type": "application/json", ...(opts.headers || {}) },
    body: opts.body
  });

  const ct = res.headers.get("content-type") || "";

  // ⚠️ Manejo de sesión expirada
  if (res.status === 401 || res.status === 403) {
    alert("⚠️ Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.");
    localStorage.removeItem("user");
    window.location.href = "/login";
    return Promise.reject(new Error("Sesión expirada"));
  }

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      if (ct.includes("application/json")) {
        const j = await res.json();
        msg =
          j.message ||
          j.status_message ||
          j.body_message ||
          j.error ||
          JSON.stringify(j);
      } else {
        msg = await res.text();
      }
    } catch {}
    throw new Error(msg);
  }

  if (res.status === 204) return {};
  if (ct.includes("application/json")) return res.json();
  if (ct.startsWith("image/") || ct.includes("application/pdf")) return res;
  try { return await res.json(); } catch { return res; }
}

// ==========================
// AUTH API
// ==========================
export const AuthAPI = {
  _normalizeUserPayload(data) {
    const candidates = [data?.body_message, data?.user, data?.data, data].filter(Boolean);
    const raw = candidates.find(x => typeof x === "object") || {};
    const roles = raw.roles ?? raw.rol ?? raw.level ?? raw.nivel ?? "";
    return {
      id: raw.id ?? raw._id ?? raw.userId ?? null,
      username: raw.username ?? raw.name ?? raw.fullname ?? "",
      email: raw.email ?? "",
      roles: Array.isArray(roles) ? roles.join(",") : String(roles || "")
    };
  },
  signup(payload) {
    return api("/auth/signup", { method:"POST", body: JSON.stringify(payload) });
  },
  async signin({ username, password }) {
    const data = await api("/auth/signin", { method:"POST", body: JSON.stringify({ username, password }) });
    const user = this._normalizeUserPayload(data);
    if (!user || (!user.username && !user.email))
      throw new Error("No fue posible obtener el usuario desde la respuesta de login.");
    localStorage.setItem("user", JSON.stringify(user));
    return user;
  },
  async signout() {
    try { await api("/auth/signout", { method:"POST" }); }
    finally { localStorage.removeItem("user"); }
  },
  current() {
    try { return JSON.parse(localStorage.getItem("user")); }
    catch { return null; }
  }
};

// ==========================
// INVESTIGACIONES API
// ==========================
export const InvAPI = {
  list(params = {}) {
    const q = new URLSearchParams(params).toString();
    return api(`/api/investigaciones${q ? `?${q}` : ""}`);
  },
  get(id) {
    return api(`/api/investigaciones/${id}`);
  },
  pdfUrl(id) {
    return abs(`/api/investigaciones/${id}/pdf`);
  },
  imageUrl(id, idx) {
    return abs(`/api/investigaciones/${id}/imagenes/${idx}`);
  },
  imageUrlSingle(id) {
    return abs(`/api/investigaciones/${id}/imagen`);
  },
  async create(form) {
    const fd = new FormData();
    ["titulo","area","gradoAcademico","descripcion","conclusiones","recomendaciones"]
      .forEach(k => fd.append(k, form[k]));
    if (Array.isArray(form.descripciones) && form.descripciones.length) {
      fd.append("descripciones", JSON.stringify(form.descripciones));
    }
    fd.append("pdf", form.pdf);
    (form.imagenes || []).forEach(f => fd.append("imagenes", f));
    return api("/api/investigaciones", { method: "POST", body: fd });
  },
  async update(id, payload) {
    return api(`/api/investigaciones/${id}`, {
      method:"PUT",
      body: JSON.stringify(payload)
    });
  },
  remove(id) {
    return api(`/api/investigaciones/${id}`, { method:"DELETE" });
  }
};

// ==========================
// COMENTARIOS / PREGUNTAS API
// ==========================
export const ComentAPI = {
  add(invId, { nombreVisitante, texto, puntaje }) {
    return api(`/api/${invId}/comentarios`, {
      method:"POST",
      body: JSON.stringify({ nombreVisitante, texto, puntaje })
    });
  }
};

export const PregAPI = {
  ask(invId, { nombreVisitante, texto }) {
    return api(`/api/${invId}/preguntas`, {
      method:"POST",
      body: JSON.stringify({ nombreVisitante, texto })
    });
  },
  answer(preguntaId, { respuesta }) {
    return api(`/api/preguntas/${preguntaId}/responder`, {
      method:"POST",
      body: JSON.stringify({ respuesta })
    });
  }
};

export { BASE, abs };
