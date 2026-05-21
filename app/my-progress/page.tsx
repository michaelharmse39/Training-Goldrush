"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { getMyResults, getDepartmentResults } from "@/lib/assessments";
import { AssessmentResult } from "@/lib/types";
import { CheckCircle, XCircle, Clock, TrendingUp, Award, ClipboardCheck } from "lucide-react";
import Link from "next/link";

export default function MyProgressPage() {
  const { user, role, departmentId } = useAuth();
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      let r: AssessmentResult[] = [];
      if (role === "dept_head" && departmentId) {
        r = await getDepartmentResults(departmentId);
      } else {
        r = await getMyResults(user.uid);
      }
      setResults(r);
      setLoading(false);
    };
    load();
  }, [user, role, departmentId]);

  const passed = results.filter((r) => r.passed).length;
  const passRate = results.length ? Math.round((passed / results.length) * 100) : 0;
  const avgScore = results.length
    ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length)
    : 0;

  const isDeptHead = role === "dept_head";
  const title = isDeptHead ? "Department Progress" : "My Progress";
  const subtitle = isDeptHead
    ? "Assessment results for your department"
    : "Your assessment history and scores";

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5 text-center">
          <div className="text-3xl font-bold text-gray-900">{results.length}</div>
          <div className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
            <ClipboardCheck className="w-3.5 h-3.5" />
            Assessments Taken
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 text-center">
          <div className="text-3xl font-bold text-green-600">{passRate}%</div>
          <div className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
            <Award className="w-3.5 h-3.5" />
            Pass Rate
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 text-center">
          <div className="text-3xl font-bold text-indigo-600">{avgScore}%</div>
          <div className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            Avg Score
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading results…</p>
      ) : results.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">
            {isDeptHead ? "No department results yet" : "No assessments completed yet"}
          </p>
          {!isDeptHead && (
            <Link
              href="/assessments"
              className="text-sm text-indigo-600 hover:underline mt-2 inline-block"
            >
              Browse Assessments →
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {isDeptHead && (
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Staff Member</th>
                )}
                <th className="text-left px-4 py-3 font-medium text-gray-600">Assessment</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Score</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Result</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Time</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  {isDeptHead && (
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{r.userName || r.userEmail}</p>
                      {r.userName && <p className="text-xs text-gray-400">{r.userEmail}</p>}
                    </td>
                  )}
                  <td className="px-4 py-3 font-medium text-gray-900">{r.assessmentTitle}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-100 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${r.passed ? "bg-green-500" : "bg-red-400"}`}
                          style={{ width: `${r.score}%` }}
                        />
                      </div>
                      <span className="font-semibold text-gray-900">{r.score}%</span>
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
        </div>
      )}
    </div>
  );
}
