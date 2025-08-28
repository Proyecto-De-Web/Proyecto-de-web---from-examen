import { Router } from "express";
import { z } from "zod";
import Investigacion, { Comentario } from "../models/Investigacion.js";
import { requireSession, isInvestigador } from "../middleware/auth.js";
import { uploadPdfMem } from "../middleware/uploadMemory.js";

const router = Router();

const imgSchema = z.object({
  url: z.string().url(),
  descripcion: z.string().max(200).optional().default("")
});

const invSchemaMultipart = z.object({
  titulo: z.string().min(3).max(120),
  area: z.string().min(3).max(60),
  gradoAcademico: z.string().min(1).max(60),
  descripcion: z.string().min(1).max(500),
  imagenes: z.preprocess((v) => {
    if (typeof v === "string") { try { return JSON.parse(v); } catch { return v; } }
    return v;
  }, z.array(imgSchema).min(4).max(6)),
  conclusiones: z.string().min(1).max(500),
  recomendaciones: z.string().min(1).max(500)
});

// LISTAR (público) sin incluir el base64
router.get("/", async (req, res) => {
  try {
    const { area, grado, q, page = "1", limit = "10" } = req.query;
    const where = {};
    if (area) where.area = area;
    if (grado) where.gradoAcademico = grado;
    if (q) where.$or = [{ titulo: new RegExp(q, "i") }, { descripcion: new RegExp(q, "i") }];

    const pageN = Math.max(parseInt(page), 1);
    const limitN = Math.min(Math.max(parseInt(limit), 1), 50);

    const [items, total] = await Promise.all([
      Investigacion.find(where, { "pdf.base64": 0 }) // excluye base64
        .sort({ titulo: 1 }).skip((pageN - 1) * limitN).limit(limitN),
      Investigacion.countDocuments(where)
    ]);
    res.json({ total, page: pageN, limit: limitN, items });
  } catch {
    res.status(500).json({ message: "Error listando investigaciones" });
  }
});

// CREAR (investigador) con PDF en Base64
router.post("/", requireSession, isInvestigador, (req, res) => {
  uploadPdfMem(req, res, async (err) => {
    try {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") return res.status(400).json({ message: "El PDF excede 10MB" });
        return res.status(400).json({ message: err.message || "Error al subir el PDF" });
      }
      if (!req.file) return res.status(400).json({ message: "Falta el archivo PDF (campo 'pdf')" });

      const data = invSchemaMultipart.parse(req.body);
      const base64 = req.file.buffer.toString("base64");

      const inv = await Investigacion.create({
        ...data,
        pdf: {
          base64,
          originalName: req.file.originalname,
          size: req.file.size,
          mime: req.file.mimetype
        },
        autor: { userId: req.session.user.id, nombre: req.session.user.nombre || "Autor" }
      });

      const invSafe = inv.toObject();
      delete invSafe.pdf.base64;
      res.status(201).json(invSafe);
    } catch (e) {
      if (e?.issues) return res.status(400).json({ message: "Datos inválidos", errors: e.issues });
      console.error(e);
      res.status(500).json({ message: "Error creando investigación" });
    }
  });
});

// DETALLE (público) sin base64
router.get("/:id", async (req, res) => {
  try {
    const inv = await Investigacion.findById(req.params.id).select({ "pdf.base64": 0 });
    if (!inv) return res.status(404).json({ message: "No encontrada" });
    const comentarios = await Comentario.find({ investigacionId: inv._id }).sort({ createdAt: -1 });
    res.json({ inv, comentarios });
  } catch {
    res.status(500).json({ message: "Error obteniendo detalle" });
  }
});

// DESCARGA del PDF reconstruyendo desde Base64
router.get("/:id/pdf", async (req, res) => {
  try {
    const inv = await Investigacion.findById(req.params.id).select({ pdf: 1 });
    if (!inv) return res.status(404).json({ message: "No encontrada" });
    if (!inv.pdf?.base64) return res.status(404).json({ message: "PDF no disponible" });

    const buf = Buffer.from(inv.pdf.base64, "base64");
    res.setHeader("Content-Type", inv.pdf.mime || "application/pdf");
    res.setHeader("Content-Length", buf.length);
    res.setHeader("Content-Disposition", `inline; filename="${inv.pdf.originalName || "documento.pdf"}"`);
    return res.status(200).end(buf);
  } catch {
    res.status(500).json({ message: "Error sirviendo PDF" });
  }
});

// ACTUALIZAR AUTOR
router.put("/:id", requireSession, isInvestigador, async (req, res) => {
  try {
    const data = z.object({
      titulo: z.string().min(3).max(120).optional(),
      area: z.string().min(3).max(60).optional(),
      gradoAcademico: z.string().min(1).max(60).optional(),
      descripcion: z.string().min(1).max(500).optional(),
      imagenes: z.array(imgSchema).min(4).max(6).optional(),
      conclusiones: z.string().min(1).max(500).optional(),
      recomendaciones: z.string().min(1).max(500).optional()
    }).parse(req.body);

    const inv = await Investigacion.findById(req.params.id);
    if (!inv) return res.status(404).json({ message: "No encontrada" });
    if (String(inv.autor.userId) !== String(req.session.user.id)) {
      return res.status(403).json({ message: "Solo el autor puede editar" });
    }

    Object.assign(inv, data);
    await inv.save();
    const invSafe = inv.toObject();
    delete invSafe.pdf?.base64;
    res.json(invSafe);
  } catch (e) {
    if (e?.issues) return res.status(400).json({ message: "Datos inválidos", errors: e.issues });
    res.status(500).json({ message: "Error actualizando" });
  }
});

// ELIMINAR EL AUTOR
router.delete("/:id", requireSession, isInvestigador, async (req, res) => {
  try {
    const inv = await Investigacion.findById(req.params.id);
    if (!inv) return res.status(404).json({ message: "No encontrada" });
    if (String(inv.autor.userId) !== String(req.session.user.id)) {
      return res.status(403).json({ message: "Solo el autor puede eliminar" });
    }
    await inv.deleteOne();
    await Comentario.deleteMany({ investigacionId: inv._id });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ message: "Error eliminando" });
  }
});

export default router;
