import * as z from 'zod'

const CATEGORY_VALUES = ['electronics', 'clothing', 'food', 'other'] as const
const categoryField = z.enum(CATEGORY_VALUES)

const authorizationHeader = z.object({
    authorization: z.string().min(3, 'Email должен содержать минимум 3 символа'),
})

const productBodyShape = {
    name: z.string().min(2).max(100),
    price: z.coerce.number().positive(),
    category: categoryField,
    description: z.string().max(500).optional(),
}

const paginationShape = {
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().default(10),
}

const priceRangeShape = {
    minPrice: z.coerce.number().optional(),
    maxPrice: z.coerce.number().optional(),
}

const productEntityShape = {
    id: z.number(),
    name: z.string(),
    price: z.number(),
    category: categoryField,
    description: z.string().nullable(),
    imageUrl: z.string().nullable(),
    archived: z.boolean(),
    createdAt: z.date(),
    accountEmail: z.string(),
}

export const productSchema = z.object(productEntityShape)
export const getProductOutputSchema = productSchema

export const getProductsWithMetaOutputSchema = z.object({
    data: z.array(productSchema),
    meta: z.object({
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        pages: z.number(),
    }),
})

export const getManyProductsInputSchema = z.object({
    query: z.object({
        category: categoryField.optional(),
        ...priceRangeShape,
        ...paginationShape,
    }),
})

export const getProductInputSchema = z.object({
    params: z.object({ id: z.string() }),
})

export const createProductInputSchema = z.object({
    headers: authorizationHeader,
    body: z.object(productBodyShape),
})

export const updateProductInputSchema = z.object({
    params: z.object({ id: z.string() }),
    headers: authorizationHeader,
    body: z.object(productBodyShape).partial(),
})