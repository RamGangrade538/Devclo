import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const healthRouter = Router();

healthRouter.get("/", async (_req, res) => {
  let db = "down";
  try {
    await prisma.$queryRaw`SELECT 1`;
    db = "up";
  } catch {
    db = "down";
  }

  res.status(db === "up" ? 200 : 503).json({
    status: db === "up" ? "ok" : "degraded",
    db,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});
