import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

async function callGroq(apiKey: string, prompt: string): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? "Groq API error");
  return data.choices?.[0]?.message?.content ?? "";
}

function parseQuestions(raw: string) {
  const clean = raw.trim().replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  const start = clean.indexOf("[");
  const end = clean.lastIndexOf("]");
  if (start === -1 || end === -1) throw new Error("AI response did not contain a JSON array");
  const questions = JSON.parse(clean.slice(start, end + 1));
  return questions.map((q: Record<string, unknown>) => ({ ...q, id: crypto.randomUUID() }));
}

const PROMPT = (count: number, text: string) =>
  `You are an expert training assessment creator. Generate exactly ${count} assessment questions from the following document for employee training.

Requirements:
- Mix of multiple-choice (4 options) and true/false questions
- Test understanding, not just memorization
- Exactly one correct answer per question
- 1 point per question

Return ONLY a valid JSON array with no other text or explanation:
[
  {"text":"question","type":"multiple-choice","options":["A","B","C","D"],"correctAnswer":0,"points":1},
  {"text":"question","type":"true-false","options":["True","False"],"correctAnswer":0,"points":1}
]

Document content:
${text.slice(0, 30000)}`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GROQ_API_KEY is not configured" }, { status: 500 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const count = parseInt((formData.get("count") as string) ?? "10") || 10;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  try {
    let text = "";
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const isWord =
      file.type.includes("wordprocessingml") ||
      file.name.toLowerCase().endsWith(".docx") ||
      file.name.toLowerCase().endsWith(".doc");

    if (isPdf) {
      const parsed = await pdfParse(buffer);
      text = parsed.text;
    } else if (isWord) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please use a PDF or Word (.docx) document." },
        { status: 400 }
      );
    }

    if (!text.trim()) {
      return NextResponse.json({ error: "Could not extract text from the document." }, { status: 400 });
    }

    const raw = await callGroq(apiKey, PROMPT(count, text));
    const questions = parseQuestions(raw);
    return NextResponse.json({ questions });
  } catch (err) {
    console.error("generate-from-file error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate questions" },
      { status: 500 }
    );
  }
}
