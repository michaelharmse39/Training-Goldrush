"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { Department } from "@/lib/types";
import { Plus, Pencil, Trash2, Users, BookOpen, ChevronRight } from "lucide-react";
import Link from "next/link";

const COLORS = [
  "#6366f1", "#f59e0b", "#10b981", "#3b82f6", "#ec4899",
  "#8b5cf6", "#f97316", "#14b8a6", "#ef4444", "#84cc16",
];

function DeptModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: Department;
  onSave: (d: Omit<Department, "id">) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [color, setColor] = useState(initial?.color ?? COLORS[0]);
  const [staffCount, setStaffCount] = useState(initial?.staffCount ?? 0);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), color, staffCount: Number(staffCount) });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          {initial ? "Edit Department" : "Add Department"}
        </h2>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Name</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Finance"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Total Staff</label>
            <input
              type="number"
              min={0}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={staffCount}
              onChange={(e) => setStaffCount(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Colour</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    color === c ? "border-gray-800 scale-110" : "border-transparent"
                  }`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DepartmentsPage() {
  const { departments, topics, attendees, addDepartment, updateDepartment, deleteDepartment } =
    useStore();
  const [modal, setModal] = useState<"add" | Department | null>(null);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Departments</h1>
          <p className="text-gray-500 text-sm mt-1">Manage departments and view their topics</p>
        </div>
        <button
          onClick={() => setModal("add")}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Department
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {departments.map((dept) => {
          const deptTopics = topics.filter((t) => t.departmentId === dept.id);
          const deptAttendees = attendees.filter((a) => a.departmentId === dept.id);
          const pct =
            dept.staffCount > 0
              ? Math.round((new Set(deptAttendees.map((a) => a.employeeId)).size / dept.staffCount) * 100)
              : 0;

          return (
            <div
              key={dept.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="h-2" style={{ background: dept.color }} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-800">{dept.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{dept.staffCount} staff members</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setModal(dept)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${dept.name}"?`)) deleteDepartment(dept.id);
                      }}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-4 text-sm mb-4">
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{deptTopics.length} topics</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <Users className="w-3.5 h-3.5" />
                    <span>{deptAttendees.length} sign-ins</span>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Attendance</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{ width: `${pct}%`, background: dept.color }}
                    />
                  </div>
                </div>

                <Link
                  href={`/departments/${dept.id}`}
                  className="flex items-center justify-center gap-1 w-full py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  View Topics
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {modal === "add" && (
        <DeptModal
          onSave={addDepartment}
          onClose={() => setModal(null)}
        />
      )}
      {modal && modal !== "add" && (
        <DeptModal
          initial={modal as Department}
          onSave={(d) => updateDepartment({ ...(modal as Department), ...d })}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
