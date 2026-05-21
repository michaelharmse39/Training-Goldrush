"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { createAssessment } from "@/lib/assessments";
import { Question } from "@/lib/types";
import { ArrowLeft, Plus, Trash2, CheckCircle, Sparkles, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import Link from "next/link";

const BLANK_QUESTION = (): Question => ({
  id: crypto.randomUUID(),
  text: "",
  type: "multiple-choice",
  options: ["", "", "", ""],
  correctAnswer: 0,
  points: 1,
});

export default function CreateAssessmentPage() {
  const router = useRouter();
  const { departments, topics } = useStore();

  const [form, setForm] = useState({
    title: "",
    description: "",
    departmentId: "",
    topicId: "",
    timeLimit: 30,
    passMark: 70,
    manualId: "",
    isActive: true,
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI generation state
  const [showAI, setShowAI] = useState(false);
  const [aiMode, setAiMode] = useState<"file" | "text">("file");
  const [aiFile, setAiFile] = useState<File | null>(null);
  const [aiContent, setAiContent] = useState("");
  const [aiCount, setAiCount] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const addQuestion = () => setQuestions((q) => [...q, BLANK_QUESTION()]);

  const updateQ = (id: string, patch: Partial<Question>) =>
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)));

  const removeQ = (id: string) =>
    setQuestions((qs) => qs.filter((q) => q.id !== id));

  const setOption = (qId: string, idx: number, val: string) =>
    setQuestions((qs) =>
      qs.map((q) =>
        q.id === qId ? { ...q, options: q.options.map((o, i) => (i === idx ? val : o)) } : q
      )
    );

  const handleGenerate = async () => {
    setAiError(null);
    if (aiMode === "file" && !aiFile) { setAiError("Please select a file."); return; }
    if (aiMode === "text" && !aiContent.trim()) { setAiError("Paste some document content first."); return; }
    setGenerating(true);
    try {
      let res: Response;
      if (aiMode === "file" && aiFile) {
        const fd = new FormData();
        fd.append("file", aiFile);
        fd.append("count", String(aiCount));
        res = await fetch("/api/generate-from-file", { method: "POST", body: fd });
      } else {
        res = await fetch("/api/generate-questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: aiContent, count: aiCount }),
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setQuestions((prev) => [...prev, ...data.questions]);
      setAiFile(null);
      setAiContent("");
      setShowAI(false);
    } catch (e: unknown) {
      setAiError(e instanceof Error ? e.message : "Failed to generate questions");
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (questions.length === 0) { setError("Add at least one question."); return; }
    for (const q of questions) {
      if (!q.text.trim()) { setError("All questions must have question text."); return; }
      if (q.type === "multiple-choice" && q.options.filter((o) => o.trim()).length < 2) {
        setError("Multiple-choice questions need at least 2 filled options."); return;
      }
    }
    setSaving(true);
    try {
      const a = await createAssessment({
        ...form,
        questions: questions.map((q) => ({
          ...q,
          options:
            q.type === "true-false"
              ? ["True", "False"]
              : q.options.filter((o) => o.trim()),
        })),
      });
      router.push(`/assessments/${a.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create assessment");
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link
        href="/assessments"
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Assessments
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Assessment</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Basic Info ── */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Basic Information</h2>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Health &amp; Safety Assessment"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Brief description of this assessment"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Department</label>
              <select
                value={form.departmentId}
                onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value, topicId: "" }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Linked Topic</label>
              <select
                value={form.topicId}
                onChange={(e) => setForm((f) => ({ ...f, topicId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Not linked</option>
                {topics
                  .filter((t) => !form.departmentId || t.departmentId === form.departmentId)
                  .map((t) => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Time Limit (minutes)</label>
              <input
                type="number"
                min={0}
                max={180}
                value={form.timeLimit}
                onChange={(e) => setForm((f) => ({ ...f, timeLimit: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-400 mt-1">0 = no time limit</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Pass Mark (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={form.passMark}
                onChange={(e) => setForm((f) => ({ ...f, passMark: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="accent-indigo-600"
            />
            <span className="text-sm text-gray-700">Active — visible to staff</span>
          </label>
        </div>

        {/* ── Questions ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">
              Questions <span className="text-gray-400 font-normal">({questions.length})</span>
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { setShowAI((v) => !v); setAiError(null); }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-violet-50 text-violet-700 rounded-lg hover:bg-violet-100 transition-colors border border-violet-200"
              >
                <Sparkles className="w-4 h-4" />
                Generate with AI
                {showAI ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={addQuestion}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Question
              </button>
            </div>
          </div>

          {/* AI panel */}
          {showAI && (
            <div className="bg-violet-50 border border-violet-200 rounded-xl p-5 space-y-4">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-violet-800">Generate Questions with Gemini AI</p>
                  <p className="text-xs text-violet-600 mt-0.5">Upload a document or paste its content — Gemini will create the questions automatically.</p>
                </div>
              </div>

              {/* Tab switcher */}
              <div className="flex gap-1 bg-violet-100 rounded-lg p-1 w-fit">
                {(["file", "text"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { setAiMode(m); setAiError(null); }}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      aiMode === m
                        ? "bg-white text-violet-700 shadow-sm"
                        : "text-violet-600 hover:text-violet-800"
                    }`}
                  >
                    {m === "file" ? "Upload Document" : "Paste Text"}
                  </button>
                ))}
              </div>

              {aiMode === "file" ? (
                <div>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => { setAiFile(e.target.files?.[0] ?? null); setAiError(null); }}
                    className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-violet-100 file:text-violet-700 hover:file:bg-violet-200"
                  />
                  {aiFile && (
                    <p className="text-xs text-violet-600 mt-1">{aiFile.name} — {(aiFile.size / 1048576).toFixed(1)} MB</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">PDF or Word (.docx) — max 20 MB</p>
                </div>
              ) : (
                <textarea
                  value={aiContent}
                  onChange={(e) => setAiContent(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-violet-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                  placeholder="Open your training manual, select all, copy, then paste here…"
                />
              )}

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-violet-700">Questions to generate:</label>
                  <select
                    value={aiCount}
                    onChange={(e) => setAiCount(Number(e.target.value))}
                    className="px-2 py-1 border border-violet-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    {[5, 10, 15, 20].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={generating}
                  className="flex items-center gap-2 px-4 py-1.5 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating…
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate
                    </>
                  )}
                </button>
              </div>

              {aiError && (
                <p className="text-red-600 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">{aiError}</p>
              )}
            </div>
          )}

          {questions.length === 0 && (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-sm">
              No questions yet — generate with AI or click &quot;Add Question&quot;.
            </div>
          )}

          {questions.map((q, qi) => (
            <div key={q.id} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <span className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold mt-0.5">
                  {qi + 1}
                </span>
                <div className="flex-1 space-y-3">
                  <textarea
                    value={q.text}
                    onChange={(e) => updateQ(q.id, { text: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Question text…"
                  />

                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-gray-600">Type:</span>
                      {(["multiple-choice", "true-false"] as const).map((t) => (
                        <label key={t} className="flex items-center gap-1.5 text-sm cursor-pointer">
                          <input
                            type="radio"
                            name={`type-${q.id}`}
                            checked={q.type === t}
                            onChange={() =>
                              updateQ(q.id, {
                                type: t,
                                options: t === "true-false" ? ["True", "False"] : ["", "", "", ""],
                                correctAnswer: 0,
                              })
                            }
                            className="accent-indigo-600"
                          />
                          {t === "multiple-choice" ? "Multiple Choice" : "True / False"}
                        </label>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                      <span className="text-xs font-medium text-gray-600">Points:</span>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={q.points}
                        onChange={(e) => updateQ(q.id, { points: parseInt(e.target.value) || 1 })}
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-gray-500">
                      {q.type === "multiple-choice"
                        ? "Options — select the correct answer (radio):"
                        : "Select the correct answer:"}
                    </p>
                    {(q.type === "true-false" ? ["True", "False"] : q.options).map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${q.id}`}
                          checked={q.correctAnswer === oi}
                          onChange={() => updateQ(q.id, { correctAnswer: oi })}
                          className="accent-indigo-600 shrink-0"
                        />
                        {q.type === "multiple-choice" ? (
                          <input
                            value={opt}
                            onChange={(e) => setOption(q.id, oi, e.target.value)}
                            placeholder={`Option ${oi + 1}${oi < 2 ? " *" : ""}`}
                            className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        ) : (
                          <span className="text-sm text-gray-700">{opt}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeQ(q.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>
        )}

        <div className="flex gap-3 justify-end pb-6">
          <Link href="/assessments" className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Creating…" : (
              <>
                <CheckCircle className="w-4 h-4" />
                Create Assessment
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
