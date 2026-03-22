import { Router } from "express";
import { addFriend, listFriends } from "../controllers/friendController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", requireAuth, listFriends);
router.post("/", requireAuth, addFriend);

export default router;
