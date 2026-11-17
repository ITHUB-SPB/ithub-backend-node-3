import * as z from "zod"
import { metaSchema } from "./common.schema.js"

const categoryEnum = z.enum(['electronics', 'clothing', 'food', 'other']);

export const createProductInputSchema = z.object({
    body: z.strictObject({
        name: z.string().min(2).max(100),
        price: z.coerce.number().positive(),
        category: categoryEnum,
        description: z.string().max(500).optional().nullable(),
    }),
    headers: z.looseObject({
        Authorization: z.string().email() 
    }),
})

export const updateProductInputSchema = z.object({
    params: z.object({
        id: z.coerce.number().positive().int()
    }),
    body: z.strictObject({
        name: z.string().min(2).max(100).optional(),
        price: z.coerce.number().positive().optional(),
        category: categoryEnum.optional(),
        description: z.string().max(500).optional().nullable(),
    }),
    headers: z.looseObject({
        Authorization: z.string().email()
    }),
})

export const productSchema = z.object({
    id: z.number().positive().int(),
    name: z.string().min(2).max(100),
    price: z.number().positive(),
    category: categoryEnum,
    description: z.string().max(500).nullable(),
    imageUrl: z.string().url().nullable(), 
    archived: z.boolean(),
    accountEmail: z.string().email(),
    createdAt: z.date()
})

export const getProductOutputSchema = productSchema

export const getProductsInputSchema = z.object({
    query: z.object({
        category: categoryEnum.optional(),
        minPrice: z.coerce.number().positive().optional(),
        maxPrice: z.coerce.number().positive().optional(),
        page: z.coerce.number().positive().int().default(1),
        limit: z.coerce.number().positive().int().default(10)
    }),
})

export const getProductsOutputSchema = z.array(productSchema)

export const getProductsWithMetaOutputSchema = z.object({
    data: getProductsOutputSchema,
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    pages: z.number().int().nonnegative()
})