import { db } from "./firebase";
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, query, orderBy, where, getDoc, DocumentData,
} from "firebase/firestore";
import { Assessment, AssessmentResult } from "./types";

function mapAssessment(id: string, r: DocumentData): Assessment {
  return {
    id,
    title: r.title ?? "",
    description: r.description ?? "",
    departmentId: r.departmentId ?? "",
    topicId: r.topicId ?? "",
    timeLimit: r.timeLimit ?? 0,
    passMark: r.passMark ?? 70,
    manualId: r.manualId ?? "",
    questions: r.questions ?? [],
    isActive: r.isActive ?? true,
    createdAt: r.createdAt ?? "",
  };
}

function mapResult(id: string, r: DocumentData): AssessmentResult {
  return {
    id,
    assessmentId: r.assessmentId ?? "",
    assessmentTitle: r.assessmentTitle ?? "",
    userId: r.userId ?? "",
    userEmail: r.userEmail ?? "",
    userName: r.userName ?? "",
    departmentId: r.departmentId ?? "",
    score: r.score ?? 0,
    passed: r.passed ?? false,
    answers: r.answers ?? [],
    timeSpent: r.timeSpent ?? 0,
    completedAt: r.completedAt ?? "",
  };
}

export async function getAssessments(): Promise<Assessment[]> {
  const snap = await getDocs(query(collection(db, "assessments"), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => mapAssessment(d.id, d.data()));
}

export async function getAssessmentById(id: string): Promise<Assessment | null> {
  const snap = await getDoc(doc(db, "assessments", id));
  if (!snap.exists()) return null;
  return mapAssessment(snap.id, snap.data());
}

export async function createAssessment(a: Omit<Assessment, "id" | "createdAt">): Promise<Assessment> {
  const createdAt = new Date().toISOString();
  const ref = await addDoc(collection(db, "assessments"), { ...a, createdAt });
  return { id: ref.id, ...a, createdAt };
}

export async function updateAssessment(a: Assessment): Promise<void> {
  const { id, ...data } = a;
  await updateDoc(doc(db, "assessments", id), data);
}

export async function deleteAssessment(id: string): Promise<void> {
  await deleteDoc(doc(db, "assessments", id));
}

export async function submitResult(r: Omit<AssessmentResult, "id">): Promise<AssessmentResult> {
  const ref = await addDoc(collection(db, "assessmentResults"), r);
  return { id: ref.id, ...r };
}

export async function getResultsForAssessment(assessmentId: string): Promise<AssessmentResult[]> {
  const snap = await getDocs(
    query(collection(db, "assessmentResults"), where("assessmentId", "==", assessmentId))
  );
  const results = snap.docs.map((d) => mapResult(d.id, d.data()));
  return results.sort((a, b) => b.completedAt.localeCompare(a.completedAt));
}

export async function getMyResults(userId: string): Promise<AssessmentResult[]> {
  const snap = await getDocs(
    query(collection(db, "assessmentResults"), where("userId", "==", userId))
  );
  const results = snap.docs.map((d) => mapResult(d.id, d.data()));
  return results.sort((a, b) => b.completedAt.localeCompare(a.completedAt));
}

export async function getDepartmentResults(departmentId: string): Promise<AssessmentResult[]> {
  const snap = await getDocs(
    query(collection(db, "assessmentResults"), where("departmentId", "==", departmentId))
  );
  const results = snap.docs.map((d) => mapResult(d.id, d.data()));
  return results.sort((a, b) => b.completedAt.localeCompare(a.completedAt));
}
