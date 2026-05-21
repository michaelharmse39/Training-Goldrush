"use client";
import { useStore } from "@/lib/store";
import StatCard from "@/components/StatCard";
import AttendanceChart from "@/components/AttendanceChart";
import TopicPieChart from "@/components/TopicPieChart";
import { Building2, BookOpen, Users, TrendingUp, ClipboardList } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { departments, topics, attendees } = useStore();

  const totalStaff = departments.reduce((s, d) => s + d.staffCount, 0);
  const uniqueAttendees = new Set(attendees.map((a) => a.employeeId)).size;
  const completionRate =
    totalStaff > 0 ? Math.round((uniqueAttendees / totalStaff) * 100) : 0;

  const recentAttendees = [...attendees]
    .sort((a, b) => new Date(b.signedAt).getTime() - new Date(a.signedAt).getTime())
    .slice(0, 8);

  const topTopics = topics
    .map((t) => ({
      ...t,
      count: attendees.filter((a) => a.topicId === t.id).length,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Overview of all training activity</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Departments"
          value={departments.length}
          icon={Building2}
          color="bg-indigo-500"
        />
        <StatCard
          label="Training Topics"
          value={topics.length}
          icon={BookOpen}
          color="bg-amber-500"
        />
        <StatCard
          label="Total Sign-Ins"
          value={attendees.length}
          icon={ClipboardList}
          color="bg-emerald-500"
        />
        <StatCard
          label="Completion Rate"
          value={`${completionRate}%`}
          icon={TrendingUp}
          color="bg-pink-500"
          sub={`${uniqueAttendees} of ${totalStaff} staff`}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2">
          <AttendanceChart />
        </div>
        <div>
          <TopicPieChart />
        </div>
      </div>

      {/* Bottom panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent sign-ins */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">Recent Sign-Ins</h3>
            <Link href="/attendees" className="text-xs text-indigo-600 hover:underline">
              View all
            </Link>
          </div>
          {recentAttendees.length === 0 ? (
            <p className="text-gray-400 text-sm py-4 text-center">No sign-ins yet</p>
          ) : (
            <ul className="space-y-2">
              {recentAttendees.map((a) => {
                const topic = topics.find((t) => t.id === a.topicId);
                const dept = departments.find((d) => d.id === a.departmentId);
                return (
                  <li key={a.id} className="flex items-center gap-3 text-sm">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: dept?.color ?? "#6366f1" }}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-gray-700 truncate block">{a.name}</span>
                      <span className="text-gray-400 text-xs truncate block">
                        {topic?.title ?? "Unknown topic"} · {dept?.name ?? ""}
                      </span>
                    </div>
                    <span className="text-gray-400 text-xs shrink-0">
                      {new Date(a.signedAt).toLocaleDateString()}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Top topics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">Top Training Topics</h3>
            <Link href="/topics" className="text-xs text-indigo-600 hover:underline">
              View all
            </Link>
          </div>
          {topTopics.length === 0 ? (
            <p className="text-gray-400 text-sm py-4 text-center">No topics yet</p>
          ) : (
            <ul className="space-y-3">
              {topTopics.map((t) => {
                const dept = departments.find((d) => d.id === t.departmentId);
                const pct =
                  dept && dept.staffCount > 0
                    ? Math.round((t.count / dept.staffCount) * 100)
                    : 0;
                return (
                  <li key={t.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700 truncate">{t.title}</span>
                      <span className="text-gray-500 shrink-0 ml-2">{t.count} attendees</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{
                          width: `${Math.min(pct, 100)}%`,
                          background: dept?.color ?? "#6366f1",
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
