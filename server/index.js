import "dotenv/config";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { Server } from "socket.io";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import billingRoutes from "./routes/billingRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import friendRoutes from "./routes/friendRoutes.js";
import { generalRateLimiter } from "./middleware/rateLimiter.js";
import { registerSocketHandlers } from "./sockets/registerSocketHandlers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const server = http.createServer(app);

const allowedOrigin = process.env.CLIENT_URL || "http://localhost:3000";

const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    methods: ["GET", "POST"],
  },
});

app.locals.io = io;

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  }),
);
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  }),
);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(generalRateLimiter);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "VibeMeet API" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/friends", friendRoutes);

app.use((error, _req, res, _next) => {
  const message = error.message || "Unexpected server error.";
  res.status(500).json({ error: message });
});

registerSocketHandlers(io);

const PORT = Number(process.env.PORT || 4000);
server.listen(PORT, () => {
  console.log(`VibeMeet server running on http://localhost:${PORT}`);
});
