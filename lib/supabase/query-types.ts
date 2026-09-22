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