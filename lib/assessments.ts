import { supabase } from "./supabase";
import { Assessment, AssessmentResult } from "./types";

function mapAssessment(r: Record<string, unknown>): Assessment {
  return {
    id: r.id as string,
    title: r.title as string ?? "",
    description: r.description as string ?? "",
    departmentId: r.department_id as string ?? "",
    topicId: r.topic_id as string ?? "",
    timeLimit: r.time_limit as number ?? 0,
    passMark: r.pass_mark as number ?? 70,
    manualId: r.manual_id as string ?? "",
    questions: (r.questions as Assessment["questions"]) ?? [],
    isActive: r.is_active as boolean ?? true,
    createdAt: r.created_at as string ?? "",
  };
}

function mapResult(r: Record<string, unknown>): AssessmentResult {
  return {
    id: r.id as string,
    assessmentId: r.assessment_id as string ?? "",
    assessmentTitle: r.assessment_title as string ?? "",
    userId: r.user_id as string ?? "",
    userEmail: r.user_email as string ?? "",
    userName: r.user_name as string ?? "",
    departmentId: r.department_id as string ?? "",
    score: r.score as number ?? 0,
    passed: r.passed as boolean ?? false,
    answers: (r.answers as number[]) ?? [],
    timeSpent: r.time_spent as number ?? 0,
    completedAt: r.completed_at as string ?? "",
  };
}

export async function getAssessments(): Promise<Assessment[]> {
  const { data } = await supabase.from("assessments").select("*").order("created_at", { ascending: false });
  return (data ?? []).map(mapAssessment);
}

export async function getAssessmentById(id: string): Promise<Assessment | null> {
  const { data } = await supabase.from("assessments").select("*").eq("id", id).single();
  return data ? mapAssessment(data) : null;
}

export async function createAssessment(a: Omit<Assessment, "id" | "createdAt">): Promise<Assessment> {
  const { data } = await supabase.from("assessments").insert({
    title: a.title, description: a.description,
    department_id: a.departmentId || null, topic_id: a.topicId || null,
    time_limit: a.timeLimit, pass_mark: a.passMark,
    manual_id: a.manualId || null, questions: a.questions, is_active: a.isActive,
  }).select().single();
  return mapAssessment(data!);
}

export async function updateAssessment(a: Assessment): Promise<void> {
  await supabase.from("assessments").update({
    title: a.title, description: a.description,
    department_id: a.departmentId || null, topic_id: a.topicId || null,
    time_limit: a.timeLimit, pass_mark: a.passMark,
    manual_id: a.manualId || null, questions: a.questions, is_active: a.isActive,
  }).eq("id", a.id);
}

export async function deleteAssessment(id: string): Promise<void> {
  await supabase.from("assessments").delete().eq("id", id);
}

export async function submitResult(r: Omit<AssessmentResult, "id">): Promise<AssessmentResult> {
  const { data } = await supabase.from("assessment_results").insert({
    assessment_id: r.assessmentId, assessment_title: r.assessmentTitle,
    user_id: r.userId, user_email: r.userEmail, user_name: r.userName,
    department_id: r.departmentId || null, score: r.score, passed: r.passed,
    answers: r.answers, time_spent: r.timeSpent, completed_at: r.completedAt,
  }).select().single();
  return mapResult(data!);
}

export async function getResultsForAssessment(assessmentId: string): Promise<AssessmentResult[]> {
  const { data } = await supabase.from("assessment_results").select("*").eq("assessment_id", assessmentId).order("completed_at", { ascending: false });
  return (data ?? []).map(mapResult);
}

export async function getMyResults(userId: string): Promise<AssessmentResult[]> {
  const { data } = await supabase.from("assessment_results").select("*").eq("user_id", userId).order("completed_at", { ascending: false });
  return (data ?? []).map(mapResult);
}

export async function getDepartmentResults(departmentId: string): Promise<AssessmentResult[]> {
  const { data } = await supabase.from("assessment_results").select("*").eq("department_id", departmentId).order("completed_at", { ascending: false });
  return (data ?? []).map(mapResult);
}
