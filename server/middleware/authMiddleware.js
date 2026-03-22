import { prisma } from "../utils/prisma.js";
import { verifyToken } from "../utils/jwt.js";

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  if (!token) {
    return res.status(401).json({ error: "Missing auth token." });
  }

  try {
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid auth token." });
    }

    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid auth token." });
  }
}
