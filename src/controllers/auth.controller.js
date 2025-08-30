import bcrypt from "bcrypt";
import Users from "../models/User.js";

export const signup = async (req, res) => {
  try {
    const { fullname, email, username, password, rol } = req.body;

    const existsUser = await Users.findOne({ username });
    if (existsUser) return res.status(400).json({ message: "Username ya en uso" });

    const existsEmail = await Users.findOne({ email });
    if (existsEmail) return res.status(400).json({ message: "Email ya en uso" });

    const hash = await bcrypt.hash(password, 10);
    const user = await Users.create({
      fullname,
      email,
      username,
      password: hash,
      rol: rol || "explorador"
    });

    return res.status(201).json({
      id: user._id,
      username: user.username,
      rol: user.rol
    });
  } catch (e) {
    return res.status(500).json({ message: "Error en registro", error: String(e) });
  }
};

export const signin = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await Users.findOne({ username });
    if (!user) return res.status(404).json({ message: "Usuario no existe" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Password inválido" });

    req.session.user = {
      id: user._id.toString(),
      rol: user.rol,
      nombre: user.fullname
    };

    return res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      rol: user.rol
    });
  } catch (e) {
    return res.status(500).json({ message: "Error en login", error: String(e) });
  }
};

export const signout = async (_req, res) => {
  _req.session = null;
  return res.json({ message: "Sesión cerrada" });
};
