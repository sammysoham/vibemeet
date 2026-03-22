import { Router } from "express";
import {
  continueAsGuest,
  getCurrentUser,
  login,
  signup,
} from "../controllers/authController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { authRateLimiter } from "../middleware/rateLimiter.js";

const router = Router();

router.post("/signup", authRateLimiter, signup);
router.post("/login", authRateLimiter, login);
router.post("/guest", authRateLimiter, continueAsGuest);
router.get("/me", requireAuth, getCurrentUser);

export default router;
