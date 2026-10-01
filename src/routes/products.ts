import { Router, type Request, type Response } from "express"
import * as z from 'zod'

import { productsRepository } from "../repository/products.repository.js"
import { formatSuccess } from "../middleware/format-result.js"
import * as schema from '../schema.js'

export const productsRouter = Router()

productsRouter.get('/', (request: Request, response: Response) => {
    const { query } = z.parse(schema.getProductsInputSchema, request)
    const { data, meta } = productsRepository.getAll(query)

    const responseData = schema.getProductsWithMetaOutputSchema.parse({
        data,
        meta
    })

    formatSuccess(response, responseData, "200")
})