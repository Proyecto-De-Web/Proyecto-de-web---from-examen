import { Router } from "express";
import { z } from "zod";
import Investigacion from "../models/Investigacion.js";
import Pregunta from "../models/Pregunta.js";

const router = Router();

// Valido los datos de la pregunta
const preguntaSchema = z.object({
  nombreVisitante: z.string().max(60).optional(),
  texto: z.string().min(1).max(300)
});

// Endpoint para crear una pregunta en una investigación
// Cualquier visitante (sin login) puede hacerlo
router.post("/:id/preguntas", async (req, res) => {
  try {
    const inv = await Investigacion.findById(req.params.id);
    if (!inv) return res.status(404).json({ message: "Investigación no encontrada" });

    const data = preguntaSchema.parse(req.body);
    const p = await Pregunta.create({
      investigacionId: inv._id,
      nombreVisitante: data.nombreVisitante || "Anónimo",
      texto: data.texto
    });

    res.status(201).json(p);
  } catch (e) {
    if (e?.issues) return res.status(400).json({ message: "Datos inválidos", errors: e.issues });
    res.status(500).json({ message: "Error creando pregunta" });
  }
});

export default router;
