import { Router } from "express";
import { getOnlineCount } from "../controllers/userController.js";

const router = Router();

router.get("/online", getOnlineCount);

export default router;
