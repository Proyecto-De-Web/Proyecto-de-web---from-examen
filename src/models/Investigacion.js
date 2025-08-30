import mongoose from "mongoose";

const comentarioSchema = new mongoose.Schema({
  investigacionId: { type: mongoose.Schema.Types.ObjectId, ref: "Investigacion", required: true, index: true },
  nombreVisitante: { type: String, default: "Anónimo", trim: true },
  texto: { type: String, required: true, maxlength: 100, trim: true },
  puntaje: { type: Number, min: 1, max: 5, required: true }
}, { timestamps: true });

export const Comentario =
  mongoose.models.Comentario || mongoose.model("Comentario", comentarioSchema);

const imagenArchivoSchema = new mongoose.Schema({
  base64: { type: String, required: true },
  mime: { type: String, required: true },
  originalName: { type: String, required: true },
  size: { type: Number, required: true }
}, { _id: false });

const imagenSchema = new mongoose.Schema({
  file: { type: imagenArchivoSchema, required: true },
  descripcion: { type: String, default: "", trim: true }
}, { _id: true });

const investigacionSchema = new mongoose.Schema({
  titulo: { type: String, required: true, trim: true, index: true },
  area: { type: String, required: true, trim: true, index: true },
  gradoAcademico: { type: String, required: true, trim: true, index: true },
  descripcion: { type: String, required: true, maxlength: 500, trim: true },
  pdf: {
    base64: { type: String, required: true },
    originalName: { type: String, required: true },
    size: { type: Number, required: true },
    mime: { type: String, required: true }
  },
  imagenes: { type: [imagenSchema], default: [] },
  imagen: {
    type: new mongoose.Schema({
      file: { type: imagenArchivoSchema, required: true },
      descripcion: { type: String, default: "", trim: true }
    }, { _id: false }),
    required: false
  },
  conclusiones: { type: String, required: true, maxlength: 500, trim: true },
  recomendaciones: { type: String, required: true, maxlength: 500, trim: true },
  autor: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    nombre: { type: String, required: true, trim: true }
  },
  promedioPuntaje: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.models.Investigacion ||
  mongoose.model("Investigacion", investigacionSchema);
