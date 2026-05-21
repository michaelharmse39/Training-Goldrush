"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { getManuals, uploadManual, deleteManual } from "@/lib/manuals";
import { Manual } from "@/lib/types";
import { Upload, FileText, Trash2, ExternalLink, BookOpen } from "lucide-react";

export default function ManualsPage() {
  const { role } = useAuth();
  const { departments, topics } = useStore();
  const [manuals, setManuals] = useState<Manual[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", departmentId: "", topicId: "" });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    getManuals().then((m) => {
      setManuals(m);
      setLoading(false);
    });
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const m = await uploadManual(file, form);
      setManuals((prev) => [m, ...prev]);
      setForm({ title: "", departmentId: "", topicId: "" });
      setFile(null);
      setShowForm(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (m: Manual) => {
    if (!confirm(`Delete "${m.title}"? This cannot be undone.`)) return;
    await deleteManual(m.id, m.publicId);
    setManuals((prev) => prev.filter((x) => x.id !== m.id));
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const getDeptName = (id: string) =>
    id ? (departments.find((d) => d.id === id)?.name ?? "Unknown") : "All Departments";

  const getTopicName = (id: string) =>
    id ? (topics.find((t) => t.id === id)?.title ?? "") : "";

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Training Manuals</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {role === "admin" ? "Upload and manage training materials" : "Browse available training materials"}
          </p>
        </div>
        {role === "admin" && (
          <button
            onClick={() => { setShowForm((v) => !v); setError(null); }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload Manual
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleUpload} className="bg-white border border-gray-200 rounded-xl p-5 mb-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Upload Training Manual</h2>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Health &amp; Safety Manual 2025"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Department</label>
              <select
                value={form.departmentId}
                onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value, topicId: "" }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Linked Topic</label>
              <select
                value={form.topicId}
                onChange={(e) => setForm((f) => ({ ...f, topicId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Not linked</option>
                {topics
                  .filter((t) => !form.departmentId || t.departmentId === form.departmentId)
                  .map((t) => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">File *</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.pptx,.xlsx"
              required
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            <p className="text-xs text-gray-400 mt-1">PDF, Word, PowerPoint, or Excel — max 100 MB</p>
          </div>

          {error && (
            <p className="text-red-600 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {uploading ? "Uploading…" : "Upload"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Loading manuals…</p>
      ) : manuals.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No manuals uploaded yet</p>
          {role === "admin" && (
            <p className="text-sm mt-1">Upload your first training manual above</p>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {manuals.map((m) => (
            <div
              key={m.id}
              className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 hover:border-indigo-300 transition-colors"
            >
              <div className="w-10 h-10 flex items-center justify-center bg-red-50 rounded-lg shrink-0">
                <FileText className="w-5 h-5 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{m.title}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-0.5">
                  {m.fileName && <span>{m.fileName}</span>}
                  {m.fileSize > 0 && <span>{formatSize(m.fileSize)}</span>}
                  <span className="text-gray-400">{getDeptName(m.departmentId)}</span>
                  {m.topicId && <span className="text-gray-400">{getTopicName(m.topicId)}</span>}
                  <span>{new Date(m.uploadedAt).toLocaleDateString("en-ZA")}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={m.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open
                </a>
                {role === "admin" && (
                  <button
                    onClick={() => handleDelete(m)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
