import mongoose from "mongoose";

const preguntaSchema = new mongoose.Schema({
  investigacionId: { type: mongoose.Schema.Types.ObjectId, ref: "Investigacion", required: true, index: true },
  nombreVisitante: { type: String, default: "Anónimo", trim: true },
  texto: { type: String, required: true, trim: true, maxlength: 300 },
  respondida: { type: Boolean, default: false },
  respuesta: { type: String, trim: true, maxlength: 1000 },
  respondidaPor: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    nombre: { type: String, trim: true }
  },
  respondidaEn: { type: Date }
}, { timestamps: true });

export default mongoose.models.Pregunta ||
  mongoose.model("Pregunta", preguntaSchema);
