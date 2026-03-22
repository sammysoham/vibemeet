import { prisma } from "../utils/prisma.js";

export async function createReport(req, res) {
  const reportedUserId = String(req.body.reportedUserId || "");
  const reason = String(req.body.reason || "").trim();

  if (!reportedUserId || !reason) {
    return res.status(400).json({ error: "Reported user and reason are required." });
  }

  const report = await prisma.report.create({
    data: {
      reporterId: req.user.id,
      reportedUserId,
      reason,
    },
  });

  return res.status(201).json({ report });
}
