import type { Request, Response, NextFunction } from 'express'
import * as z from 'zod'

type Kind = "body" | "query"

type RequestParsed = Request & {
    bodyParsed?: object
    queryParsed?: object
}

export default function validate(schema: z.ZodType, kind: Kind) {
    return (request: RequestParsed, _: Response, next: NextFunction) => {
        const result = z.safeParse(schema, request[kind])

        if (result.error) {
            next(result.error)
            return
        }

        // TODO TypeScript
        request[`${kind}Parsed`] = result.data
        next()
    }
}