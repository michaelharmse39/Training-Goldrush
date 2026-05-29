"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { UserPlus, Eye, Users, Clock, CheckCircle, XCircle } from "lucide-react";

interface AppUser {
  uid: string;
  email: string;
  role: "admin" | "dept_head" | "staff";
  departmentId: string;
  approved: boolean;
  selfRegistered: boolean;
  createdAt: string;
}

export default function MyStaffPage() {
  const { user: currentUser, role, departmentId: userDeptId } = useAuth();
  const { departments } = useStore();
  const router = useRouter();

  const [staff, setStaff] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: "" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Redirect non-dept_head
  useEffect(() => {
    if (role && role !== "dept_head") {
      router.replace("/");
    }
  }, [role, router]);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // Only show staff belonging to this department
      const mine = (data as AppUser[]).filter(
        (u) => u.role === "staff" && u.departmentId === userDeptId
      );
      setStaff(mine);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load staff");
    } finally {
      setLoading(false);
    }
  }, [userDeptId]);

  useEffect(() => {
    if (role === "dept_head") fetchStaff();
  }, [role, fetchStaff]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userDeptId) return;
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          role: "staff",
          departmentId: userDeptId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStaff((prev) => [...prev, data]);
      setForm({ email: "" });
      setShowForm(false);
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Failed to add staff member");
    } finally {
      setSubmitting(false);
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
      setStaff((prev) => prev.map((u) => u.uid === uid ? { ...u, approved } : u));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to update");
    }
  };

  const handleDelete = async (uid: string) => {
    if (!confirm("Remove this staff member?")) return;
    try {
      const res = await fetch(`/api/users/${uid}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      setStaff((prev) => prev.filter((u) => u.uid !== uid));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to remove");
    }
  };

  const deptName = departments.find((d) => d.id === userDeptId)?.name ?? "your department";

  if (role && role !== "dept_head") return null;

  const pendingStaff = staff.filter((u) => !u.approved);
  const approvedStaff = staff.filter((u) => u.approved);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Staff</h1>
          <p className="text-sm text-gray-500 mt-0.5">Staff members in {deptName}</p>
        </div>
        <button
          onClick={() => { setShowForm((v) => !v); setFormError(null); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Add Staff
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleAdd}
          className="bg-white border border-gray-200 rounded-xl p-5 mb-6 space-y-4"
        >
          <h2 className="font-semibold text-gray-800">New Staff Member</h2>
          <p className="text-xs text-gray-500">
            The new account will be created as <strong>Staff</strong> in <strong>{deptName}</strong>.
          </p>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Work Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-400 mt-1">A password setup link will be emailed to this address.</p>
          </div>
          {formError && (
            <p className="text-red-600 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {formError}
            </p>
          )}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? "Adding…" : "Add Staff Member"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : error ? (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>
      ) : (
        <>
          {/* ── Pending approvals ── */}
          {pendingStaff.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-semibold text-gray-800">Pending Approval</h2>
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                  {pendingStaff.length}
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
                    {pendingStaff.map((u) => (
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

          {/* ── Active staff ── */}
          {approvedStaff.length === 0 && pendingStaff.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No staff members in {deptName} yet.</p>
              <p className="text-xs mt-1">Click &quot;Add Staff&quot; to create their account.</p>
            </div>
          ) : approvedStaff.length > 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Joined</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {approvedStaff.map((u) => (
                    <tr key={u.uid} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900">
                        {u.email}
                        {u.uid === currentUser?.id && (
                          <span className="ml-2 text-xs text-gray-400">(you)</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Eye className="w-3.5 h-3.5 text-gray-400" />
                          Staff
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-ZA") : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {u.uid !== currentUser?.id && (
                          <button
                            onClick={() => handleDelete(u.uid)}
                            className="text-gray-300 hover:text-red-500 transition-colors"
                            title="Remove staff member"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
