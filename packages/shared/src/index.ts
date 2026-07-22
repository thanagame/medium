import { z } from "zod";

/* ------------------------------------------------------------------ *
 * Domain DTOs (shared contract between web and api)
 * ------------------------------------------------------------------ */

export interface UserDto {
  id: string;
  email: string;
  username: string;
  name: string;
  bio?: string | null;
  avatarUrl?: string | null;
  createdAt: string;
}

export interface AuthorDto {
  id: string;
  username: string;
  name: string;
  avatarUrl?: string | null;
  bio?: string | null;
}

export interface TagDto {
  id: string;
  name: string;
  slug: string;
  articleCount?: number;
}

export interface ArticleDto {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  content: string; // sanitized HTML
  excerpt?: string | null;
  coverImageUrl?: string | null;
  published: boolean;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  author: AuthorDto;
  tags: TagDto[];
  likeCount: number;
  liked: boolean;
  commentCount: number;
  views: number;
}

export interface CommentDto {
  id: string;
  body: string;
  createdAt: string;
  author: AuthorDto;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AuthResponse {
  token: string;
  user: UserDto;
}

export interface ProfileDto {
  user: AuthorDto & { createdAt: string };
  articleCount: number;
}

/* ------------------------------------------------------------------ *
 * Zod schemas (used by web forms; mirror api validation)
 * ------------------------------------------------------------------ */

export const registerSchema = z.object({
  email: z.email("อีเมลไม่ถูกต้อง"),
  username: z
    .string()
    .min(3, "อย่างน้อย 3 ตัวอักษร")
    .max(30, "ไม่เกิน 30 ตัวอักษร")
    .regex(/^\w+$/, "ใช้ได้เฉพาะ a-z, 0-9 และ _"),
  name: z.string().min(1, "กรุณากรอกชื่อ").max(80),
  password: z.string().min(6, "อย่างน้อย 6 ตัวอักษร").max(100),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.email("อีเมลไม่ถูกต้อง"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
});
export type LoginInput = z.infer<typeof loginSchema>;

const optionalUrl = z
  .url("ต้องเป็น URL ที่ถูกต้อง")
  .optional()
  .or(z.literal(""));

export const articleInputSchema = z.object({
  title: z.string().min(1, "กรุณากรอกหัวข้อ").max(200),
  subtitle: z.string().max(300).optional().or(z.literal("")),
  content: z.string().min(1, "เนื้อหาว่างเปล่า"),
  coverImageUrl: optionalUrl,
  tags: z.array(z.string().min(1).max(30)).max(5).optional(),
});
export type ArticleInput = z.infer<typeof articleInputSchema>;

export const commentInputSchema = z.object({
  body: z.string().min(1, "พิมพ์คอมเมนต์ก่อน").max(2000),
});
export type CommentInput = z.infer<typeof commentInputSchema>;

export const profileUpdateSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  bio: z.string().max(300).optional().or(z.literal("")),
  avatarUrl: optionalUrl,
});
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

/* ------------------------------------------------------------------ *
 * Query helpers
 * ------------------------------------------------------------------ */

export type ArticleSort = "latest" | "popular";

export interface ArticleFeedQuery {
  page?: number;
  pageSize?: number;
  tag?: string;
  author?: string;
  search?: string;
  sort?: ArticleSort;
}
