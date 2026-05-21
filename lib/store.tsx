"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { Department, Topic, Attendee, Gender, Equity, AgeGroup } from "./types";
import { db } from "./firebase";
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, query, orderBy, DocumentData,
} from "firebase/firestore";

// ── Row mappers (Firestore data → TS types) ──────────────────

function mapDept(id: string, r: DocumentData): Department {
  return { id, name: r.name, color: r.color, staffCount: r.staffCount };
}

function mapTopic(id: string, r: DocumentData): Topic {
  return {
    id,
    departmentId: r.departmentId,
    title: r.title,
    subject: r.subject ?? "",
    description: r.description ?? "",
    date: r.date ?? "",
    weekEnding: r.weekEnding ?? "",
    time: r.time ?? "",
    duration: r.duration ?? "",
    location: r.location ?? "",
    lessonPlanRef: r.lessonPlanRef ?? "",
    trainer: r.trainer ?? "",
    trainerSignature: r.trainerSignature ?? "",
    createdAt: r.createdAt ?? "",
  };
}

function mapAttendee(id: string, r: DocumentData): Attendee {
  return {
    id,
    topicId: r.topicId,
    departmentId: r.departmentId,
    name: r.name,
    employeeId: r.employeeId,
    jobTitle: r.jobTitle ?? "",
    gender: (r.gender as Gender) ?? "",
    equity: (r.equity as Equity) ?? "",
    passportId: r.passportId ?? "",
    ageGroup: (r.ageGroup as AgeGroup) ?? "",
    disabled: r.disabled ?? false,
    learnership: r.learnership ?? false,
    signature: r.signature ?? "",
    signedAt: r.signedAt ?? "",
  };
}

// ── Context type ─────────────────────────────────────────────

interface StoreContextType {
  departments: Department[];
  topics: Topic[];
  attendees: Attendee[];
  loading: boolean;
  error: string | null;
  addDepartment: (d: Omit<Department, "id">) => Promise<void>;
  updateDepartment: (d: Department) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;
  addTopic: (t: Omit<Topic, "id" | "createdAt">) => Promise<void>;
  updateTopic: (t: Topic) => Promise<void>;
  deleteTopic: (id: string) => Promise<void>;
  addAttendee: (a: Omit<Attendee, "id" | "signedAt">) => Promise<void>;
  deleteAttendee: (id: string) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | null>(null);

// ── Provider ──────────────────────────────────────────────────

export function StoreProvider({ children }: { children: ReactNode }) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dSnap, tSnap, aSnap] = await Promise.all([
        getDocs(query(collection(db, "departments"), orderBy("createdAt"))),
        getDocs(query(collection(db, "topics"), orderBy("createdAt"))),
        getDocs(query(collection(db, "attendees"), orderBy("signedAt"))),
      ]);
      setDepartments(dSnap.docs.map((d) => mapDept(d.id, d.data())));
      setTopics(tSnap.docs.map((d) => mapTopic(d.id, d.data())));
      setAttendees(aSnap.docs.map((d) => mapAttendee(d.id, d.data())));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : JSON.stringify(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Departments ──

  const addDepartment = async (d: Omit<Department, "id">) => {
    try {
      const ref = await addDoc(collection(db, "departments"), {
        name: d.name, color: d.color, staffCount: d.staffCount,
        createdAt: new Date().toISOString(),
      });
      setDepartments((prev) => [...prev, { id: ref.id, ...d }]);
    } catch (e) { console.error(e); }
  };

  const updateDepartment = async (d: Department) => {
    try {
      await updateDoc(doc(db, "departments", d.id), { name: d.name, color: d.color, staffCount: d.staffCount });
      setDepartments((prev) => prev.map((x) => (x.id === d.id ? d : x)));
    } catch (e) { console.error(e); }
  };

  const deleteDepartment = async (id: string) => {
    try {
      await deleteDoc(doc(db, "departments", id));
      setDepartments((prev) => prev.filter((x) => x.id !== id));
      setTopics((prev) => prev.filter((x) => x.departmentId !== id));
      setAttendees((prev) => prev.filter((x) => x.departmentId !== id));
    } catch (e) { console.error(e); }
  };

  // ── Topics ──

  const addTopic = async (t: Omit<Topic, "id" | "createdAt">) => {
    const createdAt = new Date().toISOString();
    try {
      const ref = await addDoc(collection(db, "topics"), {
        departmentId: t.departmentId,
        title: t.title,
        subject: t.subject,
        description: t.description,
        date: t.date || "",
        weekEnding: t.weekEnding || "",
        time: t.time,
        duration: t.duration,
        location: t.location,
        lessonPlanRef: t.lessonPlanRef,
        trainer: t.trainer,
        trainerSignature: t.trainerSignature,
        createdAt,
      });
      setTopics((prev) => [...prev, { id: ref.id, ...t, createdAt }]);
    } catch (e) { console.error(e); }
  };

  const updateTopic = async (t: Topic) => {
    try {
      await updateDoc(doc(db, "topics", t.id), {
        title: t.title,
        subject: t.subject,
        description: t.description,
        date: t.date || "",
        weekEnding: t.weekEnding || "",
        time: t.time,
        duration: t.duration,
        location: t.location,
        lessonPlanRef: t.lessonPlanRef,
        trainer: t.trainer,
        trainerSignature: t.trainerSignature,
      });
      setTopics((prev) => prev.map((x) => (x.id === t.id ? t : x)));
    } catch (e) { console.error(e); }
  };

  const deleteTopic = async (id: string) => {
    try {
      await deleteDoc(doc(db, "topics", id));
      setTopics((prev) => prev.filter((x) => x.id !== id));
      setAttendees((prev) => prev.filter((x) => x.topicId !== id));
    } catch (e) { console.error(e); }
  };

  // ── Attendees ──

  const addAttendee = async (a: Omit<Attendee, "id" | "signedAt">) => {
    const signedAt = new Date().toISOString();
    try {
      const ref = await addDoc(collection(db, "attendees"), {
        topicId: a.topicId,
        departmentId: a.departmentId,
        name: a.name,
        employeeId: a.employeeId,
        jobTitle: a.jobTitle,
        gender: a.gender,
        equity: a.equity,
        passportId: a.passportId,
        ageGroup: a.ageGroup,
        disabled: a.disabled,
        learnership: a.learnership,
        signature: a.signature,
        signedAt,
      });
      setAttendees((prev) => [...prev, { id: ref.id, ...a, signedAt }]);
    } catch (e) { console.error(e); }
  };

  const deleteAttendee = async (id: string) => {
    try {
      await deleteDoc(doc(db, "attendees", id));
      setAttendees((prev) => prev.filter((x) => x.id !== id));
    } catch (e) { console.error(e); }
  };

  return (
    <StoreContext.Provider
      value={{
        departments, topics, attendees, loading, error,
        addDepartment, updateDepartment, deleteDepartment,
        addTopic, updateTopic, deleteTopic,
        addAttendee, deleteAttendee,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
