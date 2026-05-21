"use client";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useStore } from "@/lib/store";

export default function TopicPieChart() {
  const { departments, topics } = useStore();

  const data = departments
    .map((dept) => ({
      name: dept.name.split(" ")[0],
      fullName: dept.name,
      value: topics.filter((t) => t.departmentId === dept.id).length,
      color: dept.color,
    }))
    .filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center justify-center h-48">
        <p className="text-gray-400 text-sm">No topics created yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h3 className="font-semibold text-gray-700 mb-4">Topics by Department</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value">
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(val, _name, props) => [val, props.payload.fullName]}
          />
          <Legend
            formatter={(value, entry: any) => entry.payload.fullName}
            iconType="circle"
            iconSize={10}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
