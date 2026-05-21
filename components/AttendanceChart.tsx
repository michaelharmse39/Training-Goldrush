"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useStore } from "@/lib/store";

export default function AttendanceChart() {
  const { departments, attendees } = useStore();

  const data = departments.map((dept) => ({
    name: dept.name.split(" ")[0],
    fullName: dept.name,
    attended: attendees.filter((a) => a.departmentId === dept.id).length,
    total: dept.staffCount,
    color: dept.color,
  }));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h3 className="font-semibold text-gray-700 mb-4">Staff Attendance by Department</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div className="bg-white border border-gray-200 rounded-lg shadow p-3 text-sm">
                  <p className="font-semibold text-gray-700 mb-1">{d.fullName}</p>
                  <p className="text-indigo-600">Attended: {d.attended}</p>
                  <p className="text-gray-500">Total staff: {d.total}</p>
                  <p className="text-gray-400">
                    {d.total > 0 ? Math.round((d.attended / d.total) * 100) : 0}% completion
                  </p>
                </div>
              );
            }}
          />
          <Bar dataKey="attended" radius={[6, 6, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
