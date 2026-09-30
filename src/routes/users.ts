import { Router, type Request } from "express"
import * as z from "zod"
import { ru } from "zod/locales"

import { prisma } from "../db.js"
import { createUserSchema, getUsersSchema, createProfileSchema, updateProfileSchema } from '../schema/users.js'

import auth from "../middleware/auth.js"
// TODO добавить возможность задать конкретную роль
import roles from "../middleware/roles.js"
import validate from "../middleware/validate.js"

import { formatSuccess, formatError } from "../lib/format-result.js"

z.config(ru())

export const usersRouter = Router()

type RequestParsed = Request & {
    bodyParsed?: object
    queryParsed?: object
}

usersRouter.get('/users', auth, roles, validate(getUsersSchema, 'query'), async (request: RequestParsed, response) => {
    const users = await prisma.user.findMany({
        skip: request.queryParsed.offset,
        take: request.queryParsed.limit,
        omit: {
            password: true
        },
        include: {
            profile: true
        }
    })

    const meta = {
        total: users.length,
        // page: TODO найти закономерность
        limit: request.queryParsed.limit,
        pages: Math.ceil(users.length / request.queryParsed.limit)
    }

    formatSuccess(response, { users, meta }, 200)
})

usersRouter.post('/users/profile', async (request, response) => {
    const newProfile = z.parse(createProfileSchema, request.body)

    try {
        const newRecord = await prisma.profile.create({
            data: {
                bio: newProfile.bio,
                user: {
                    connect: {
                        username: newProfile.username
                    }
                }
            }
        })

        formatSuccess(response, { profile: newRecord }, 201)
    } catch (error) {
        formatError(
            response,
            "Профиль уже существует",
            409,
            { username: newProfile.username }
        )
    }
})

usersRouter.patch('/users/profile/:profileId', async (request, response) => {
    const profileId = Number(request.params.profileId)
    const updatedProfile = z.parse(updateProfileSchema, request.body)

    try {

        const newRecord = await prisma.profile.update({
            data: {
                bio: updatedProfile.bio,
                avatar: updatedProfile.avatar || null,
            },
            where: {
                id: profileId
            }
        })

        formatSuccess(response, { profile: newRecord }, 201)
    } catch (error) {
        formatError(
            response,
            "Не удалось обновить профиль",
            409,
            { username: updatedProfile.username }
        )
    }
})


usersRouter.post('/users', async (request, response) => {
    const newUser = z.parse(createUserSchema, request.body)

    try {
        const newRecord = await prisma.user.create({
            data: newUser
        })

        formatSuccess(response, { user: newRecord }, 201)
    } catch (error) {
        formatError(
            response,
            "Пользователь уже существует",
            409,
            { username: newUser.username }
        )
    }
})

usersRouter.get('/users/:username', auth, async (request, response) => {
    const { username } = z.parse(
        z.strictObject({ username: z.string().min(3) }),
        request.params
    )

    const user = await prisma.user.findUnique({
        where: {
            username
        },
        omit: {
            password: true
        }
    })

    if (!user) {
        formatError(response, "Пользователь не найден", 404)
        return
    }

    formatSuccess(response, { user }, 200)
})