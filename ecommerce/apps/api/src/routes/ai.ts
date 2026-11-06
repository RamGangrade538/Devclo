import { Router, Request, Response } from "express";
import { AIExplainer } from "../ai/explainer.js";

const router = Router();
const explainer = new AIExplainer();

router.post("/explain-lesson", async (req: Request, res: Response) => {
  try {
    const { topic, level } = req.body || {};
    if (!topic) {
      return res.status(400).json({ error: "Topic is required" });
    }
    const result = await explainer.explainLesson(topic, (level as "beginner" | "intermediate" | "advanced") || "beginner");
    return res.json(result);
  } catch (error) {
    console.error("Error explaining lesson:", error);
    return res.status(500).json({ error: "Failed to explain lesson" });
  }
});

router.post("/generate-quiz", async (req: Request, res: Response) => {
  try {
    const { topic, count } = req.body || {};
    if (!topic) {
      return res.status(400).json({ error: "Topic is required" });
    }
    const countNum = count || 5;
    const questions = await explainer.generateQuiz(topic, countNum);
    return res.json(questions);
  } catch (error) {
    console.error("Error generating quiz:", error);
    return res.status(500).json({ error: "Failed to generate quiz" });
  }
});

router.post("/assign-task", async (req: Request, res: Response) => {
  try {
    const { topic } = req.body || {};
    if (!topic) {
      return res.status(400).json({ error: "Topic is required" });
    }
    const task = await explainer.assignTask(topic);
    return res.json(task);
  } catch (error) {
    console.error("Error assigning task:", error);
    return res.status(500).json({ error: "Failed to assign task" });
  }
});

router.get("/text-to-speech", async (req: Request, res: Response) => {
  try {
    const { text } = req.query;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Text is required" });
    }
    const audioBuffer = await explainer.textToSpeech(text);
    res.set("Content-Type", "audio/mpeg");
    return res.send(audioBuffer);
  } catch (error) {
    console.error("Error converting text to speech:", error);
    return res.status(500).json({ error: "Failed to convert text to speech" });
  }
});

router.get("/day-lesson/:dayNum", async (req: Request, res: Response) => {
  try {
    const dayNum = parseInt(req.params.dayNum, 10);
    if (isNaN(dayNum) || dayNum < 1 || dayNum > 50) {
      return res.status(400).json({ error: "Day number must be between 1 and 50" });
    }
    const packageResult = await explainer.getDayLesson(dayNum);
    res.set("Content-Type", "application/json");
    return res.json(packageResult);
  } catch (error) {
    console.error("Error getting day lesson:", error);
    return res.status(500).json({ error: "Failed to get day lesson" });
  }
});

router.get("/course-range/:startDay/:endDay", async (req: Request, res: Response) => {
  try {
    const startDay = parseInt(req.params.startDay, 10);
    const endDay = parseInt(req.params.endDay, 10);
    if (isNaN(startDay) || isNaN(endDay) || startDay < 1 || endDay > 50 || startDay > endDay) {
      return res.status(400).json({ error: "Invalid day range. Must be between 1 and 50, and start <= end" });
    }
    const results = await explainer.getLessonsForRange(startDay, endDay);
    res.set("Content-Type", "application/json");
    return res.json(results);
  } catch (error) {
    console.error("Error getting course range:", error);
    return res.status(500).json({ error: "Failed to get course range" });
  }
});

export { router as aiRouter };