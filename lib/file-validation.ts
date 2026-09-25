export const TEACHER_MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
export const TEACHER_ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/zip",
  "application/x-zip-compressed",
];
export const TEACHER_ACCEPT_ATTR =
  ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.zip";

export const STUDENT_MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const STUDENT_ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
];
export const STUDENT_ACCEPT_ATTR = ".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp";

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateFile(
  file: File,
  maxSizeBytes: number,
  allowedTypes: string[],
  maxSizeLabel: string
): FileValidationResult {
  if (file.size > maxSizeBytes) {
    return { valid: false, error: `Dosya çok büyük (maksimum ${maxSizeLabel}).` };
  }
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Desteklenmeyen dosya türü.",
    };
  }
  return { valid: true };
}