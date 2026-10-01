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

export interface ContactRequestRow {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  grade_level: string | null;
  package_name: string | null;
  message: string | null;
  is_handled: boolean;
  created_at: string;
}

export interface LessonWithStudentRow extends LessonRow {
  profiles: { full_name: string; email: string } | null;
}

export interface TopicProgressRow {
  id: string;
  student_id: string;
  lesson_id: string | null;
  topic: string;
  mastery_level: number;
  comment: string | null;
  created_at: string;
}

export interface TopicProgressWithStudentRow extends TopicProgressRow {
  profiles: { full_name: string; email: string } | null;
}

export interface AssignmentRow {
  id: string;
  title: string;
  description: string | null;
  attachment_url: string | null;
  due_at: string;
  created_at: string;
}

export interface SubmissionForAdminRow {
  id: string;
  student_id: string;
  file_url: string | null;
  note: string | null;
  status: "pending" | "submitted" | "late" | "graded";
  grade: number | null;
  feedback: string | null;
  submitted_at: string | null;
  profiles: { full_name: string; email: string } | null;
}

export interface AssignmentWithSubmissionsRow extends AssignmentRow {
  submissions: SubmissionForAdminRow[];
}

export interface StudentSubmissionRow {
  id: string;
  assignment_id: string;
  file_url: string | null;
  note: string | null;
  status: "pending" | "submitted" | "late" | "graded";
  grade: number | null;
  feedback: string | null;
  submitted_at: string | null;
  assignments: AssignmentRow | null;
}

export interface MaterialRow {
  id: string;
  title: string;
  description: string | null;
  type: "pdf" | "video" | "link";
  file_path: string | null;
  external_url: string | null;
  topic: string | null;
  created_at: string;
}

export interface QuizRow {
  id: string;
  title: string;
  description: string | null;
  time_limit_minutes: number | null;
  available_from: string | null;
  available_until: string | null;
  is_published: boolean;
  created_at: string;
}

export interface QuizOptionRow {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  order_index: number;
}

// Öğrenciye gönderilen versiyon: is_correct KESİNLİKLE bulunmaz
export interface QuizOptionForStudent {
  id: string;
  question_id: string;
  option_text: string;
  order_index: number;
}

export interface QuizQuestionRow {
  id: string;
  quiz_id: string;
  question_text: string;
  order_index: number;
  quiz_options: QuizOptionRow[];
}

export interface QuizQuestionForStudent {
  id: string;
  quiz_id: string;
  question_text: string;
  order_index: number;
  quiz_options: QuizOptionForStudent[];
}

export interface QuizAttemptRow {
  id: string;
  quiz_id: string;
  student_id: string;
  time_limit_minutes: number | null;
  started_at: string;
  submitted_at: string | null;
  score: number | null;
}

export interface QuizAttemptWithStudentRow extends QuizAttemptRow {
  profiles: { full_name: string; email: string } | null;
}

export interface ProductRow {
  id: string;
  type: "lesson_package" | "book" | "other";
  name: string;
  description: string | null;
  price: number;
  currency: string;
  lesson_count: number | null;
  duration_months: number | null;
  pricing_unit: "hourly" | "monthly" | "one_time";
  features: string | null;
  image_url: string | null;
  stock: number | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface StudentOrderRow {
  id: string;
  product_name: string | null;
  package_duration_months: number | null;
  amount: number;
  currency: string;
  status: "pending" | "paid" | "failed" | "refunded";
  paid_at: string | null;
  package_expires_at: string | null;
  created_at: string;
}

export interface AdminOrderRow extends StudentOrderRow {
  student_id: string | null;
  product_id: string;
  receipt_path: string | null;
  profiles: { full_name: string; email: string } | null;
  receipt_url?: string | null;
}

export interface HomeContentJson {
  hero?: { title: string; subtitle: string };
  features?: { title: string; description: string }[];
  whyUs?: string[];
  cta?: { title: string; subtitle: string };
}

export interface BlogPostRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  content_html: string;
  status: "draft" | "published";
  seo_title: string | null;
  seo_description: string | null;
  author_id: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  view_count: number;
}

export type BlogPostSummary = Pick<
  BlogPostRow,
  "id" | "slug" | "title" | "excerpt" | "cover_image_url" | "status" | "published_at" | "view_count"
>;

export interface InstagramPostRow {
  id: string;
  media_type: string | null;
  media_url: string | null;
  thumbnail_url: string | null;
  permalink: string | null;
  caption: string | null;
  timestamp: string | null;
  cached_at: string;
}