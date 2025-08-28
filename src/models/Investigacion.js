import mongoose from "mongoose";

const comentarioSchema = new mongoose.Schema({
  investigacionId: { type: mongoose.Schema.Types.ObjectId, ref: "Investigacion", required: true, index: true },
  nombreVisitante: { type: String, default: "Anónimo", trim: true },
  texto: { type: String, required: true, maxlength: 100, trim: true },
  puntaje: { type: Number, min: 1, max: 5, required: true }
}, { timestamps: true });

export const Comentario = mongoose.model("Comentario", comentarioSchema);

const imagenSchema = new mongoose.Schema({
  url: { type: String, required: true, trim: true },
  descripcion: { type: String, default: "", trim: true }
}, { _id: false });

// ===== Investigación =====
// PDF se guarda como Base64 + metadatos (NO archivo en disco)
const investigacionSchema = new mongoose.Schema({
  titulo: { type: String, required: true, trim: true, index: true },
  area: { type: String, required: true, trim: true, index: true },
  gradoAcademico: { type: String, required: true, trim: true, index: true },
  descripcion: { type: String, required: true, maxlength: 500, trim: true },

  // --- PDF en Base64 + metadatos ---
  pdf: {
    base64: { type: String, required: true },       
    originalName: { type: String, required: true },  
    size: { type: Number, required: true },         
    mime: { type: String, required: true }         
  },

  imagenes: { type: [imagenSchema], validate: v => v.length >= 4 && v.length <= 6 },

  conclusiones: { type: String, required: true, maxlength: 500, trim: true },
  recomendaciones: { type: String, required: true, maxlength: 500, trim: true },

  autor: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    nombre: { type: String, required: true, trim: true }
  },

  promedioPuntaje: { type: Number, default: 0 }
}, { timestamps: true });

// Índices útiles para filtros
investigacionSchema.index({ titulo: 1 });
investigacionSchema.index({ area: 1, gradoAcademico: 1 });

export default mongoose.model("Investigacion", investigacionSchema);
