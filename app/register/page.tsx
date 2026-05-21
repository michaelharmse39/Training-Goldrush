"use client";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { ChevronRight, Calendar, User } from "lucide-react";
import Link from "next/link";

export default function RegisterIndexPage() {
  const { topics, departments, attendees } = useStore();
  const { role, departmentId: userDeptId } = useAuth();

  const filtered = role === "dept_head" && userDeptId
    ? topics.filter((t) => t.departmentId === userDeptId)
    : topics;

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Training Register</h1>
        <p className="text-gray-500 text-sm mt-1">Select a topic to open its sign-in register</p>
      </div>

      {sorted.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <p className="text-gray-400 mb-2">No training topics yet</p>
          <Link href="/departments" className="text-indigo-600 text-sm hover:underline">
            Create topics in Departments
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sorted.map((topic) => {
            const dept = departments.find((d) => d.id === topic.departmentId);
            const count = attendees.filter((a) => a.topicId === topic.id).length;
            return (
              <Link
                key={topic.id}
                href={`/register/${topic.id}`}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: dept?.color ?? "#6366f1" }}
                  />
                  <span className="text-xs text-gray-400">{dept?.name}</span>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2 group-hover:text-indigo-600 transition-colors">
                  {topic.title}
                </h3>
                <div className="flex gap-3 text-xs text-gray-400 mb-3">
                  {topic.date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(topic.date).toLocaleDateString()}
                    </span>
                  )}
                  {topic.trainer && (
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {topic.trainer}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    <span className="font-semibold text-gray-700">{count}</span> signed in
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
