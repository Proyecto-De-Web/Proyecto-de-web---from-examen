// @ts-nocheck
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import cookieSession from "cookie-session";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

// rutas
import authRoutes from "./src/routes/auth.js";
import invRoutes from "./src/routes/investigaciones.js";
import publicoRoutes from "./src/routes/publico.js";
import preguntasPublicas from "./src/routes/preguntas.js";
import respuestas from "./src/routes/respuestas.js";

dotenv.config();

const app = express();
app.set("trust proxy", 1);

// ==== CORS (permite todas las redes en DEV con CORS_ORIGIN=ALL, o una lista separada por comas) ====
const allowAllInDev = (process.env.CORS_ORIGIN || "").toUpperCase() === "ALL";
app.use(cors({
  origin: allowAllInDev
    ? (origin, cb) => cb(null, true)
    : (process.env.CORS_ORIGIN || "http://localhost:5173").split(","),
  credentials: true,
  methods: ["GET","POST","PUT","DELETE","PATCH","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"]
}));

// ==== Parsers y seguridad ====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(morgan("dev"));

// ==== Sesión por cookies (HTTP en dev; para HTTPS cruzado usar sameSite:'none', secure:true) ====
app.use(cookieSession({
  name: "academico-session",
  secret: process.env.COOKIE_SECRET || "COOKIE_SECRET",
  httpOnly: true,
  sameSite: "lax",   // en dev con mismo host/IP
  secure: false,     // true solo si usas HTTPS
  maxAge: 60 * 60 * 1000
}));

// ==== Timeouts ====
app.use((req, res, next) => {
  req.setTimeout(10000);
  res.setTimeout(10000);
  next();
});

// ==== Rutas básicas ====
app.get("/health", (_req, res) => res.json({ ok: true }));

// Evita 404 al entrar a "/"
app.get("/", (_req, res) => {
  res.json({
    ok: true,
    message: "API Académico viva 👋",
    docs: "/health"
  });
});

// ==== Rutas de la app ====
app.use("/auth", authRoutes);
app.use("/api/investigaciones", invRoutes);
app.use("/api", publicoRoutes);
app.use("/api", preguntasPublicas);
app.use("/api", respuestas);

// 404
app.use((req, res) => res.status(404).json({ message: "Ruta no encontrada" }));

// ==== Server y Mongo ====
const PORT = process.env.PORT || 5010;
const HOST = process.env.HOST || "0.0.0.0"; // 👈 escucha en todas las interfaces

async function start() {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/academico";
    await mongoose.connect(mongoUri);
    console.log("MongoDB conectado:", mongoUri);

    const server = app.listen(PORT, HOST, () => {
      console.log(`Servidor escuchando en http://${HOST}:${PORT}`);
    });
    server.keepAliveTimeout = 30_000;
    server.headersTimeout = 35_000;
  } catch (err) {
    console.error("Error conectando a MongoDB:", err);
    process.exit(1);
  }
}

start();
