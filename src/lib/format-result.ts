import { type Response } from "express"


// TODO: быть построже с типами formatSuccess
export function formatSuccess(
    response: Response,
    data: { [k: string]: object },
    code: number
) {
    response.status(code).json({
        success: true,
        data
    })
}

// типизировать code либо через енам всех доступных кодов, 
// либо через суживание типа number до 4xx и 5xx
export function formatError(
    response: Response,
    message: string,
    code: number = 400,
    details: object = {}
) {
    response.status(code).json({
        success: false,
        error: message,
        details
    })
}
