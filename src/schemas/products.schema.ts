import * as z from "zod"
import { metaSchema } from "./common.schema.js"

export const createProductInputSchema = z.strictObject({
    name: z.string().min(2).max(100),
    price: z.number().positive(),
    category: z.literal(['electronics', 'clothing', 'food', 'other']),
    stock: z.number().positive().int(),
    description: z.optional(z.nullable(z.string().max(500))),
})

export const productSchema = createProductInputSchema.extend({
    id: z.number().positive().int(),
    imageUrl: z.optional(z.nullable(z.url())),
    createdAt: z.iso.datetime()
})

export const getProductOutputSchema = productSchema

export const getProductsInputSchema = z.object({
    query: z.object({
        category: z.optional(z.literal(['electronics', 'clothing', 'food', 'other'])),
        minPrice: z.optional(z.number().positive()).default(-Number.MAX_SAFE_INTEGER),
        maxPrice: z.optional(z.number().positive()).default(Number.MAX_SAFE_INTEGER),
        page: z.optional(z.number().positive().int()).default(1),
        limit: z.optional(z.number().positive().int()).default(10)
    }),
})

export const getProductsOutputSchema = z.array(productSchema)

export const getProductsWithMetaOutputSchema = z.object({
    data: getProductsOutputSchema,
    meta: metaSchema
})
