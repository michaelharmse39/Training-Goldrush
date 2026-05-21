"use client";
import { useEffect, useState, use } from "react";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { getAssessmentById, getResultsForAssessment } from "@/lib/assessments";
import { Assessment, AssessmentResult } from "@/lib/types";
import Link from "next/link";
import { ArrowLeft, CheckCircle, XCircle, Clock, Users, Target, ClipboardCheck, AlertTriangle } from "lucide-react";

export default function AssessmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { role, departmentId: userDeptId } = useAuth();
  const { departments } = useStore();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [a, r] = await Promise.all([
        getAssessmentById(id),
        getResultsForAssessment(id),
      ]);
      setAssessment(a);
      if (role === "dept_head" && userDeptId) {
        setResults(r.filter((res) => res.departmentId === userDeptId));
      } else {
        setResults(r);
      }
      setLoading(false);
    };
    load();
  }, [id, role, userDeptId]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading…</div>;
  if (!assessment) return <div className="p-8 text-center text-gray-400">Assessment not found.</div>;

  const passed = results.filter((r) => r.passed).length;
  const avg = results.length
    ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length)
    : 0;
  const getDeptName = (dId: string) =>
    dId ? (departments.find((d) => d.id === dId)?.name ?? "Unknown") : "All Departments";

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Link
        href="/assessments"
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Assessments
      </Link>

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{assessment.title}</h1>
            {assessment.description && (
              <p className="text-sm text-gray-500 mt-1">{assessment.description}</p>
            )}
          </div>
          {role === "admin" && (
            <Link
              href={`/assessments/${id}/edit`}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Edit
            </Link>
          )}
        </div>
        <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <ClipboardCheck className="w-4 h-4 text-gray-400" />
            {assessment.questions.length} questions
          </span>
          {assessment.timeLimit > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-gray-400" />
              {assessment.timeLimit} min limit
            </span>
          )}
          <span className="flex items-center gap-1">
            <Target className="w-4 h-4 text-gray-400" />
            Pass: {assessment.passMark}%
          </span>
          <span className="text-gray-400">{getDeptName(assessment.departmentId)}</span>
          <span className={assessment.isActive ? "text-green-600 font-medium" : "text-gray-400"}>
            {assessment.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-gray-900">{results.length}</div>
          <div className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
            <Users className="w-3.5 h-3.5" /> Attempts
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-green-600">{passed}</div>
          <div className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> Passed
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-indigo-600">{avg}%</div>
          <div className="text-xs text-gray-500 mt-1">Avg Score</div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Results</h2>
        </div>
        {results.length === 0 ? (
          <p className="p-6 text-sm text-center text-gray-400">No results yet</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Staff Member</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Score</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Result</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Time Spent</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{r.userName || r.userEmail}</p>
                    {r.userName && <p className="text-xs text-gray-400">{r.userEmail}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-100 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${r.passed ? "bg-green-500" : "bg-red-400"}`}
                          style={{ width: `${r.score}%` }}
                        />
                      </div>
                      <span className="font-semibold">{r.score}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {r.passed ? (
                      <span className="flex items-center gap-1 text-green-600 font-medium text-xs">
                        <CheckCircle className="w-3.5 h-3.5" /> PASSED
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-500 font-medium text-xs">
                        <XCircle className="w-3.5 h-3.5" /> FAILED
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {!r.passed && (
                      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium w-fit whitespace-nowrap">
                        <AlertTriangle className="w-3 h-3" /> Needs Retraining
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {Math.floor(r.timeSpent / 60)}m {r.timeSpent % 60}s
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(r.completedAt).toLocaleDateString("en-ZA")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
