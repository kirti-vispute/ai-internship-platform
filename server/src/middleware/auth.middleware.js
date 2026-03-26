const User = require("../models/User");
const { verifyToken } = require("../utils/jwt");

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized: token missing" });
    }

    const payload = verifyToken(token);
    const user = await User.findById(payload.userId).select("_id email role isActive");

    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Unauthorized: invalid user" });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: invalid token" });
  }
}

module.exports = authMiddleware;
