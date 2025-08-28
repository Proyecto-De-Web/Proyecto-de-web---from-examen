import mongoose from "mongoose";

// Este esquema define las preguntas que los visitantes pueden hacer
// sobre una investigación. Incluye el texto de la pregunta y, si
// es respondida por un investigador, se guarda la respuesta.
const preguntaSchema = new mongoose.Schema({
  investigacionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Investigacion",
    required: true,
    index: true
  },
  nombreVisitante: { type: String, default: "Anónimo", trim: true },
  texto: { type: String, required: true, trim: true, maxlength: 300 },

  // Campos de respuesta (solo los llena un investigador)
  respondida: { type: Boolean, default: false },
  respuesta: { type: String, trim: true, maxlength: 1000 },
  respondidaPor: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    nombre: { type: String, trim: true }
  },
  respondidaEn: { type: Date }
}, { timestamps: true });

// Exporto el modelo para usarlo en las rutas
export default mongoose.model("Pregunta", preguntaSchema);
