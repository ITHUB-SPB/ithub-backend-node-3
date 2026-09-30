import { type Request, type Response, type NextFunction } from "express";

// TODO написать собственный класс для ошибок
// на основе Error, кода ошибки, сообщения и опционального пояснения

type User = {
    username: string
    role: "user" | "moderator" | "superadmin"
}

type RequestWithAuth = Request & { user?: User | undefined }


export default function auth(request: RequestWithAuth, _: Response, next: NextFunction) {
    const authHeader = request.headers.authorization

    if (!authHeader) {
        next(new Error('Авторизационный хедер не найден'))
        return
    }

    const token = authHeader.match(/^Bearer (.*)$/)

    if (!token) {
        next(new Error('Формат авторизационного токена неверный'))
        return
    }

    if (token[1] !== "correct-token") {
        next(new Error('Авторизационный токен недействителен'))
        return
    }

    // TODO брать реальных пользователей
    const user = {
        username: 'maria',
        role: 'moderator'
    } as User;

    request.user = user

    next()
}