import { Router } from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { uploadChatMedia } from "../controllers/uploadController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: path.join(__dirname, "../uploads"),
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname);
    const base = path
      .basename(file.originalname, extension)
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .slice(0, 24);

    callback(null, `${Date.now()}-${base}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const isAllowed =
      file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/");

    callback(isAllowed ? null : new Error("Only image and video uploads are supported."), isAllowed);
  },
});

const router = Router();

router.post("/chat-media", requireAuth, upload.single("file"), uploadChatMedia);

export default router;
