import { Router, type Request, type Response } from "express"
import * as z from 'zod'
import multer from 'multer'
import path from 'path'

import { productsRepository } from "../repository/products.repository.js"
import { formatSuccess } from "../middleware/format-result.js"
import { 
    getProductsInputSchema, 
    getProductsWithMetaOutputSchema,
    getProductOutputSchema,
    createProductInputSchema,
    updateProductInputSchema
} from '../schemas/products.schema.js'

export const productsRouter = Router()

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'), 
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, uniqueSuffix + path.extname(file.originalname))
    }
})
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } })

productsRouter.get('/', async (request: Request, response: Response) => {
    const input = z.parse(getProductsInputSchema, request)
    const result = await productsRepository.getAll(input)
    const responseData = getProductsWithMetaOutputSchema.parse(result)
    
    formatSuccess(response, responseData, "200")
})

productsRouter.get('/:id', async (request: Request, response: Response) => {
    const id = z.coerce.number().parse(request.params['id'])
    const product = await productsRepository.getOne(id)
    
    if (!product) {
        return response.status(404).json({ success: false, error: 'Not found' })
    }
    
    const responseData = getProductOutputSchema.parse(product)
    formatSuccess(response, responseData, "200")
})

productsRouter.post('/', upload.single('image'), async (request: Request, response: Response) => {
    const input = z.parse(createProductInputSchema, {
        body: request.body,
        headers: request.headers
    })
    
    const imageUrl = request.file ? `/uploads/${request.file.filename}` : null

    const createdProduct = await productsRepository.add({
        ...input,
        imageUrl
    })

    const responseData = getProductOutputSchema.parse(createdProduct)
    formatSuccess(response, responseData, "201")
})

productsRouter.patch('/:id', upload.single('image'), async (request: Request, response: Response) => {
    const input = z.parse(updateProductInputSchema, {
        params: request.params,
        body: request.body,
        headers: request.headers
    })

    const imageUrl = request.file ? `/uploads/${request.file.filename}` : undefined

    const updatedProduct = await productsRepository.update(input.params['id'], {
        ...input,
        body: {
            ...input.body,
            ...(imageUrl && { imageUrl })
        }
    })

    const responseData = getProductOutputSchema.parse(updatedProduct)
    formatSuccess(response, responseData, "200")
})