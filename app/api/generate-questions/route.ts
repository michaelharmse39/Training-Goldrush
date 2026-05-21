import { NextRequest, NextResponse } from "next/server";

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

export async function POST(req: NextRequest) {
  const { content, count = 10 } = await req.json();

  if (!content?.trim()) {
    return NextResponse.json({ error: "No content provided" }, { status: 400 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GROQ_API_KEY is not configured" }, { status: 500 });
  }

  const prompt = `You are an expert training assessment creator. Based on the following document content, generate exactly ${count} assessment questions for employee training.

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
${content.slice(0, 30000)}`;

  try {
    const raw = await callGroq(apiKey, prompt);
    const questions = parseQuestions(raw);
    return NextResponse.json({ questions });
  } catch (err) {
    console.error("Groq error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate questions" },
      { status: 500 }
    );
  }
}
