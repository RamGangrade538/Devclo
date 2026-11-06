import OpenAI from "openai";
import fs from "fs";
import path from "path";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const DEVOPS_COURSE_DIR = path.resolve(process.env.DEVOPS_COURSE_DIR || "../../../../devops");

interface DayContent {
  day: number;
  title: string;
  topic: string;
  concept: string;
  lab: string;
  quickNotes: string;
}

function extractDayNumber(filePath: string): number {
  const match = filePath.match(/\/day-(\d+)-/);
  return match ? parseInt(match[1], 10) : 0;
}

function parseDayFile(filePath: string): DayContent {
  const content = fs.readFileSync(filePath, "utf-8");
  const dayNum = extractDayNumber(filePath);

  const overviewMatch = content.match(/## Overview \|\| Parichay\n([\s\S]*?)\n---/);
  const overview = overviewMatch ? overviewMatch[1].split("\n##")[0].trim() : "";

  const learnMatch = content.match(/## What You'll Learn \|\| Aaj Ki Seekh\n([\s\S]*?)\n---\n/);
  const learn = learnMatch ? learnMatch[1].trim() : "";

  const labMatch = content.match(/## Practice Exercise \|\| Abhi Karein\n([\s\S]*?)\n##/);
  const lab = labMatch ? labMatch[1].trim() : "";

  const notesMatch = content.match(/## Quick Notes \|\| Yaad Rakho\n(`[\s\S]*?`)\n\*\*/);
  const quickNotes = notesMatch ? notesMatch[1].replace(/```/g, "").trim() : "";

  const titleMatch = content.match(/^# Day \d+: (.+)$/m);
  const title = titleMatch ? titleMatch[1] : `Day ${dayNum}`;

  return {
    day: dayNum,
    title,
    topic: overview || learn.split("\n")[0] || "DevOps topic",
    concept: overview || "",
    lab,
    quickNotes,
  };
}

export interface LessonExplanation {
  topic: string;
  level: "beginner" | "intermediate" | "advanced";
  explanation: string;
  key_points: string[];
  example: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface TaskAssignment {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  expectedOutcome: string;
}

export interface DayLessonPackage {
  day: number;
  title: string;
  explanation: LessonExplanation;
  quiz: QuizQuestion[];
  task: TaskAssignment;
  audioBuffer: Buffer;
}

export class AIExplainer {
  async explainLesson(topic: string, level: "beginner" | "intermediate" | "advanced" = "beginner"): Promise<LessonExplanation> {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a DevOps course instructor. Explain the topic (“${topic}”) at ${level} level. Provide a clear explanation, key points, and a practical example. Respond with valid JSON only having these fields: topic, level, explanation, key_points (array), example. No surrounding text.`,
        },
        { role: "user", content: `Explain this topic for a DevOps course: ${topic}` },
      ],
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content || "{}";
    return JSON.parse(content);
  }

  async generateQuiz(topic: string, count: number = 5): Promise<QuizQuestion[]> {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a DevOps course instructor. Generate ${count} quiz questions about “${topic}”. Respond with a valid JSON array. Each item must have: id, question, options (array of 4 strings), correctAnswer, explanation. No surrounding text.`,
        },
        { role: "user", content: `Generate ${count} quiz questions about: ${topic}` },
      ],
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content || "[]";
    return JSON.parse(content);
  }

  async assignTask(topic: string): Promise<TaskAssignment> {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a DevOps course instructor. Create a practical hands-on task about “${topic}”. Respond with valid JSON only having these fields: id, title, description, requirements (array), expectedOutcome. No surrounding text.`,
        },
        { role: "user", content: `Create a hands-on task about: ${topic}` },
      ],
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content || "{}";
    return JSON.parse(content);
  }

  async textToSpeech(text: string): Promise<Buffer> {
    const response = await openai.audio.speech.create({
      model: "tts-1",
      voice: "nova",
      input: text,
    });

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async getDayLesson(dayNum: number): Promise<DayLessonPackage> {
    const dayFile = path.join(DEVOPS_COURSE_DIR, `day-${dayNum}-devops-culture-and-principles.md`);

    let dayContent: DayContent;
    try {
      dayContent = parseDayFile(dayFile);
    } catch {
      dayContent = {
        day: dayNum,
        title: `Day ${dayNum}`,
        topic: `DevOps Day ${dayNum}`,
        concept: "",
        lab: "",
        quickNotes: "",
      };
    }

    const topic = dayContent.topic || `DevOps Day ${dayNum}`;
    const level = dayNum <= 10 ? "beginner" : dayNum <= 30 ? "intermediate" : "advanced";

    const [explanation, quiz, task] = await Promise.all([
      this.explainLesson(topic, level),
      this.generateQuiz(topic, 5),
      this.assignTask(topic),
    ]);

    const audioText = `Day ${dayNum}: ${explanation.topic}. ${explanation.explanation}. Key points: ${explanation.key_points.join(", ")}. ${explanation.example}`;

    const audioBuffer = await this.textToSpeech(audioText);

    return {
      day: dayNum,
      title: dayContent.title,
      explanation,
      quiz,
      task,
      audioBuffer,
    };
  }

  async getLessonsForRange(startDay: number, endDay: number): Promise<DayLessonPackage[]> {
    const results: DayLessonPackage[] = [];
    for (let day = startDay; day <= endDay; day++) {
      results.push(await this.getDayLesson(day));
    }
    return results;
  }
}