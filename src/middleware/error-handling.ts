import type { Request, Response, NextFunction } from 'express'
import { formatError } from './format-result.js'
import type { ErrorWithCode } from '../types.js'

export default function errorHandler(
    error: ErrorWithCode,
    _request: Request,
    response: Response,
    _next: NextFunction
) {
    // Если кода нет, ставим 500
    const code = error.code || "500"
    
    console.error("Ошибка:", error)

    // Передаем код
    formatError(response, error.message, code as any)
}