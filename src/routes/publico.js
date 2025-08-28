
import { Router } from "express";
import { z } from "zod";
import Investigacion, { Comentario } from "../models/Investigacion.js";

const router = Router();

const comentarioSchema = z.object({
  nombreVisitante: z.string().max(60).optional(),
  texto: z.string().min(1).max(100),
  puntaje: z.number().int().min(1).max(5)
});


router.post("/:id/comentarios", async (req, res) => {
  try {
    const inv = await Investigacion.findById(req.params.id);
    if (!inv) return res.status(404).json({ message: "Investigación no encontrada" });

    const data = comentarioSchema.parse(req.body);
    const c = await Comentario.create({
      investigacionId: inv._id,
      nombreVisitante: data.nombreVisitante || "Anónimo",
      texto: data.texto,
      puntaje: data.puntaje
    });

    const agg = await Comentario.aggregate([
      { $match: { investigacionId: inv._id } },
      { $group: { _id: "$investigacionId", avg: { $avg: "$puntaje" } } }
    ]);
    inv.promedioPuntaje = agg[0]?.avg || 0;
    await inv.save();

    res.status(201).json(c);
  } catch (e) {
    if (e?.issues) return res.status(400).json({ message: "Datos inválidos", errors: e.issues });
    res.status(500).json({ message: "Error agregando comentario" });
  }
});

const preguntaSchema = z.object({
  nombreVisitante: z.string().max(60).optional(),
  texto: z.string().min(1).max(300)
});




import { requireSession, isInvestigador } from "../middleware/auth.js";
const respuestaSchema = z.object({ respuesta: z.string().min(1).max(500) });

export default router;

