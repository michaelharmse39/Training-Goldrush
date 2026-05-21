"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { ChevronRight, Calendar, User, Search } from "lucide-react";
import Link from "next/link";

export default function TopicsPage() {
  const { topics, departments, attendees } = useStore();
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");

  const filtered = topics.filter((t) => {
    const matchSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.trainer.toLowerCase().includes(search.toLowerCase());
    const matchDept = !filterDept || t.departmentId === filterDept;
    return matchSearch && matchDept;
  });

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">All Training Topics</h1>
        <p className="text-gray-500 text-sm mt-1">Browse and open any training register</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Search topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <p className="text-gray-400">No topics found</p>
          <Link href="/departments" className="text-indigo-600 text-sm hover:underline mt-2 block">
            Go to Departments to create topics
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Topic</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Department</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Date</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Trainer</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Attended</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((topic) => {
                const dept = departments.find((d) => d.id === topic.departmentId);
                const count = attendees.filter((a) => a.topicId === topic.id).length;
                return (
                  <tr
                    key={topic.id}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-700">{topic.title}</p>
                      {topic.description && (
                        <p className="text-xs text-gray-400 truncate max-w-xs">{topic.description}</p>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full text-white"
                        style={{ background: dept?.color ?? "#6366f1" }}
                      >
                        {dept?.name ?? "Unknown"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500">
                      {topic.date ? (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(topic.date).toLocaleDateString()}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-500">
                      {topic.trainer ? (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {topic.trainer}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-medium text-gray-700">{count}</span>
                      {dept && (
                        <span className="text-gray-400 text-xs"> / {dept.staffCount}</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/register/${topic.id}`}
                        className="flex items-center gap-0.5 text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                      >
                        Register
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
