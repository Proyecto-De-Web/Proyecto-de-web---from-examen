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

dotenv.config();

const app = express();
app.set("trust proxy", 1);

app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5010",
  credentials: true,
  methods: ["GET","POST","PUT","DELETE","PATCH","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(morgan("dev"));

app.use(cookieSession({
  name: "academico-session",
  secret: process.env.COOKIE_SECRET || "COOKIE_SECRET",
  httpOnly: true,
  sameSite: "lax",   
  secure: false,     
  maxAge: 60 * 60 * 1000
}));

app.use((req, res, next) => {
  req.setTimeout(10000);
  res.setTimeout(10000);
  next();
});

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/auth", authRoutes);
app.use("/api/investigaciones", invRoutes);
app.use("/api", publicoRoutes);

// Pagina no encontrada basicamente 404
app.use((req, res) => res.status(404).json({ message: "Ruta no encontrada" }));

const PORT = process.env.PORT || 5010;

// Iniciar la aplicacion y conecxion con mongo
async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/academico");
    console.log("MongoDB conectado:", process.env.MONGO_URI || "mongodb://127.0.0.1:27017/academico");

    const server = app.listen(PORT, () => {
      console.log("Servidor escuchando en http://localhost:" + PORT);
    });
    server.keepAliveTimeout = 30_000;
    server.headersTimeout = 35_000;
  } catch (err) {
    console.error("Error conectando a MongoDB:", err);
    process.exit(1);
  }
}

start();
