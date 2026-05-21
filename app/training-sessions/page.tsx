"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import {
  getTrainingSessions,
  getSessionsByDepartment,
  createTrainingSession,
  updateTrainingSession,
  deleteTrainingSession,
  getBookingsForSession,
  getMyBookings,
  createBooking,
  updateBookingStatus,
  deleteBooking,
} from "@/lib/training-sessions";
import { TrainingSession, SessionBooking } from "@/lib/types";
import {
  Calendar, Plus, Users, CheckCircle, Clock, Trash2,
  ChevronDown, ChevronUp, AlertTriangle, BookOpen, X,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────
function statusBadge(status: TrainingSession["status"]) {
  if (status === "open")
    return <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Open</span>;
  if (status === "scheduled")
    return <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">Scheduled</span>;
  return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">Completed</span>;
}

const EMPTY_SESSION: Omit<TrainingSession, "id" | "createdAt"> = {
  title: "",
  description: "",
  departmentId: "",
  assessmentId: "",
  maxCapacity: 20,
  status: "open",
  scheduledDate: "",
  createdBy: "",
};

export default function TrainingSessionsPage() {
  const { user, role, departmentId: userDeptId } = useAuth();
  const { departments } = useStore();

  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [myBookings, setMyBookings] = useState<SessionBooking[]>([]);
  const [loading, setLoading] = useState(true);

  // Admin: create/edit session
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ ...EMPTY_SESSION });
  const [saving, setSaving] = useState(false);

  // Admin: expanded session to see bookings
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [bookingsMap, setBookingsMap] = useState<Record<string, SessionBooking[]>>({});
  const [loadingBookings, setLoadingBookings] = useState<Record<string, boolean>>({});

  // Admin: schedule date editor
  const [schedulingId, setSchedulingId] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");

  // Staff: booking form
  const [bookingSessionId, setBookingSessionId] = useState<string | null>(null);
  const [availableTimes, setAvailableTimes] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");
  const [submittingBooking, setSubmittingBooking] = useState(false);

  const isAdmin = role === "admin";

  useEffect(() => {
    const load = async () => {
      if (isAdmin) {
        const all = await getTrainingSessions();
        setSessions(all);
      } else {
        const deptSessions = await getSessionsByDepartment(userDeptId ?? "");
        setSessions(deptSessions);
        if (user) {
          const mb = await getMyBookings(user.uid);
          setMyBookings(mb);
        }
      }
      setLoading(false);
    };
    if (role) load();
  }, [role, user, userDeptId, isAdmin]);

  // ── Admin: toggle bookings ──────────────────────────────────
  const toggleExpand = async (sessionId: string) => {
    if (expandedId === sessionId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(sessionId);
    if (!bookingsMap[sessionId]) {
      setLoadingBookings((p) => ({ ...p, [sessionId]: true }));
      const bk = await getBookingsForSession(sessionId);
      setBookingsMap((p) => ({ ...p, [sessionId]: bk }));
      setLoadingBookings((p) => ({ ...p, [sessionId]: false }));
    }
  };

  // ── Admin: create session ──────────────────────────────────
  const handleCreate = async () => {
    if (!formData.title.trim() || !user) return;
    setSaving(true);
    const s = await createTrainingSession({ ...formData, createdBy: user.uid });
    setSessions((p) => [s, ...p]);
    setFormData({ ...EMPTY_SESSION });
    setShowForm(false);
    setSaving(false);
  };

  // ── Admin: delete session ──────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this training session?")) return;
    await deleteTrainingSession(id);
    setSessions((p) => p.filter((s) => s.id !== id));
  };

  // ── Admin: schedule session ────────────────────────────────
  const handleSchedule = async (session: TrainingSession) => {
    if (!scheduleDate) return;
    const updated: TrainingSession = {
      ...session,
      status: "scheduled",
      scheduledDate: scheduleDate,
    };
    await updateTrainingSession(updated);
    setSessions((p) => p.map((s) => (s.id === session.id ? updated : s)));
    setSchedulingId(null);
    setScheduleDate("");
  };

  // ── Admin: mark completed ──────────────────────────────────
  const handleComplete = async (session: TrainingSession) => {
    const updated: TrainingSession = { ...session, status: "completed" };
    await updateTrainingSession(updated);
    setSessions((p) => p.map((s) => (s.id === session.id ? updated : s)));
  };

  // ── Admin: update booking status ──────────────────────────
  const handleBookingStatus = async (
    sessionId: string,
    bookingId: string,
    status: SessionBooking["status"]
  ) => {
    await updateBookingStatus(bookingId, status);
    setBookingsMap((p) => ({
      ...p,
      [sessionId]: (p[sessionId] ?? []).map((b) =>
        b.id === bookingId ? { ...b, status } : b
      ),
    }));
  };

  // ── Staff: submit booking ──────────────────────────────────
  const handleBookingSubmit = async () => {
    if (!bookingSessionId || !user || !availableTimes.trim()) return;
    const session = sessions.find((s) => s.id === bookingSessionId);
    if (!session) return;
    setSubmittingBooking(true);
    const alreadyBooked = myBookings.some((b) => b.sessionId === bookingSessionId);
    if (alreadyBooked) {
      alert("You have already submitted your availability for this session.");
      setSubmittingBooking(false);
      return;
    }
    const booking = await createBooking({
      sessionId: bookingSessionId,
      sessionTitle: session.title,
      userId: user.uid,
      userName: user.displayName ?? "",
      userEmail: user.email ?? "",
      departmentId: userDeptId ?? "",
      availableTimes,
      notes: bookingNotes,
      status: "pending",
      bookedAt: new Date().toISOString(),
    });
    setMyBookings((p) => [booking, ...p]);
    setBookingSessionId(null);
    setAvailableTimes("");
    setBookingNotes("");
    setSubmittingBooking(false);
  };

  // ── Staff: cancel booking ──────────────────────────────────
  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Cancel your availability submission?")) return;
    await deleteBooking(bookingId);
    setMyBookings((p) => p.filter((b) => b.id !== bookingId));
  };

  const getDeptName = (id: string) =>
    id ? (departments.find((d) => d.id === id)?.name ?? "Unknown") : "All Departments";

  if (loading) return <div className="p-8 text-center text-gray-500">Loading…</div>;

  // ══════════════════════════════════════════════════════════
  // ADMIN VIEW
  // ══════════════════════════════════════════════════════════
  if (isAdmin) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Training Sessions</h1>
            <p className="text-sm text-gray-500 mt-0.5">Create sessions and view staff availability</p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            New Session
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
            <h2 className="font-semibold text-gray-800 mb-4">New Training Session</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  value={formData.title}
                  onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Safety Procedures Retraining"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <textarea
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Brief description of this training session"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
                <select
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  value={formData.departmentId}
                  onChange={(e) => setFormData((p) => ({ ...p, departmentId: e.target.value }))}
                >
                  <option value="">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Max Capacity</label>
                <input
                  type="number"
                  min={1}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  value={formData.maxCapacity}
                  onChange={(e) => setFormData((p) => ({ ...p, maxCapacity: parseInt(e.target.value) || 20 }))}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4 justify-end">
              <button
                onClick={() => { setShowForm(false); setFormData({ ...EMPTY_SESSION }); }}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={saving || !formData.title.trim()}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium"
              >
                {saving ? "Creating…" : "Create Session"}
              </button>
            </div>
          </div>
        )}

        {/* Sessions list */}
        {sessions.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No training sessions yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((s) => {
              const bookings = bookingsMap[s.id] ?? [];
              const isExpanded = expandedId === s.id;
              return (
                <div key={s.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900 text-sm">{s.title}</h3>
                          {statusBadge(s.status)}
                        </div>
                        {s.description && (
                          <p className="text-xs text-gray-500 mt-0.5">{s.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            Capacity: {s.maxCapacity}
                          </span>
                          <span>{getDeptName(s.departmentId)}</span>
                          {s.scheduledDate && (
                            <span className="flex items-center gap-1 text-blue-600">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(s.scheduledDate).toLocaleDateString("en-ZA", {
                                day: "numeric", month: "short", year: "numeric"
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Schedule button */}
                        {s.status === "open" && (
                          schedulingId === s.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="datetime-local"
                                className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                value={scheduleDate}
                                onChange={(e) => setScheduleDate(e.target.value)}
                              />
                              <button
                                onClick={() => handleSchedule(s)}
                                disabled={!scheduleDate}
                                className="px-2.5 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
                              >
                                Set
                              </button>
                              <button
                                onClick={() => { setSchedulingId(null); setScheduleDate(""); }}
                                className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setSchedulingId(s.id)}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                            >
                              <Calendar className="w-3.5 h-3.5" />
                              Schedule
                            </button>
                          )
                        )}
                        {s.status === "scheduled" && (
                          <button
                            onClick={() => handleComplete(s)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs border border-green-200 text-green-700 rounded-lg hover:bg-green-50 transition-colors font-medium"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Mark Complete
                          </button>
                        )}
                        <button
                          onClick={() => toggleExpand(s.id)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <Users className="w-3.5 h-3.5" />
                          Availability
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Bookings panel */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
                      <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
                        Staff Availability Submissions
                      </h4>
                      {loadingBookings[s.id] ? (
                        <p className="text-xs text-gray-400">Loading…</p>
                      ) : bookings.length === 0 ? (
                        <p className="text-xs text-gray-400">No submissions yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {bookings.map((b) => (
                            <div
                              key={b.id}
                              className="bg-white border border-gray-200 rounded-lg p-3 flex items-start justify-between gap-3"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">{b.userName || b.userEmail}</p>
                                {b.userName && <p className="text-xs text-gray-400">{b.userEmail}</p>}
                                <p className="text-xs text-gray-600 mt-1">
                                  <span className="font-medium">Available:</span> {b.availableTimes}
                                </p>
                                {b.notes && (
                                  <p className="text-xs text-gray-400 mt-0.5">Note: {b.notes}</p>
                                )}
                                <p className="text-xs text-gray-300 mt-1">
                                  Submitted {new Date(b.bookedAt).toLocaleDateString("en-ZA")}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {b.status === "pending" && (
                                  <>
                                    <button
                                      onClick={() => handleBookingStatus(s.id, b.id, "confirmed")}
                                      className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium"
                                    >
                                      Confirm
                                    </button>
                                    <button
                                      onClick={() => handleBookingStatus(s.id, b.id, "cancelled")}
                                      className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors font-medium"
                                    >
                                      Decline
                                    </button>
                                  </>
                                )}
                                {b.status === "confirmed" && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Confirmed</span>
                                )}
                                {b.status === "cancelled" && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-500 font-medium">Declined</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // STAFF / DEPT_HEAD VIEW
  // ══════════════════════════════════════════════════════════
  const bookedSessionIds = new Set(myBookings.map((b) => b.sessionId));

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Training Sessions</h1>
        <p className="text-sm text-gray-500 mt-0.5">Submit your available times for upcoming training sessions</p>
      </div>

      {/* My submissions */}
      {myBookings.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">My Submissions</h2>
          <div className="space-y-2">
            {myBookings.map((b) => (
              <div key={b.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{b.sessionTitle}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    <span className="font-medium">Your availability:</span> {b.availableTimes}
                  </p>
                  {b.notes && <p className="text-xs text-gray-400 mt-0.5">Note: {b.notes}</p>}
                  <div className="mt-2">
                    {b.status === "pending" && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Pending Review</span>
                    )}
                    {b.status === "confirmed" && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium flex items-center gap-1 w-fit">
                        <CheckCircle className="w-3 h-3" /> Confirmed
                      </span>
                    )}
                    {b.status === "cancelled" && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-medium">Declined</span>
                    )}
                  </div>
                </div>
                {b.status === "pending" && (
                  <button
                    onClick={() => handleCancelBooking(b.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available sessions */}
      <h2 className="text-sm font-semibold text-gray-700 mb-3">Available Sessions</h2>
      {sessions.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No training sessions available for your department at the moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((s) => {
            const alreadyBooked = bookedSessionIds.has(s.id);
            const isBooking = bookingSessionId === s.id;
            return (
              <div key={s.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 text-sm">{s.title}</h3>
                        {statusBadge(s.status)}
                      </div>
                      {s.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{s.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          Up to {s.maxCapacity} participants
                        </span>
                        {s.scheduledDate && (
                          <span className="flex items-center gap-1 text-blue-600 font-medium">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(s.scheduledDate).toLocaleDateString("en-ZA", {
                              weekday: "short", day: "numeric", month: "short", year: "numeric",
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                    {!alreadyBooked && s.status !== "completed" && (
                      <button
                        onClick={() => setBookingSessionId(isBooking ? null : s.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shrink-0"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        Submit Availability
                      </button>
                    )}
                    {alreadyBooked && (
                      <span className="text-xs text-green-600 font-medium flex items-center gap-1 shrink-0">
                        <CheckCircle className="w-3.5 h-3.5" /> Submitted
                      </span>
                    )}
                  </div>

                  {/* Booking form */}
                  {isBooking && !alreadyBooked && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-500 mb-3 flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        Enter your available dates/times below. The admin will schedule the session based on availability.
                      </p>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Your available times *
                          </label>
                          <input
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                            placeholder="e.g. Monday mornings, Wednesday afternoons, any Friday"
                            value={availableTimes}
                            onChange={(e) => setAvailableTimes(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Notes (optional)</label>
                          <input
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                            placeholder="Any additional information"
                            value={bookingNotes}
                            onChange={(e) => setBookingNotes(e.target.value)}
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => { setBookingSessionId(null); setAvailableTimes(""); setBookingNotes(""); }}
                            className="px-3 py-1.5 text-xs border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleBookingSubmit}
                            disabled={submittingBooking || !availableTimes.trim()}
                            className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium"
                          >
                            {submittingBooking ? "Submitting…" : "Submit"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
