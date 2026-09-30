import type { Request, Response, NextFunction } from 'express'

const logger = (request: Request, response: Response, next: NextFunction) => {
    const startTime = Date.now()

    response.on('finish', () => {
        const duration = Date.now() - startTime

        console.log(
            `${duration} ms`,
            request.url,
            request.params,
            request.body
        )
    })

    next()
}

export default logger