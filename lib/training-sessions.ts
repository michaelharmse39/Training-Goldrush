import { supabase } from "./supabase";
import { TrainingSession, SessionBooking } from "./types";

function mapSession(r: Record<string, unknown>): TrainingSession {
  return {
    id: r.id as string,
    title: r.title as string ?? "",
    description: r.description as string ?? "",
    departmentId: r.department_id as string ?? "",
    assessmentId: r.assessment_id as string ?? "",
    maxCapacity: r.max_capacity as number ?? 0,
    status: (r.status as TrainingSession["status"]) ?? "open",
    scheduledDate: r.scheduled_date as string ?? "",
    createdAt: r.created_at as string ?? "",
    createdBy: r.created_by as string ?? "",
  };
}

function mapBooking(r: Record<string, unknown>): SessionBooking {
  return {
    id: r.id as string,
    sessionId: r.session_id as string ?? "",
    sessionTitle: r.session_title as string ?? "",
    userId: r.user_id as string ?? "",
    userName: r.user_name as string ?? "",
    userEmail: r.user_email as string ?? "",
    departmentId: r.department_id as string ?? "",
    availableTimes: r.available_times as string ?? "",
    notes: r.notes as string ?? "",
    status: (r.status as SessionBooking["status"]) ?? "pending",
    bookedAt: r.booked_at as string ?? "",
  };
}

export async function getTrainingSessions(): Promise<TrainingSession[]> {
  const { data } = await supabase.from("training_sessions").select("*").order("created_at", { ascending: false });
  return (data ?? []).map(mapSession);
}

export async function getSessionsByDepartment(departmentId: string): Promise<TrainingSession[]> {
  const { data } = await supabase.from("training_sessions").select("*").order("created_at", { ascending: false });
  return (data ?? [])
    .map(mapSession)
    .filter((s) => (s.departmentId === departmentId || s.departmentId === "") && s.status !== "completed");
}

export async function getTrainingSessionById(id: string): Promise<TrainingSession | null> {
  const { data } = await supabase.from("training_sessions").select("*").eq("id", id).single();
  return data ? mapSession(data) : null;
}

export async function createTrainingSession(s: Omit<TrainingSession, "id" | "createdAt">): Promise<TrainingSession> {
  const { data } = await supabase.from("training_sessions").insert({
    title: s.title, description: s.description,
    department_id: s.departmentId || null, assessment_id: s.assessmentId || null,
    max_capacity: s.maxCapacity, status: s.status,
    scheduled_date: s.scheduledDate || null, created_by: s.createdBy,
  }).select().single();
  return mapSession(data!);
}

export async function updateTrainingSession(s: TrainingSession): Promise<void> {
  await supabase.from("training_sessions").update({
    title: s.title, description: s.description,
    department_id: s.departmentId || null, assessment_id: s.assessmentId || null,
    max_capacity: s.maxCapacity, status: s.status,
    scheduled_date: s.scheduledDate || null,
  }).eq("id", s.id);
}

export async function deleteTrainingSession(id: string): Promise<void> {
  await supabase.from("training_sessions").delete().eq("id", id);
}

export async function getBookingsForSession(sessionId: string): Promise<SessionBooking[]> {
  const { data } = await supabase.from("session_bookings").select("*").eq("session_id", sessionId).order("booked_at", { ascending: false });
  return (data ?? []).map(mapBooking);
}

export async function getMyBookings(userId: string): Promise<SessionBooking[]> {
  const { data } = await supabase.from("session_bookings").select("*").eq("user_id", userId).order("booked_at", { ascending: false });
  return (data ?? []).map(mapBooking);
}

export async function createBooking(b: Omit<SessionBooking, "id">): Promise<SessionBooking> {
  const { data } = await supabase.from("session_bookings").insert({
    session_id: b.sessionId, session_title: b.sessionTitle,
    user_id: b.userId, user_name: b.userName, user_email: b.userEmail,
    department_id: b.departmentId || null, available_times: b.availableTimes,
    notes: b.notes, status: b.status, booked_at: b.bookedAt,
  }).select().single();
  return mapBooking(data!);
}

export async function updateBookingStatus(id: string, status: SessionBooking["status"]): Promise<void> {
  await supabase.from("session_bookings").update({ status }).eq("id", id);
}

export async function deleteBooking(id: string): Promise<void> {
  await supabase.from("session_bookings").delete().eq("id", id);
}
