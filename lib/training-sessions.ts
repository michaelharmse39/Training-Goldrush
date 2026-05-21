import { db } from "./firebase";
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, query, where, getDoc, DocumentData,
} from "firebase/firestore";
import { TrainingSession, SessionBooking } from "./types";

function mapSession(id: string, r: DocumentData): TrainingSession {
  return {
    id,
    title: r.title ?? "",
    description: r.description ?? "",
    departmentId: r.departmentId ?? "",
    assessmentId: r.assessmentId ?? "",
    maxCapacity: r.maxCapacity ?? 0,
    status: r.status ?? "open",
    scheduledDate: r.scheduledDate ?? "",
    createdAt: r.createdAt ?? "",
    createdBy: r.createdBy ?? "",
  };
}

function mapBooking(id: string, r: DocumentData): SessionBooking {
  return {
    id,
    sessionId: r.sessionId ?? "",
    sessionTitle: r.sessionTitle ?? "",
    userId: r.userId ?? "",
    userName: r.userName ?? "",
    userEmail: r.userEmail ?? "",
    departmentId: r.departmentId ?? "",
    availableTimes: r.availableTimes ?? "",
    notes: r.notes ?? "",
    status: r.status ?? "pending",
    bookedAt: r.bookedAt ?? "",
  };
}

// ── Sessions ──────────────────────────────────────────────────

export async function getTrainingSessions(): Promise<TrainingSession[]> {
  const snap = await getDocs(collection(db, "trainingSessions"));
  const sessions = snap.docs.map((d) => mapSession(d.id, d.data()));
  return sessions.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getSessionsByDepartment(departmentId: string): Promise<TrainingSession[]> {
  const snap = await getDocs(
    query(collection(db, "trainingSessions"), where("departmentId", "in", [departmentId, ""]))
  );
  const sessions = snap.docs.map((d) => mapSession(d.id, d.data()));
  return sessions
    .filter((s) => s.status !== "completed")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getTrainingSessionById(id: string): Promise<TrainingSession | null> {
  const snap = await getDoc(doc(db, "trainingSessions", id));
  if (!snap.exists()) return null;
  return mapSession(snap.id, snap.data());
}

export async function createTrainingSession(
  s: Omit<TrainingSession, "id" | "createdAt">
): Promise<TrainingSession> {
  const createdAt = new Date().toISOString();
  const ref = await addDoc(collection(db, "trainingSessions"), { ...s, createdAt });
  return { id: ref.id, ...s, createdAt };
}

export async function updateTrainingSession(s: TrainingSession): Promise<void> {
  const { id, ...data } = s;
  await updateDoc(doc(db, "trainingSessions", id), data);
}

export async function deleteTrainingSession(id: string): Promise<void> {
  await deleteDoc(doc(db, "trainingSessions", id));
}

// ── Bookings ─────────────────────────────────────────────────

export async function getBookingsForSession(sessionId: string): Promise<SessionBooking[]> {
  const snap = await getDocs(
    query(collection(db, "sessionBookings"), where("sessionId", "==", sessionId))
  );
  const bookings = snap.docs.map((d) => mapBooking(d.id, d.data()));
  return bookings.sort((a, b) => b.bookedAt.localeCompare(a.bookedAt));
}

export async function getMyBookings(userId: string): Promise<SessionBooking[]> {
  const snap = await getDocs(
    query(collection(db, "sessionBookings"), where("userId", "==", userId))
  );
  const bookings = snap.docs.map((d) => mapBooking(d.id, d.data()));
  return bookings.sort((a, b) => b.bookedAt.localeCompare(a.bookedAt));
}

export async function createBooking(b: Omit<SessionBooking, "id">): Promise<SessionBooking> {
  const ref = await addDoc(collection(db, "sessionBookings"), b);
  return { id: ref.id, ...b };
}

export async function updateBookingStatus(
  id: string,
  status: SessionBooking["status"]
): Promise<void> {
  await updateDoc(doc(db, "sessionBookings", id), { status });
}

export async function deleteBooking(id: string): Promise<void> {
  await deleteDoc(doc(db, "sessionBookings", id));
}
