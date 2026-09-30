import * as z from "zod"

export const createUserSchema = z.strictObject({
    username: z.string("Обязательное поле").min(3),
    password: z.string().min(6).regex(/[^\w\s]+/, "Нужен хотя бы один спецсимвол"),
    role: z.optional(z.literal(["USER", "MODERATOR"])).default("USER")
})

export const userSchema = createUserSchema.extend({
    id: z.number().int().min(1)
})

export const getUsersSchema = z.strictObject({
    limit: z.optional(
        z.literal(["10", "25"]).transform(Number)
    ).default(10),
    offset: z.optional(
        z.coerce.number().min(0).int()
    ).default(0)
})

export const createProfileSchema = z.strictObject({
    username: z.string("Обязательное поле").min(3),
    bio: z.string().min(3),
    avatar: z.optional(z.string())
})

export const updateProfileSchema = z.strictObject({
    bio: z.optional(z.string().min(3)),
    avatar: z.optional(z.string())
})