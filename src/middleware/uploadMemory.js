import multer from "multer";

function pdfOnly(_req, file, cb) {
  if (file.mimetype === "application/pdf") cb(null, true);
  else cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "Solo se permiten PDFs"));
}

export const uploadPdfMem = multer({
  storage: multer.memoryStorage(),
  fileFilter: pdfOnly,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
}).single("pdf");
