import * as z from "zod"
import { metaSchema } from "./common.schema.js"

const categoryEnum = z.enum(['electronics', 'clothing', 'food', 'other'])

export const productSchema = z.object({
    id: z.number().positive().int(),
    name: z.string().min(2).max(100),
    price: z.number().positive(),
    category: categoryEnum,
    description: z.string().max(500).nullable().optional(),
    imageUrl: z.string().url().nullable(),
    archived: z.boolean(),
    accountEmail: z.string().email(), 
    createdAt: z.date().optional()
})

export const getManyProductsInputSchema = z.object({
    query: z.object({
        category: categoryEnum.optional(),
        minPrice: z.coerce.number().nonnegative().optional().default(0), 
        maxPrice: z.coerce.number().positive().optional().default(Number.MAX_SAFE_INTEGER),
        page: z.coerce.number().positive().int().optional().default(1),
        limit: z.coerce.number().positive().int().optional().default(10)
    }),
})

export const getProductsWithMetaOutputSchema = z.object({
    data: z.array(productSchema),
    meta: metaSchema
})

export const getProductInputSchema = z.object({
    params: z.object({
        id: z.coerce.number().positive().int()
    })
})

export const getProductOutputSchema = productSchema

export const createProductInputSchema = z.object({
    headers: z.object({
        authorization: z.string().email() 
    }),
    body: z.object({
        name: z.string().min(2).max(100),
        price: z.coerce.number().positive(), 
        category: categoryEnum,
        description: z.string().max(500).optional().nullable(),
    }),
    file: z.object({
        mimetype: z.string().refine(val => ['image/jpeg', 'image/png'].includes(val), {
            message: "Only JPEG and PNG formats are allowed"
        }),
        size: z.number().max(2 * 1024 * 1024, { message: "File size must be under 2MB" })
    }).optional()
})

export const updateProductInputSchema = z.object({
    headers: z.object({
        authorization: z.string().email()
    }),
    params: z.object({
        id: z.coerce.number().positive().int()
    }),
    body: z.object({
        name: z.string().min(2).max(100).optional(),
        price: z.coerce.number().positive().optional(),
        category: categoryEnum.optional(),
        description: z.string().max(500).optional().nullable(),
    }),
    file: z.object({
        mimetype: z.string().refine(val => ['image/jpeg', 'image/png'].includes(val)),
        size: z.number().max(2 * 1024 * 1024)
    }).optional()
})
