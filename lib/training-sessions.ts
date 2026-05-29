import { TrainingSession, SessionBooking } from "./types";
import { dbSelect, dbSelectOne, dbInsert, dbUpdate, dbDelete } from "./rest";

function mapSession(r: Record<string, unknown>): TrainingSession {
  return {
    id: r.id as string,
    title: (r.title as string) ?? "",
    description: (r.description as string) ?? "",
    departmentId: (r.department_id as string) ?? "",
    assessmentId: (r.assessment_id as string) ?? "",
    maxCapacity: (r.max_capacity as number) ?? 0,
    status: ((r.status as TrainingSession["status"]) ?? "open"),
    scheduledDate: (r.scheduled_date as string) ?? "",
    createdAt: (r.created_at as string) ?? "",
    createdBy: (r.created_by as string) ?? "",
  };
}

function mapBooking(r: Record<string, unknown>): SessionBooking {
  return {
    id: r.id as string,
    sessionId: (r.session_id as string) ?? "",
    sessionTitle: (r.session_title as string) ?? "",
    userId: (r.user_id as string) ?? "",
    userName: (r.user_name as string) ?? "",
    userEmail: (r.user_email as string) ?? "",
    departmentId: (r.department_id as string) ?? "",
    availableTimes: (r.available_times as string) ?? "",
    notes: (r.notes as string) ?? "",
    status: ((r.status as SessionBooking["status"]) ?? "pending"),
    bookedAt: (r.booked_at as string) ?? "",
  };
}

export async function getTrainingSessions(): Promise<TrainingSession[]> {
  const rows = await dbSelect("training_sessions", { order: "created_at.desc" });
  return rows.map(mapSession);
}

export async function getSessionsByDepartment(departmentId: string): Promise<TrainingSession[]> {
  const rows = await dbSelect("training_sessions", { order: "created_at.desc" });
  return rows
    .map(mapSession)
    .filter((s) => (s.departmentId === departmentId || s.departmentId === "") && s.status !== "completed");
}

export async function getTrainingSessionById(id: string): Promise<TrainingSession | null> {
  const row = await dbSelectOne("training_sessions", { "id": `eq.${id}` });
  return row ? mapSession(row) : null;
}

export async function createTrainingSession(s: Omit<TrainingSession, "id" | "createdAt">): Promise<TrainingSession> {
  const row = await dbInsert("training_sessions", {
    title: s.title, description: s.description,
    department_id: s.departmentId || null, assessment_id: s.assessmentId || null,
    max_capacity: s.maxCapacity, status: s.status,
    scheduled_date: s.scheduledDate || null, created_by: s.createdBy,
  });
  return mapSession(row);
}

export async function updateTrainingSession(s: TrainingSession): Promise<void> {
  await dbUpdate("training_sessions", s.id, {
    title: s.title, description: s.description,
    department_id: s.departmentId || null, assessment_id: s.assessmentId || null,
    max_capacity: s.maxCapacity, status: s.status,
    scheduled_date: s.scheduledDate || null,
  });
}

export async function deleteTrainingSession(id: string): Promise<void> {
  await dbDelete("training_sessions", id);
}

export async function getBookingsForSession(sessionId: string): Promise<SessionBooking[]> {
  const rows = await dbSelect("session_bookings", { "session_id": `eq.${sessionId}`, order: "booked_at.desc" });
  return rows.map(mapBooking);
}

export async function getMyBookings(userId: string): Promise<SessionBooking[]> {
  const rows = await dbSelect("session_bookings", { "user_id": `eq.${userId}`, order: "booked_at.desc" });
  return rows.map(mapBooking);
}

export async function createBooking(b: Omit<SessionBooking, "id">): Promise<SessionBooking> {
  const row = await dbInsert("session_bookings", {
    session_id: b.sessionId, session_title: b.sessionTitle,
    user_id: b.userId, user_name: b.userName, user_email: b.userEmail,
    department_id: b.departmentId || null, available_times: b.availableTimes,
    notes: b.notes, status: b.status, booked_at: b.bookedAt,
  });
  return mapBooking(row);
}

export async function updateBookingStatus(id: string, status: SessionBooking["status"]): Promise<void> {
  await dbUpdate("session_bookings", id, { status });
}

export async function deleteBooking(id: string): Promise<void> {
  await dbDelete("session_bookings", id);
}
