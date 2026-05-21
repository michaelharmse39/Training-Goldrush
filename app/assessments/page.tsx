"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { getAssessments, deleteAssessment } from "@/lib/assessments";
import { Assessment } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, ClipboardCheck, Clock, Target, Trash2, Eye } from "lucide-react";

export default function AssessmentsPage() {
  const { role, departmentId: userDeptId } = useAuth();
  const { departments } = useStore();
  const router = useRouter();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role && role !== "admin") {
      router.replace("/questions");
      return;
    }
    getAssessments().then((all) => {
      setAssessments(all);
      setLoading(false);
    });
  }, [role, userDeptId, router]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this assessment? Results will be kept but the assessment won't be accessible.")) return;
    await deleteAssessment(id);
    setAssessments((prev) => prev.filter((a) => a.id !== id));
  };

  const getDeptName = (id: string) =>
    id ? (departments.find((d) => d.id === id)?.name ?? "Unknown") : "All Departments";

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assessments</h1>
          <p className="text-sm text-gray-500 mt-0.5">Create and manage training assessments</p>
        </div>
        <Link
          href="/assessments/create"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Assessment
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading assessments…</p>
      ) : assessments.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No assessments yet</p>
          <p className="text-sm mt-1">Create your first assessment to get started</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {assessments.map((a) => (
            <div
              key={a.id}
              className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between hover:border-indigo-300 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="font-semibold text-gray-900 truncate">{a.title}</h2>
                  {!a.isActive && (
                    <span className="shrink-0 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      Inactive
                    </span>
                  )}
                </div>
                {a.description && (
                  <p className="text-sm text-gray-500 mb-2 truncate">{a.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
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

              <div className="flex items-center gap-2 ml-4 shrink-0">
                <Link
                  href={`/assessments/${a.id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Results
                </Link>
                <Link
                  href={`/assessments/${a.id}/edit`}
                  className="px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(a.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
