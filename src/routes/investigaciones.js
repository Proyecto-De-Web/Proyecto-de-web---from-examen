import { Router } from "express";
import { z } from "zod";
import Investigacion, { Comentario } from "../models/Investigacion.js";
import { requireSession, isInvestigador } from "../middleware/auth.js";
import { uploadFilesMem } from "../middleware/uploadMemory.js";
import Pregunta from "../models/Pregunta.js";

const router = Router();

const invSchemaMultipart = z.object({
  titulo: z.string().min(3).max(120),
  area: z.string().min(3).max(60),
  gradoAcademico: z.enum(["7","8","9","10","11","12"]),
  descripcion: z.string().min(1).max(500),
  conclusiones: z.string().min(1).max(500),
  recomendaciones: z.string().min(1).max(500),
  // descripciones opcionales para cada imagen
  descripciones: z.preprocess((v) => {
    if (typeof v === "string") {
      try { return JSON.parse(v); } catch { return []; }
    }
    return Array.isArray(v) ? v : [];
  }, z.array(z.string()).optional().default([]))
});

// LISTAR (público) sin incluir base64
router.get("/", async (req, res) => {
  try {
    const { area, grado, q, page = "1", limit = "10" } = req.query;
    const where = {};
    if (area) where.area = area;
    if (grado) where.gradoAcademico = grado;
    if (q) where.$or = [{ titulo: new RegExp(q, "i") }, { descripcion: new RegExp(q, "i") }];

    const pageN = Math.max(parseInt(page, 10), 1);
    const limitN = Math.min(Math.max(parseInt(limit, 10), 1), 50);

    const [items, total] = await Promise.all([
      Investigacion.find(where, { "pdf.base64": 0, "imagenes.file.base64": 0, "imagen.file.base64": 0 })
        .sort({ titulo: 1 }).skip((pageN - 1) * limitN).limit(limitN),
      Investigacion.countDocuments(where)
    ]);

    res.json({ total, page: pageN, limit: limitN, items });
  } catch {
    res.status(500).json({ message: "Error listando investigaciones" });
  }
});

// CREAR (investigador) con PDF + N imágenes (base64)
router.post("/", requireSession, isInvestigador, (req, res) => {
  uploadFilesMem(req, res, async (err) => {
    try {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") return res.status(400).json({ message: "Un archivo excede 10MB" });
        return res.status(400).json({ message: err.message || "Error al subir archivos" });
      }

      const data = invSchemaMultipart.parse(req.body);
      const files = Array.isArray(req.files) ? req.files : [];
      const pdfFile = files.find(f => f.fieldname === "pdf");
      const imgFiles = files.filter(f => f.fieldname === "imagenes");

      if (!pdfFile) return res.status(400).json({ message: "Falta el archivo PDF (campo 'pdf')" });

      const MAX_IMG = 5 * 1024 * 1024; // 5MB recomendado por imagen
      for (const f of imgFiles) {
        if (!f.mimetype.startsWith("image/")) {
          return res.status(400).json({ message: `El archivo no es una imagen: ${f.originalname}` });
        }
        if (f.size > MAX_IMG) {
          return res.status(400).json({ message: `Imagen demasiado grande (máx 5MB): ${f.originalname}` });
        }
      }

      const pdfBase64 = pdfFile.buffer.toString("base64");
      const imagenes = imgFiles.map((f, i) => ({
        file: {
          base64: f.buffer.toString("base64"),
          mime: f.mimetype,
          originalName: f.originalname,
          size: f.size
        },
        descripcion: data.descripciones[i] || ""
      }));

      const inv = await Investigacion.create({
        titulo: data.titulo,
        area: data.area,
        gradoAcademico: data.gradoAcademico,
        descripcion: data.descripcion,
        pdf: {
          base64: pdfBase64,
          originalName: pdfFile.originalname,
          size: pdfFile.size,
          mime: pdfFile.mimetype
        },
        imagenes,
        conclusiones: data.conclusiones,
        recomendaciones: data.recomendaciones,
        autor: { userId: req.session.user.id, nombre: req.session.user.nombre || "Autor" }
      });

      const invSafe = inv.toObject();
      delete invSafe.pdf.base64;
      if (Array.isArray(invSafe.imagenes)) {
        invSafe.imagenes = invSafe.imagenes.map(img => ({
          ...img,
          file: { ...img.file, base64: undefined }
        }));
      }

      res.status(201).json(invSafe);
    } catch (e) {
      if (e?.issues) return res.status(400).json({ message: "Datos inválidos", errors: e.issues });
      console.error(e);
      res.status(500).json({ message: "Error creando investigación" });
    }
  });
});

// DETALLE (público) sin base64 + preguntas y comentarios
router.get("/:id", async (req, res) => {
  try {
    const inv = await Investigacion.findById(req.params.id)
      .select({ "pdf.base64": 0, "imagenes.file.base64": 0, "imagen.file.base64": 0 });
    if (!inv) return res.status(404).json({ message: "No encontrada" });

    const [comentarios, preguntas] = await Promise.all([
      Comentario.find({ investigacionId: inv._id }).sort({ createdAt: -1 }),
      Pregunta.find({ investigacionId: inv._id }).sort({ createdAt: -1 })
    ]);

    res.json({ inv, comentarios, preguntas });
  } catch {
    res.status(500).json({ message: "Error obteniendo detalle" });
  }
});

