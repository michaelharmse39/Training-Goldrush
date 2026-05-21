"use client";
import { useEffect, useState, useRef, use } from "react";
import { useAuth } from "@/lib/auth";
import { getAssessmentById, submitResult } from "@/lib/assessments";
import { Assessment, AssessmentResult } from "@/lib/types";
import { Clock, CheckCircle, XCircle, AlertTriangle, BookOpen, CalendarDays } from "lucide-react";
import Link from "next/link";

type Phase = "intro" | "taking" | "done";

export default function TakeAssessmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, departmentId } = useAuth();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [phase, setPhase] = useState<Phase>("intro");
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Refs to avoid stale closures in timer
  const answersRef = useRef<(number | null)[]>([]);
  const startTimeRef = useRef(0);
  const submittingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    getAssessmentById(id).then((a) => {
      setAssessment(a);
      if (a) {
        const blank = new Array(a.questions.length).fill(null);
        setAnswers(blank);
        answersRef.current = blank;
        setTimeLeft(a.timeLimit * 60);
      }
      setLoading(false);
    });
  }, [id]);

  const doSubmit = async (currentAnswers: (number | null)[]) => {
    if (!assessment || !user || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const totalPoints = assessment.questions.reduce((s, q) => s + q.points, 0);
    let earned = 0;
    assessment.questions.forEach((q, i) => {
      if (currentAnswers[i] === q.correctAnswer) earned += q.points;
    });
    const score = totalPoints > 0 ? Math.round((earned / totalPoints) * 100) : 0;
    const passed = score >= assessment.passMark;

    const res = await submitResult({
      assessmentId: assessment.id,
      assessmentTitle: assessment.title,
      userId: user.uid,
      userEmail: user.email ?? "",
      userName: user.displayName ?? "",
      departmentId: departmentId ?? "",
      score,
      passed,
      answers: currentAnswers.map((a) => a ?? -1),
      timeSpent,
      completedAt: new Date().toISOString(),
    });
    setResult(res);
    setPhase("done");
    setSubmitting(false);
  };

  const startAssessment = () => {
    startTimeRef.current = Date.now();
    setPhase("taking");

    if (assessment?.timeLimit && assessment.timeLimit > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current!);
            doSubmit(answersRef.current);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
  };

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const updateAnswer = (i: number, val: number) => {
    const next = [...answersRef.current];
    next[i] = val;
    answersRef.current = next;
    setAnswers([...next]);
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  if (loading) return <div className="p-8 text-center text-gray-500">Loading…</div>;
  if (!assessment) return <div className="p-8 text-center text-gray-400">Assessment not found.</div>;

  const totalPoints = assessment.questions.reduce((s, q) => s + q.points, 0);
  const limitSecs = assessment.timeLimit * 60;
  const timerWarning = assessment.timeLimit > 0 && timeLeft < limitSecs * 0.1;
  const timerYellow = assessment.timeLimit > 0 && timeLeft < limitSecs * 0.3;

  // ── Results screen ─────────────────────────────────────────
  if (phase === "done" && result) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        {/* Score card */}
        <div
          className={`rounded-2xl p-8 text-center mb-6 ${
            result.passed
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          {result.passed ? (
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          ) : (
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          )}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {result.passed ? "Well Done!" : "Assessment Complete"}
          </h1>
          <p className="text-gray-600 mb-4">
            {result.passed
              ? "You have passed this assessment."
              : "You did not reach the pass mark. Review the material below and try again."}
          </p>
          {!result.passed && (
            <div className="flex items-center justify-center gap-2 mb-4 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="text-sm text-amber-700 font-medium">Retraining Required</span>
            </div>
          )}
          <div className="text-5xl font-bold text-gray-900 mb-1">{result.score}%</div>
          <p className="text-sm text-gray-500">Pass mark: {assessment.passMark}%</p>
          <div className="flex justify-center gap-6 mt-4 text-sm text-gray-600">
            <span>Time: {Math.floor(result.timeSpent / 60)}m {result.timeSpent % 60}s</span>
            <span>{assessment.questions.filter((q, i) => result.answers[i] === q.correctAnswer).length} / {assessment.questions.length} correct</span>
          </div>
        </div>

        {/* Question-by-question review */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Answer Review</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {assessment.questions.map((q, i) => {
              const chosen = result.answers[i];
              const isCorrect = chosen === q.correctAnswer;
              return (
                <div key={q.id} className="p-4">
                  <div className="flex items-start gap-3">
                    {isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800 mb-2">{q.text}</p>
                      <div className="space-y-1">
                        {q.options.map((opt, oi) => (
                          <div
                            key={oi}
                            className={`text-sm px-3 py-1.5 rounded-lg ${
                              oi === q.correctAnswer
                                ? "bg-green-100 text-green-800 font-medium"
                                : oi === chosen && !isCorrect
                                ? "bg-red-100 text-red-700 line-through"
                                : "text-gray-600"
                            }`}
                          >
                            {opt}
                            {oi === q.correctAnswer && " ✓ Correct answer"}
                            {oi === chosen && !isCorrect && " ✗ Your answer"}
                          </div>
                        ))}
                        {chosen === -1 && (
                          <p className="text-xs text-gray-400 italic">Not answered</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            href="/my-progress"
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            View My Progress
          </Link>
          {!result.passed && (
            <Link
              href="/training-sessions"
              className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium"
            >
              <CalendarDays className="w-4 h-4" />
              Book Retraining
            </Link>
          )}
          <Link
            href="/questions"
            className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            All Assessments
          </Link>
        </div>
      </div>
    );
  }

  // ── Intro screen ───────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-4">
          <h1 className="text-xl font-bold text-gray-900 mb-2">{assessment.title}</h1>
          {assessment.description && (
            <p className="text-gray-600 mb-4">{assessment.description}</p>
          )}

          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: "Questions", value: assessment.questions.length },
              { label: "Time Limit", value: assessment.timeLimit > 0 ? `${assessment.timeLimit} minutes` : "No limit" },
              { label: "Pass Mark", value: `${assessment.passMark}%` },
              { label: "Total Points", value: totalPoints },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 text-xs mb-0.5">{label}</p>
                <p className="font-semibold text-gray-900">{value}</p>
              </div>
            ))}
          </div>

          {assessment.manualId && (
            <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg flex items-start gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-indigo-700 font-medium">Study material available</p>
                <p className="text-xs text-indigo-600 mt-0.5">
                  A training manual is linked to this assessment. Review it before starting.
                </p>
                <Link href="/manuals" className="text-xs text-indigo-700 font-medium underline mt-1 inline-block">
                  View Manuals →
                </Link>
              </div>
            </div>
          )}

          {assessment.timeLimit > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700">
                You will have <strong>{assessment.timeLimit} minutes</strong> to complete this assessment. The timer starts when you click Start.
              </p>
            </div>
          )}
        </div>

        <button
          onClick={startAssessment}
          className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
        >
          Start Assessment
        </button>
      </div>
    );
  }

  // ── Taking screen ──────────────────────────────────────────
  const unanswered = answers.filter((a) => a === null).length;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Sticky timer */}
      {assessment.timeLimit > 0 && (
        <div
          className={`sticky top-4 z-10 mx-auto w-fit flex items-center gap-2 px-5 py-2 rounded-full mb-6 text-sm font-bold shadow-md transition-colors ${
            timerWarning
              ? "bg-red-500 text-white"
              : timerYellow
              ? "bg-amber-100 text-amber-800 border border-amber-300"
              : "bg-white text-gray-700 border border-gray-200"
          }`}
        >
          <Clock className="w-4 h-4" />
          {formatTime(timeLeft)}
        </div>
      )}

      <h1 className="text-xl font-bold text-gray-900 mb-1">{assessment.title}</h1>
      <p className="text-sm text-gray-500 mb-6">
        {assessment.questions.length} questions · {totalPoints} points total
      </p>

      <div className="space-y-6">
        {assessment.questions.map((q, i) => (
          <div key={q.id} className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-start gap-3 mb-4">
              <span className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold">
                {i + 1}
              </span>
              <p className="text-gray-900 font-medium leading-snug flex-1">{q.text}</p>
              <span className="text-xs text-gray-400 shrink-0">
                {q.points} pt{q.points !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="space-y-2 ml-10">
              {q.options.map((opt, oi) => (
                <label
                  key={oi}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    answers[i] === oi
                      ? "border-indigo-400 bg-indigo-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name={`q-${i}`}
                    checked={answers[i] === oi}
                    onChange={() => updateAnswer(i, oi)}
                    className="accent-indigo-600 shrink-0"
                  />
                  <span className="text-sm text-gray-800">{opt}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pb-8">
        {unanswered > 0 && (
          <p className="text-xs text-amber-600 text-center mb-3">
            {unanswered} question{unanswered !== 1 ? "s" : ""} unanswered
          </p>
        )}
        <button
          onClick={() => doSubmit(answersRef.current)}
          disabled={submitting}
          className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {submitting ? "Submitting…" : "Submit Assessment"}
        </button>
      </div>
    </div>
  );
}
