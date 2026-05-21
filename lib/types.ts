export interface Department {
  id: string;
  name: string;
  color: string;
  staffCount: number;
}

export interface Topic {
  id: string;
  departmentId: string;
  title: string;
  subject: string;
  description: string;
  date: string;
  weekEnding: string;
  time: string;
  duration: string;
  location: string;
  lessonPlanRef: string;
  trainer: string;
  trainerSignature: string;
  createdAt: string;
}

export type Gender = "M" | "F" | "";
export type Equity = "A" | "C" | "W" | "I" | "Other" | "";
export type AgeGroup = "18-35" | "36-55" | "55+" | "";

export interface Attendee {
  id: string;
  topicId: string;
  departmentId: string;
  name: string;
  employeeId: string;
  jobTitle: string;
  gender: Gender;
  equity: Equity;
  passportId: string;
  ageGroup: AgeGroup;
  disabled: boolean;
  learnership: boolean;
  signature: string;
  signedAt: string;
}

// ── Assessments ──────────────────────────────────────────────

export interface Question {
  id: string;
  text: string;
  type: "multiple-choice" | "true-false";
  options: string[];
  correctAnswer: number; // index into options[]
  points: number;
}

export interface Assessment {
  id: string;
  title: string;
  description: string;
  departmentId: string; // "" = all departments
  topicId: string;      // "" = not linked to a topic
  timeLimit: number;    // minutes; 0 = no limit
  passMark: number;     // 0–100 percent
  manualId: string;     // "" = no linked manual
  questions: Question[];
  isActive: boolean;
  createdAt: string;
}

export interface AssessmentResult {
  id: string;
  assessmentId: string;
  assessmentTitle: string;
  userId: string;
  userEmail: string;
  userName: string;
  departmentId: string;
  score: number;     // percent
  passed: boolean;
  answers: number[]; // selected option indices (-1 = unanswered)
  timeSpent: number; // seconds
  completedAt: string;
}

// ── Training Sessions ─────────────────────────────────────────

export interface TrainingSession {
  id: string;
  title: string;
  description: string;
  departmentId: string; // "" = all departments
  assessmentId: string; // "" = not linked to an assessment
  maxCapacity: number;
  status: "open" | "scheduled" | "completed";
  scheduledDate: string; // ISO string when scheduled, "" otherwise
  createdAt: string;
  createdBy: string;
}

export interface SessionBooking {
  id: string;
  sessionId: string;
  sessionTitle: string;
  userId: string;
  userName: string;
  userEmail: string;
  departmentId: string;
  availableTimes: string; // free-text: "Monday mornings, Friday afternoons"
  notes: string;
  status: "pending" | "confirmed" | "cancelled";
  bookedAt: string;
}

// ── Manuals ──────────────────────────────────────────────────

export interface Manual {
  id: string;
  title: string;
  departmentId: string; // "" = all
  topicId: string;      // "" = not linked
  fileUrl: string;
  fileName: string;
  fileSize: number; // bytes
  publicId: string; // Cloudinary public ID for deletion
  uploadedAt: string;
}
