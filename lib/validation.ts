import { z } from "zod";

const status = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
export const classSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(1000).optional(),
  status,
});
export const subjectSchema = z.object({
  name: z.string().trim().min(2).max(100),
  classId: z.string().min(1),
});
export const bookSchema = z.object({
  title: z.string().trim().min(2).max(180),
  description: z.string().trim().max(2000).optional(),
  classId: z.string().min(1),
  subjectId: z.string().optional(),
  status,
});
export const videoSchema = z.object({
  title: z.string().trim().min(2).max(180),
  description: z.string().trim().max(2000).optional(),
  bookId: z.string().optional(),
  url: z.string().trim().url().optional(),
  status,
});
export const questionSchema = z.object({
  question: z.string().trim().min(10).max(2000),
  name: z.string().trim().max(80).optional(),
  email: z.string().trim().email().optional(),
  bookId: z.string().optional(),
});
export const answerSchema = z.object({
  answer: z.string().trim().min(2).max(4000),
  status: z.enum(["OPEN", "ANSWERED", "ARCHIVED"]),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Please provide a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  classId: z.string().optional(),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  classId: z.string().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, "New password must be at least 8 characters").optional(),
});

export const progressSchema = z.object({
  bookId: z.string().optional(),
  videoId: z.string().optional(),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]),
});

export const noteSchema = z.object({
  title: z.string().trim().min(2).max(180),
  description: z.string().trim().max(1000).optional(),
});

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
export function optional(value: FormDataEntryValue | null) {
  const text = typeof value === "string" ? value.trim() : "";
  return text || undefined;
}

