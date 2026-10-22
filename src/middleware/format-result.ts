import { type Response } from "express"

type SuccessCode = `2${number}${number}`
type ErrorCode = `${4 | 5}${number}${number}`

export function formatSuccess(
    response: Response,
    data: object,
    code: SuccessCode = "200"
) {
    response.status(Number(code)).json({
        success: true,
        data
    })
}

export function formatError(
    response: Response,
    message: string,
    code: ErrorCode | string = "400",
    details: object = {}
) {
    let statusCode = Number(code)
    if (isNaN(statusCode) || statusCode < 100 || statusCode > 599) {
        statusCode = 500
    }

    response.status(statusCode).json({
        success: false,
        error: message,
        details
    })
}