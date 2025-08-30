import multer from "multer";

const storage = multer.memoryStorage();

// Acepta: pdf (application/pdf) y múltiples imágenes (image/*) con campo "imagenes"
function mixedFileFilter(_req, file, cb) {
  const isPdf = file.fieldname === "pdf" && file.mimetype === "application/pdf";
  const isImg = file.fieldname === "imagenes" && file.mimetype.startsWith("image/");
  if (isPdf || isImg) return cb(null, true);
  return cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", `Campo no permitido: ${file.fieldname}`));
}

export const uploadFilesMem = multer({
  storage,
  fileFilter: mixedFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB por archivo
}).any();
