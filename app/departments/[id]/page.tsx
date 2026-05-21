"use client";
import { useState, use } from "react";
import { useStore } from "@/lib/store";
import { Topic } from "@/lib/types";
import { Plus, Pencil, Trash2, ChevronRight, ArrowLeft, Calendar, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const EMPTY_TOPIC: Omit<Topic, "id" | "createdAt" | "departmentId"> = {
  title: "",
  subject: "",
  description: "",
  date: new Date().toISOString().split("T")[0],
  weekEnding: "",
  time: "",
  duration: "",
  location: "",
  lessonPlanRef: "",
  trainer: "",
  trainerSignature: "",
};

function TopicModal({
  departmentId,
  initial,
  onSave,
  onClose,
}: {
  departmentId: string;
  initial?: Topic;
  onSave: (t: Omit<Topic, "id" | "createdAt">) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState(
    initial
      ? (({ id, createdAt, departmentId: _d, ...rest }) => rest)(initial)
      : { ...EMPTY_TOPIC }
  );

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave({ ...form, title: form.title.trim(), departmentId });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 my-4">
        <h2 className="text-lg font-bold text-gray-800 mb-5">
          {initial ? "Edit Topic" : "Create Training Topic"}
        </h2>
        <form onSubmit={submit} className="space-y-4">

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Topic Title *</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={form.title}
                onChange={set("title")}
                placeholder="e.g. Fire Safety Awareness"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Subject</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={form.subject}
                onChange={set("subject")}
                placeholder="e.g. Health & Safety"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Description</label>
            <textarea
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              value={form.description}
              onChange={set("description")}
              placeholder="Brief description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Training Date</label>
              <input
                type="date"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={form.date}
                onChange={set("date")}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Week-ending</label>
              <input
                type="date"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={form.weekEnding}
                onChange={set("weekEnding")}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Time</label>
              <input
                type="time"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={form.time}
                onChange={set("time")}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Duration of Training Session</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={form.duration}
                onChange={set("duration")}
                placeholder="e.g. 2 hours"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Location / Branch / Province</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={form.location}
                onChange={set("location")}
                placeholder="e.g. Head Office, Johannesburg"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Lesson Plan Ref</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={form.lessonPlanRef}
                onChange={set("lessonPlanRef")}
                placeholder="e.g. LP-2026-001"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Facilitator&apos;s Name</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={form.trainer}
                onChange={set("trainer")}
                placeholder="e.g. Modiegi Mphahlele"
              />
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

export default function DepartmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { departments, topics, attendees, addTopic, updateTopic, deleteTopic } = useStore();
  const [modal, setModal] = useState<"add" | Topic | null>(null);

  const dept = departments.find((d) => d.id === id);
  if (!dept) {
    return (
      <div className="p-8 text-center text-gray-400">
        Department not found.{" "}
        <Link href="/departments" className="text-indigo-600 hover:underline">
          Go back
        </Link>
      </div>
    );
  }

  const deptTopics = topics.filter((t) => t.departmentId === id);

  return (
    <div className="p-8">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full" style={{ background: dept.color }} />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{dept.name}</h1>
            <p className="text-gray-500 text-sm mt-0.5">{dept.staffCount} staff members</p>
          </div>
        </div>
        <button
          onClick={() => setModal("add")}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Topic
        </button>
      </div>

      {deptTopics.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <p className="text-gray-400 mb-3">No training topics yet</p>
          <button
            onClick={() => setModal("add")}
            className="text-indigo-600 text-sm hover:underline"
          >
            Create the first topic
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {deptTopics.map((topic) => {
            const count = attendees.filter((a) => a.topicId === topic.id).length;
            const pct =
              dept.staffCount > 0 ? Math.round((count / dept.staffCount) * 100) : 0;

            return (
              <div
                key={topic.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-800 leading-tight">{topic.title}</h3>
                    {topic.subject && (
                      <p className="text-xs text-gray-400 mt-0.5">{topic.subject}</p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0 ml-2">
                    <button
                      onClick={() => setModal(topic)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${topic.title}"?`)) deleteTopic(topic.id);
                      }}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {topic.description && (
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">{topic.description}</p>
                )}

                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400 mb-3">
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
                  {topic.location && (
                    <span className="truncate max-w-[140px]">{topic.location}</span>
                  )}
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>{count} attended</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{ width: `${Math.min(pct, 100)}%`, background: dept.color }}
                    />
                  </div>
                </div>

                <Link
                  href={`/register/${topic.id}`}
                  className="flex items-center justify-center gap-1 w-full py-2 rounded-lg bg-indigo-50 text-indigo-600 text-sm font-medium hover:bg-indigo-100 transition-colors"
                >
                  Open Register
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {modal === "add" && (
        <TopicModal
          departmentId={id}
          onSave={addTopic}
          onClose={() => setModal(null)}
        />
      )}
      {modal && modal !== "add" && (
        <TopicModal
          departmentId={id}
          initial={modal as Topic}
          onSave={(t) => updateTopic({ ...(modal as Topic), ...t })}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
