"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { Trash2, Search } from "lucide-react";

export default function AttendeesPage() {
  const { attendees, topics, departments, deleteAttendee } = useStore();
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");

  const filtered = attendees
    .filter((a) => {
      const topic = topics.find((t) => t.id === a.topicId);
      const matchSearch =
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.employeeId.toLowerCase().includes(search.toLowerCase()) ||
        (a.jobTitle ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (topic?.title ?? "").toLowerCase().includes(search.toLowerCase());
      const matchDept = !filterDept || a.departmentId === filterDept;
      return matchSearch && matchDept;
    })
    .sort((a, b) => new Date(b.signedAt).getTime() - new Date(a.signedAt).getTime());

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Attendees</h1>
        <p className="text-gray-500 text-sm mt-1">
          All training sign-ins · {attendees.length} total
        </p>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Search name, ID, topic..."
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
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <p className="text-gray-400">No attendees found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">#</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Emp No.</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Name & Surname</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Job Title</th>
                  <th className="text-center px-2 py-3 text-xs font-medium text-gray-400">M</th>
                  <th className="text-center px-2 py-3 text-xs font-medium text-gray-400">F</th>
                  <th className="text-center px-2 py-3 text-xs font-medium text-gray-400">Equity</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Passport/ID</th>
                  <th className="text-center px-2 py-3 text-xs font-medium text-gray-400">Age</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Topic</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Department</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Signature</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Date</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((a, i) => {
                  const topic = topics.find((t) => t.id === a.topicId);
                  const dept = departments.find((d) => d.id === a.departmentId);
                  return (
                    <tr
                      key={a.id}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-2.5 text-gray-400">{i + 1}</td>
                      <td className="px-4 py-2.5 text-gray-600">{a.employeeId}</td>
                      <td className="px-4 py-2.5 font-medium text-gray-800">{a.name}</td>
                      <td className="px-4 py-2.5 text-gray-600">{a.jobTitle || "—"}</td>
                      <td className="px-2 py-2.5 text-center">{a.gender === "M" ? "✓" : ""}</td>
                      <td className="px-2 py-2.5 text-center">{a.gender === "F" ? "✓" : ""}</td>
                      <td className="px-2 py-2.5 text-center">
                        {a.equity ? (
                          <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">
                            {a.equity}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-gray-600">{a.passportId || "—"}</td>
                      <td className="px-2 py-2.5 text-center text-gray-500">{a.ageGroup || "—"}</td>
                      <td className="px-4 py-2.5 text-gray-700">{topic?.title ?? "—"}</td>
                      <td className="px-4 py-2.5">
                        {dept ? (
                          <span
                            className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full text-white"
                            style={{ background: dept.color }}
                          >
                            {dept.name}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        {a.signature ? (
                          <img src={a.signature} alt="sig" className="h-7 w-20 object-contain border border-gray-100 rounded" />
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-gray-400 whitespace-nowrap">
                        {new Date(a.signedAt).toLocaleDateString("en-ZA", {
                          day: "2-digit", month: "short", year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-2.5">
                        <button
                          onClick={() => { if (confirm("Remove this attendee?")) deleteAttendee(a.id); }}
                          className="text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
