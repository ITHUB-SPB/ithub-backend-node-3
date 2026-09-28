import * as z from "zod"

export const createUserSchema = z.strictObject({
    username: z.string("Обязательное поле").min(3),
    password: z.string().min(6).regex(/[^\w\s]+/, "Нужен хотя бы один спецсимвол"),
    age: z.coerce.number().positive().min(1),
    role: z.optional(z.literal(["MODERATOR", "MODERATOR"])).default("user")
})

export const getUsersSchema = z.strictObject({
    limit: z.optional(
        z.literal(["10", "25"]).transform(Number)
    ).default(10),
    offset: z.optional(
        z.coerce.number().min(0).int()
    ).default(0)
})