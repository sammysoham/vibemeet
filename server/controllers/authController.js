import bcrypt from "bcryptjs";
import { prisma } from "../utils/prisma.js";
import { signToken } from "../utils/jwt.js";

function serializeUser(user) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    gender: user.gender,
    isPremium: user.isPremium,
    isGuest: user.isGuest,
    acceptedTermsAt: user.acceptedTermsAt,
    createdAt: user.createdAt,
  };
}

function buildAuthResponse(user) {
  return {
    token: signToken(user),
    user: serializeUser(user),
  };
}

export async function signup(req, res) {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const displayName = String(req.body.displayName || "").trim();
  const gender = String(req.body.gender || "UNSPECIFIED").toUpperCase();
  const acceptedTerms = Boolean(req.body.acceptedTerms);

  if (!email || !password || !displayName) {
    return res.status(400).json({ error: "Email, password, and display name are required." });
  }

  if (!acceptedTerms) {
    return res.status(400).json({ error: "You must accept the Terms and Conditions to continue." });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters long." });
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    return res.status(409).json({ error: "An account with that email already exists." });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      displayName,
      gender,
      acceptedTermsAt: new Date(),
    },
  });

  return res.status(201).json(buildAuthResponse(user));
}

export async function login(req, res) {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const acceptedTerms = Boolean(req.body.acceptedTerms);

  if (!acceptedTerms) {
    return res.status(400).json({ error: "You must accept the Terms and Conditions to continue." });
  }

  let user = await prisma.user.findUnique({ where: { email } });

  if (!user?.passwordHash) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);

  if (!isValid) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  if (!user.acceptedTermsAt) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { acceptedTermsAt: new Date() },
    });
  }

  return res.json(buildAuthResponse(user));
}

export async function continueAsGuest(req, res) {
  const displayName =
    String(req.body.displayName || "").trim() ||
    `Guest${Math.floor(Math.random() * 10000)}`;
  const gender = String(req.body.gender || "UNSPECIFIED").toUpperCase();
  const acceptedTerms = Boolean(req.body.acceptedTerms);

  if (!acceptedTerms) {
    return res.status(400).json({ error: "You must accept the Terms and Conditions to continue." });
  }

  const user = await prisma.user.create({
    data: {
      displayName,
      gender,
      isGuest: true,
      acceptedTermsAt: new Date(),
    },
  });

  return res.status(201).json(buildAuthResponse(user));
}

export async function getCurrentUser(req, res) {
  return res.json({ user: serializeUser(req.user) });
}
