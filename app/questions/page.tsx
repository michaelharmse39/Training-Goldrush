"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { getAssessments } from "@/lib/assessments";
import { Assessment } from "@/lib/types";
import { Clock, Target, ClipboardCheck, ChevronRight, BookOpen } from "lucide-react";
import Link from "next/link";

export default function QuestionsPage() {
  const { departmentId } = useAuth();
  const { departments } = useStore();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAssessments().then((all) => {
      const active = all.filter((a) => a.isActive);
      const filtered = departmentId
        ? active.filter((a) => !a.departmentId || a.departmentId === departmentId)
        : active;
      setAssessments(filtered);
      setLoading(false);
    });
  }, [departmentId]);

  const getDeptName = (id: string) =>
    id ? (departments.find((d) => d.id === id)?.name ?? "Unknown") : "All Departments";

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Assessments</h1>
        <p className="text-sm text-gray-500 mt-0.5">Select an assessment below to begin</p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : assessments.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No assessments available yet</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {assessments.map((a) => (
            <div
              key={a.id}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:border-indigo-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-gray-900">{a.title}</h2>
                  {a.description && (
                    <p className="text-sm text-gray-500 mt-1">{a.description}</p>
                  )}
                  <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <ClipboardCheck className="w-3.5 h-3.5" />
                      {a.questions.length} question{a.questions.length !== 1 ? "s" : ""}
                    </span>
                    {a.timeLimit > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {a.timeLimit} min
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Target className="w-3.5 h-3.5" />
                      Pass: {a.passMark}%
                    </span>
                    <span className="text-gray-400">{getDeptName(a.departmentId)}</span>
                  </div>
                </div>
                <Link
                  href={`/assessments/${a.id}/take`}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shrink-0"
                >
                  Start
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
