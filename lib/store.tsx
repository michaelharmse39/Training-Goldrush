"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { Department, Topic, Attendee, Gender, Equity, AgeGroup } from "./types";
import { dbSelect, dbInsert, dbUpdate, dbDelete } from "./rest";

function mapDept(r: Record<string, unknown>): Department {
  return { id: r.id as string, name: r.name as string, color: r.color as string, staffCount: r.staff_count as number };
}

function mapTopic(r: Record<string, unknown>): Topic {
  return {
    id: r.id as string,
    departmentId: (r.department_id as string) ?? "",
    title: r.title as string,
    subject: (r.subject as string) ?? "",
    description: (r.description as string) ?? "",
    date: (r.date as string) ?? "",
    weekEnding: (r.week_ending as string) ?? "",
    time: (r.time as string) ?? "",
    duration: (r.duration as string) ?? "",
    location: (r.location as string) ?? "",
    lessonPlanRef: (r.lesson_plan_ref as string) ?? "",
    trainer: (r.trainer as string) ?? "",
    trainerSignature: (r.trainer_signature as string) ?? "",
    createdAt: (r.created_at as string) ?? "",
  };
}

function mapAttendee(r: Record<string, unknown>): Attendee {
  return {
    id: r.id as string,
    topicId: (r.topic_id as string) ?? "",
    departmentId: (r.department_id as string) ?? "",
    name: r.name as string,
    employeeId: r.employee_id as string,
    jobTitle: (r.job_title as string) ?? "",
    gender: ((r.gender as Gender) ?? "") as Gender,
    equity: ((r.equity as Equity) ?? "") as Equity,
    passportId: (r.passport_id as string) ?? "",
    ageGroup: ((r.age_group as AgeGroup) ?? "") as AgeGroup,
    disabled: (r.disabled as boolean) ?? false,
    learnership: (r.learnership as boolean) ?? false,
    signature: (r.signature as string) ?? "",
    signedAt: (r.signed_at as string) ?? "",
  };
}

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
      const [d, t, a] = await Promise.all([
        dbSelect("departments", { order: "created_at.asc" }),
        dbSelect("topics", { order: "created_at.asc" }),
        dbSelect("attendees", { order: "signed_at.asc" }),
      ]);
      setDepartments(d.map(mapDept));
      setTopics(t.map(mapTopic));
      setAttendees(a.map(mapAttendee));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addDepartment = async (d: Omit<Department, "id">) => {
    const row = await dbInsert("departments", { name: d.name, color: d.color, staff_count: d.staffCount });
    setDepartments((prev) => [...prev, mapDept(row)]);
  };

  const updateDepartment = async (d: Department) => {
    await dbUpdate("departments", d.id, { name: d.name, color: d.color, staff_count: d.staffCount });
    setDepartments((prev) => prev.map((x) => (x.id === d.id ? d : x)));
  };

  const deleteDepartment = async (id: string) => {
    await dbDelete("departments", id);
    setDepartments((prev) => prev.filter((x) => x.id !== id));
    setTopics((prev) => prev.filter((x) => x.departmentId !== id));
    setAttendees((prev) => prev.filter((x) => x.departmentId !== id));
  };

  const addTopic = async (t: Omit<Topic, "id" | "createdAt">) => {
    const row = await dbInsert("topics", {
      department_id: t.departmentId || null,
      title: t.title, subject: t.subject, description: t.description,
      date: t.date || null, week_ending: t.weekEnding || null,
      time: t.time, duration: t.duration, location: t.location,
      lesson_plan_ref: t.lessonPlanRef, trainer: t.trainer, trainer_signature: t.trainerSignature,
    });
    setTopics((prev) => [...prev, mapTopic(row)]);
  };

  const updateTopic = async (t: Topic) => {
    await dbUpdate("topics", t.id, {
      title: t.title, subject: t.subject, description: t.description,
      date: t.date || null, week_ending: t.weekEnding || null,
      time: t.time, duration: t.duration, location: t.location,
      lesson_plan_ref: t.lessonPlanRef, trainer: t.trainer, trainer_signature: t.trainerSignature,
    });
    setTopics((prev) => prev.map((x) => (x.id === t.id ? t : x)));
  };

  const deleteTopic = async (id: string) => {
    await dbDelete("topics", id);
    setTopics((prev) => prev.filter((x) => x.id !== id));
    setAttendees((prev) => prev.filter((x) => x.topicId !== id));
  };

  const addAttendee = async (a: Omit<Attendee, "id" | "signedAt">) => {
    const row = await dbInsert("attendees", {
      topic_id: a.topicId || null, department_id: a.departmentId || null,
      name: a.name, employee_id: a.employeeId, job_title: a.jobTitle,
      gender: a.gender, equity: a.equity, passport_id: a.passportId,
      age_group: a.ageGroup, disabled: a.disabled, learnership: a.learnership, signature: a.signature,
    });
    setAttendees((prev) => [...prev, mapAttendee(row)]);
  };

  const deleteAttendee = async (id: string) => {
    await dbDelete("attendees", id);
    setAttendees((prev) => prev.filter((x) => x.id !== id));
  };

  return (
    <StoreContext.Provider value={{
      departments, topics, attendees, loading, error,
      addDepartment, updateDepartment, deleteDepartment,
      addTopic, updateTopic, deleteTopic,
      addAttendee, deleteAttendee,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