// DESCARGA PDF desde base64
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

// SERVIR imagen por índice (nuevo carrusel)
router.get("/:id/imagenes/:idx", async (req, res) => {
  try {
    const inv = await Investigacion.findById(req.params.id).select({ imagenes: 1, imagen: 1 });
    if (!inv) return res.status(404).json({ message: "No encontrada" });

    const idx = Number(req.params.idx);
    const hasArray = Array.isArray(inv.imagenes) && inv.imagenes.length > 0;

    if (hasArray) {
      if (!Number.isInteger(idx) || idx < 0 || idx >= inv.imagenes.length) {
        return res.status(404).json({ message: "Índice de imagen inválido" });
      }
      const img = inv.imagenes[idx];
      if (!img?.file?.base64) return res.status(404).json({ message: "Imagen no disponible" });
      const buf = Buffer.from(img.file.base64, "base64");
      res.setHeader("Content-Type", img.file.mime || "application/octet-stream");
      res.setHeader("Content-Length", buf.length);
      res.setHeader("Content-Disposition", `inline; filename="${img.file.originalName || "imagen" + idx}"`);
      return res.status(200).end(buf);
    }

    if (inv.imagen?.file?.base64) {
      const buf = Buffer.from(inv.imagen.file.base64, "base64");
      res.setHeader("Content-Type", inv.imagen.file.mime || "application/octet-stream");
      res.setHeader("Content-Length", buf.length);
      res.setHeader("Content-Disposition", `inline; filename="${inv.imagen.file.originalName || "imagen"}"`);
      return res.status(200).end(buf);
    }

    return res.status(404).json({ message: "Imagen no disponible" });
  } catch {
    res.status(500).json({ message: "Error sirviendo imagen" });
  }
});

// Compatibilidad: servir primera imagen o imagen única en /:id/imagen
router.get("/:id/imagen", async (req, res) => {
  try {
    const inv = await Investigacion.findById(req.params.id).select({ imagenes: 1, imagen: 1 });
    if (!inv) return res.status(404).json({ message: "No encontrada" });

    if (Array.isArray(inv.imagenes) && inv.imagenes.length > 0 && inv.imagenes[0]?.file?.base64) {
      const img = inv.imagenes[0];
      const buf = Buffer.from(img.file.base64, "base64");
      res.setHeader("Content-Type", img.file.mime || "application/octet-stream");
      res.setHeader("Content-Length", buf.length);
      res.setHeader("Content-Disposition", `inline; filename="${img.file.originalName || "imagen0"}"`);
      return res.status(200).end(buf);
    }

    if (inv.imagen?.file?.base64) {
      const buf = Buffer.from(inv.imagen.file.base64, "base64");
      res.setHeader("Content-Type", inv.imagen.file.mime || "application/octet-stream");
      res.setHeader("Content-Length", buf.length);
      res.setHeader("Content-Disposition", `inline; filename="${inv.imagen.file.originalName || "imagen"}"`);
      return res.status(200).end(buf);
    }

    return res.status(404).json({ message: "Imagen no disponible" });
  } catch {
    res.status(500).json({ message: "Error sirviendo imagen" });
  }
});

// ACTUALIZAR (solo texto)
router.put("/:id", requireSession, isInvestigador, async (req, res) => {
  try {
    const data = z.object({
      titulo: z.string().min(3).max(120).optional(),
      area: z.string().min(3).max(60).optional(),
      gradoAcademico: z.enum(["7","8","9","10","11","12"]).optional(),
      descripcion: z.string().min(1).max(500).optional(),
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
    if (Array.isArray(invSafe.imagenes)) {
      invSafe.imagenes = invSafe.imagenes.map(img => ({
        ...img,
        file: { ...img.file, base64: undefined }
      }));
    }
    if (invSafe.imagen?.file) invSafe.imagen.file.base64 = undefined;

    res.json(invSafe);
  } catch (e) {
    if (e?.issues) return res.status(400).json({ message: "Datos inválidos", errors: e.issues });
    res.status(500).json({ message: "Error actualizando" });
  }
});

// ELIMINAR (solo autor)
router.delete("/:id", requireSession, isInvestigador, async (req, res) => {
  try {
    const inv = await Investigacion.findById(req.params.id);
    if (!inv) return res.status(404).json({ message: "No encontrada" });

    if (String(inv.autor.userId) !== String(req.session.user.id)) {
      return res.status(403).json({ message: "Solo el autor puede eliminar" });
    }

    await inv.deleteOne();
    await Promise.all([
      Comentario.deleteMany({ investigacionId: inv._id }),
      Pregunta.deleteMany({ investigacionId: inv._id })
    ]);

    res.json({ ok: true });
  } catch {
    res.status(500).json({ message: "Error eliminando" });
  }
});

export default router;
