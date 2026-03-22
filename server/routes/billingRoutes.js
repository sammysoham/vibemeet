import { Router } from "express";
import { createCheckoutSession } from "../controllers/billingController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/checkout", requireAuth, createCheckoutSession);

export default router;
