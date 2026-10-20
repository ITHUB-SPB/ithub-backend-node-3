import * as z from "zod";

export const createAccountInputSchema = z.object({
  body: z.object({
    email: z.email().min(3).max(100),
    password: z.string().min(6).max(100),
    role: z.enum(["user", "moderator"]).optional(),
  }),
});

export const createProfileInputSchema = z.object({
  body: z.object({
    bio: z.string().min(3).max(500),
    avatar: z.string().nullable().optional(),
  }),
  headers: z.looseObject({
    Authorization: z.email(),
  }),
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

export const updateProfileInputSchema = z.object({
  body: z.object({
    bio: z.string().min(3).max(500).optional(),
    avatar: z.string().nullable().optional(),
  }),
  headers: z.looseObject({
    Authorization: z.email(),
  }),
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});
