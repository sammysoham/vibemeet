import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "development-secret";
const ONE_WEEK_IN_SECONDS = 60 * 60 * 24 * 7;

export function signToken(user) {
  return jwt.sign({ userId: user.id }, JWT_SECRET, {
    expiresIn: ONE_WEEK_IN_SECONDS,
  });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}
