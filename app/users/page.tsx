"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { UserPlus, Trash2, Shield, Eye, Building2, CheckCircle, XCircle, Clock, Save } from "lucide-react";

type AppRole = "admin" | "dept_head" | "staff";

interface AppUser {
  uid: string;
  email: string;
  role: AppRole;
  departmentId: string;
  approved: boolean;
  selfRegistered: boolean;
  totpEnabled: boolean;
  createdAt: string;
}

interface PendingEdit {
  role: AppRole;
  departmentId: string;
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const { departments } = useStore();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<{ email: string; role: AppRole; departmentId: string }>({
    email: "", role: "staff", departmentId: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Track unsaved permission edits per user
  const [pendingEdits, setPendingEdits] = useState<Record<string, PendingEdit>>({});
  const [savingUid, setSavingUid] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers((prev) => [...prev, data]);
      setForm({ email: "", role: "staff", departmentId: "" });
      setShowForm(false);
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Failed to add user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (uid: string) => {
    if (!confirm("Remove this user? They will no longer be able to sign in.")) return;
    try {
      const res = await fetch(`/api/users/${uid}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      setUsers((prev) => prev.filter((u) => u.uid !== uid));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to delete user");
    }
  };

  const getEdit = (u: AppUser): PendingEdit =>
    pendingEdits[u.uid] ?? { role: u.role, departmentId: u.departmentId };

  const setEdit = (uid: string, patch: Partial<PendingEdit>) =>
    setPendingEdits((prev) => ({
      ...prev,
      [uid]: { ...(prev[uid] ?? users.find((u) => u.uid === uid)!), ...patch },
    }));

  const isDirty = (u: AppUser) => {
    const edit = pendingEdits[u.uid];
    return edit && (edit.role !== u.role || edit.departmentId !== u.departmentId);
  };

  const handleSave = async (u: AppUser) => {
    const edit = pendingEdits[u.uid];
    if (!edit) return;
    setSavingUid(u.uid);
    try {
      const res = await fetch(`/api/users/${u.uid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: edit.role, departmentId: edit.departmentId }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setUsers((prev) => prev.map((x) => x.uid === u.uid ? { ...x, ...edit } : x));
      setPendingEdits((prev) => { const n = { ...prev }; delete n[u.uid]; return n; });
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSavingUid(null);
    }
  };

  const handleApprove = async (uid: string, approved: boolean) => {
    try {
      const res = await fetch(`/api/users/${uid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setUsers((prev) => prev.map((u) => u.uid === uid ? { ...u, approved } : u));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to update");
    }
  };

  const handleResetTotp = async (uid: string) => {
    if (!confirm("Reset this user's authenticator? They will need to set it up again on next login.")) return;
    try {
      const res = await fetch(`/api/users/${uid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totpEnabled: false, totpSecret: "" }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setUsers((prev) => prev.map((u) => u.uid === uid ? { ...u, totpEnabled: false } : u));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to reset TOTP");
    }
  };

  const roleIcon = (role: AppRole) => {
    if (role === "admin") return <Shield className="inline ml-2 w-3.5 h-3.5 text-indigo-500" />;
    if (role === "dept_head") return <Building2 className="inline ml-2 w-3.5 h-3.5 text-amber-500" />;
    return <Eye className="inline ml-2 w-3.5 h-3.5 text-gray-400" />;
  };

  const needsDept = (role: AppRole) => role === "dept_head" || role === "staff";

  const pendingUsers = users.filter((u) => !u.approved);
  const approvedUsers = users.filter((u) => u.approved);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage who can access the Training Register</p>
        </div>
        <button
          onClick={() => { setShowForm((v) => !v); setFormError(null); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Add user
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white border border-gray-200 rounded-xl p-5 mb-6 space-y-4">
          <h2 className="font-semibold text-gray-800">New user</h2>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-400 mt-1">A password setup link will be emailed to this address.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as AppRole, departmentId: "" }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="admin">Admin — full access</option>
                <option value="dept_head">Department Head</option>
                <option value="staff">Staff — assessments &amp; manuals</option>
              </select>
            </div>
            {needsDept(form.role) && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Department</label>
                <select
                  value={form.departmentId}
                  onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">— select —</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          {formError && (
            <p className="text-red-600 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</p>
          )}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? "Adding…" : "Add user"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Loading users…</p>
      ) : error ? (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>
      ) : (
        <>
          {/* ── Pending approvals ── */}
          {pendingUsers.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-semibold text-gray-800">Pending Approval</h2>
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                  {pendingUsers.length}
                </span>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-amber-200 bg-amber-100/50">
                      <th className="text-left px-4 py-3 font-medium text-amber-800">Email</th>
                      <th className="text-left px-4 py-3 font-medium text-amber-800">Registered</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {pendingUsers.map((u) => (
                      <tr key={u.uid} className="border-b border-amber-100 last:border-0">
                        <td className="px-4 py-3 text-gray-900">{u.email}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-ZA") : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => handleApprove(u.uid, true)}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => handleDelete(u.uid)}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Active users ── */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Department</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">2FA</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {approvedUsers.map((u) => {
                  const edit = getEdit(u);
                  const dirty = isDirty(u);
                  const saving = savingUid === u.uid;
                  return (
                    <tr key={u.uid} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900">
                        {u.email}
                        {u.uid === currentUser?.uid && (
                          <span className="ml-2 text-xs text-gray-400">(you)</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={edit.role}
                          onChange={(e) => setEdit(u.uid, { role: e.target.value as AppRole })}
                          className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="admin">Admin</option>
                          <option value="dept_head">Dept Head</option>
                          <option value="staff">Staff</option>
                        </select>
                        {roleIcon(edit.role)}
                      </td>
                      <td className="px-4 py-3">
                        {needsDept(edit.role) ? (
                          <select
                            value={edit.departmentId}
                            onChange={(e) => setEdit(u.uid, { departmentId: e.target.value })}
                            className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="">— none —</option>
                            {departments.map((d) => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {u.selfRegistered ? (
                          u.totpEnabled ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-green-600 flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" /> Enabled
                              </span>
                              <button
                                onClick={() => handleResetTotp(u.uid)}
                                className="text-xs text-gray-400 hover:text-red-500 ml-1 transition-colors"
                                title="Force re-scan of QR code on next login"
                              >
                                Reset QR Code
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-amber-600 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> Not set up
                            </span>
                          )
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          {dirty && (
                            <button
                              onClick={() => handleSave(u)}
                              disabled={saving}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium"
                            >
                              <Save className="w-3.5 h-3.5" />
                              {saving ? "Saving…" : "Save"}
                            </button>
                          )}
                          {u.uid !== currentUser?.uid && (
                            <button
                              onClick={() => handleDelete(u.uid)}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
