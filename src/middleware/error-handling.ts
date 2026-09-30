import * as z from 'zod'
import type { Request, Response, NextFunction } from "express"

const errorHandler = (
    error: Error,
    _: Request,
    response: Response,
    next: NextFunction
) => {
    if (error instanceof z.ZodError) {
        response.status(422).json({
            success: false,
            error: z.flattenError(error)
        })
    } else {
        console.error(error.stack) // TODO только для флага DEBUG (переменные окружения)
        response.status(400).json({
            success: false,
            error: error.message
        })
    }

    next()
}



export default errorHandler