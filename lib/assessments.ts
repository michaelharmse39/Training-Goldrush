import { Assessment, AssessmentResult } from "./types";
import { dbSelect, dbSelectOne, dbInsert, dbUpdate, dbDelete } from "./rest";

function mapAssessment(r: Record<string, unknown>): Assessment {
  return {
    id: r.id as string,
    title: (r.title as string) ?? "",
    description: (r.description as string) ?? "",
    departmentId: (r.department_id as string) ?? "",
    topicId: (r.topic_id as string) ?? "",
    timeLimit: (r.time_limit as number) ?? 0,
    passMark: (r.pass_mark as number) ?? 70,
    manualId: (r.manual_id as string) ?? "",
    questions: (r.questions as Assessment["questions"]) ?? [],
    isActive: (r.is_active as boolean) ?? true,
    createdAt: (r.created_at as string) ?? "",
  };
}

function mapResult(r: Record<string, unknown>): AssessmentResult {
  return {
    id: r.id as string,
    assessmentId: (r.assessment_id as string) ?? "",
    assessmentTitle: (r.assessment_title as string) ?? "",
    userId: (r.user_id as string) ?? "",
    userEmail: (r.user_email as string) ?? "",
    userName: (r.user_name as string) ?? "",
    departmentId: (r.department_id as string) ?? "",
    score: (r.score as number) ?? 0,
    passed: (r.passed as boolean) ?? false,
    answers: (r.answers as number[]) ?? [],
    timeSpent: (r.time_spent as number) ?? 0,
    completedAt: (r.completed_at as string) ?? "",
  };
}

export async function getAssessments(): Promise<Assessment[]> {
  const rows = await dbSelect("assessments", { order: "created_at.desc" });
  return rows.map(mapAssessment);
}

export async function getAssessmentById(id: string): Promise<Assessment | null> {
  const row = await dbSelectOne("assessments", { "id": `eq.${id}` });
  return row ? mapAssessment(row) : null;
}

export async function createAssessment(a: Omit<Assessment, "id" | "createdAt">): Promise<Assessment> {
  const row = await dbInsert("assessments", {
    title: a.title, description: a.description,
    department_id: a.departmentId || null, topic_id: a.topicId || null,
    time_limit: a.timeLimit, pass_mark: a.passMark,
    manual_id: a.manualId || null, questions: a.questions, is_active: a.isActive,
  });
  return mapAssessment(row);
}

export async function updateAssessment(a: Assessment): Promise<void> {
  await dbUpdate("assessments", a.id, {
    title: a.title, description: a.description,
    department_id: a.departmentId || null, topic_id: a.topicId || null,
    time_limit: a.timeLimit, pass_mark: a.passMark,
    manual_id: a.manualId || null, questions: a.questions, is_active: a.isActive,
  });
}

export async function deleteAssessment(id: string): Promise<void> {
  await dbDelete("assessments", id);
}

export async function submitResult(r: Omit<AssessmentResult, "id">): Promise<AssessmentResult> {
  const row = await dbInsert("assessment_results", {
    assessment_id: r.assessmentId, assessment_title: r.assessmentTitle,
    user_id: r.userId, user_email: r.userEmail, user_name: r.userName,
    department_id: r.departmentId || null, score: r.score, passed: r.passed,
    answers: r.answers, time_spent: r.timeSpent, completed_at: r.completedAt,
  });
  return mapResult(row);
}

export async function getResultsForAssessment(assessmentId: string): Promise<AssessmentResult[]> {
  const rows = await dbSelect("assessment_results", { "assessment_id": `eq.${assessmentId}`, order: "completed_at.desc" });
  return rows.map(mapResult);
}

export async function getMyResults(userId: string): Promise<AssessmentResult[]> {
  const rows = await dbSelect("assessment_results", { "user_id": `eq.${userId}`, order: "completed_at.desc" });
  return rows.map(mapResult);
}

export async function getDepartmentResults(departmentId: string): Promise<AssessmentResult[]> {
  const rows = await dbSelect("assessment_results", { "department_id": `eq.${departmentId}`, order: "completed_at.desc" });
  return rows.map(mapResult);
}
