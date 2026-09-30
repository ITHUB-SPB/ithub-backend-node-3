import * as z from "zod"

export const notificationSchema = z.strictObject({
    id: z.number().int().min(1),
    status: z.literal(["NEW", "READ"]),
    content: z.string().min(5),
    createdAt: z.date(),
    userId: z.number().int().min(1)
})

export const createNotificationSchema = notificationSchema.pick({
    content: true,
    userId: true
})