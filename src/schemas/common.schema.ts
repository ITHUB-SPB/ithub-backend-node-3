import * as z from "zod"

export const nonNegativeNumber = z.number().int().refine(value => value >= 0)

export const metaSchema = z.strictObject({
    total: nonNegativeNumber,
    page: nonNegativeNumber,
    limit: nonNegativeNumber,
    pages: nonNegativeNumber,
})

export const inputSchema = z.object({
    body: z.union([z.null(), z.any(), z.object()]),
    query: z.union([z.null(), z.any(), z.object()]),
    params: z.union([z.null(), z.any(), z.object()]),
    headers: z.union([z.null(), z.any(), z.object()])
})
