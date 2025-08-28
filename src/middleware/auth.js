import Users from "../models/User.js";

export const requireSession = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(403).json({ message: "Login requerido" });
  }
  next();
};

export const isAdmin = async (req, res, next) => {
  try {
    const uid = req.session?.user?.id;
    const user = await Users.findById(uid);
    if (user?.rol === "admin") return next();
    return res.status(403).json({ message: "Solo admin" });
  } catch (e) {
    return res.status(500).json({ message: "Error validando rol" });
  }
};

export const isInvestigador = async (req, res, next) => {
  try {
    const uid = req.session?.user?.id;
    const user = await Users.findById(uid);
    if (user?.rol === "investigador" || user?.rol === "admin") return next();
    return res.status(403).json({ message: "Solo investigadores" });
  } catch (e) {
    return res.status(500).json({ message: "Error validando rol" });
  }
};
