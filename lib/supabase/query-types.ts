export interface ProfileRoleRow {
  role: "admin" | "student";
  full_name: string;
}

export interface ProfileFullRow {
  id: string;
  role: "admin" | "student";
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  grade_level: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  notes: string | null;
  is_active: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  created_at: string;
  updated_at: string;
}

export interface LessonRow {
  id: string;
  student_id: string;
  title: string;
  topic: string | null;
  starts_at: string;
  ends_at: string;
  meeting_url: string | null;
  status: "scheduled" | "completed" | "cancelled" | "reschedule_requested";
  reschedule_reason: string | null;
  teacher_notes: string | null;
  reminder_24h_sent: boolean;
  reminder_1h_sent: boolean;
  created_at: string;
  updated_at: string;
}

export interface LessonWithProfileRow extends LessonRow {
  profiles: {
    full_name: string;
    email: string;
    email_notifications: boolean;
    push_notifications: boolean;
  } | null;
}

export interface SubmissionWithAssignmentRow {
  id: string;
  assignment_id: string;
  student_id: string;
  file_url: string | null;
  note: string | null;
  status: "pending" | "submitted" | "late" | "graded";
  grade: number | null;
  feedback: string | null;
  submitted_at: string | null;
  graded_at: string | null;
  created_at: string;
  assignments: {
    title: string;
    due_at: string;
  } | null;
}

export interface StudentOption {
  id: string;
  full_name: string;
  email: string;
  grade_level: string | null;
}

export interface LessonWithStudentRow extends LessonRow {
  profiles: { full_name: string; email: string } | null;
}