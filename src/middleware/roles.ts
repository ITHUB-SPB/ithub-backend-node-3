import {  type Request, type Response, type NextFunction } from "express";

type User = {
    username: string
    role: "user" | "moderator" | "superadmin"
}

type RequestWithAuth = Request & { user?: User | undefined }


export default function roles(request: RequestWithAuth, _: Response, next: NextFunction) {
    if (!(request.user)) {
        next(new Error('Пользователь не найден'))
        return
    }

    if (request.user.role !== "moderator") {
        next(new Error('Недостаточно прав'))
        return
    }

    next()
}