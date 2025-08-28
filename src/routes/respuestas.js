import { Router } from "express";
import { z } from "zod";
import Pregunta from "../models/Pregunta.js";
import { requireSession, isInvestigador } from "../middleware/auth.js";

const router = Router();

// Valido que la respuesta tenga contenido
const respuestaSchema = z.object({
  respuesta: z.string().min(1).max(1000)
});

// Solo un investigador puede responder una pregunta
router.post("/preguntas/:pid/responder", requireSession, isInvestigador, async (req, res) => {
  try {
    const data = respuestaSchema.parse(req.body);
    const p = await Pregunta.findById(req.params.pid);
    if (!p) return res.status(404).json({ message: "Pregunta no encontrada" });
    if (p.respondida) return res.status(409).json({ message: "La pregunta ya fue respondida" });

    p.respondida = true;
    p.respuesta = data.respuesta;
    p.respondidaPor = { userId: req.session.user.id, nombre: req.session.user.nombre || "Investigador" };
    p.respondidaEn = new Date();
    await p.save();

    res.status(200).json(p);
  } catch (e) {
    if (e?.issues) return res.status(400).json({ message: "Datos inválidos", errors: e.issues });
    res.status(500).json({ message: "Error respondiendo pregunta" });
  }
});

export default router;
