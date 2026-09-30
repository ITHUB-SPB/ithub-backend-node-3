import * as z from 'zod'
import { prisma } from './db.js'
import { createUserSchema } from './schema/users.js'
import { createNotificationSchema } from './schema/notifications.js'

async function seedUsers() {
    const users: z.infer<typeof createUserSchema>[] = [
        { username: 'maria', password: '123kjs!@#dx', role: "MODERATOR" },
        { username: 'alexander', password: 'sad8@#$23', role: "USER" },
        { username: 'ivan', password: 'oxcsed2!31s', role: "USER" }
    ]

    for (const user of users) {
        await prisma.user.upsert({
            create: { ...user },
            update: { ...user },
            where: {
                username: user.username
            }
        })
    }

    // TODO return created/found users
}

async function seedNotifications(users) {
    const notifications: z.infer<typeof createNotificationSchema>[] = [
        { content: 'notification for maria', userId: 1 }, // TODO get real userId
        { content: 'notification for alexander', userId: 2 }, // TODO get real userId
        { content: 'notification for alexander', userId: 3 }, // TODO get real userId
    ]
}

seedUsers()
    .then((users) => seedNotifications(users))
    .catch(error => {
        console.error(error)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })