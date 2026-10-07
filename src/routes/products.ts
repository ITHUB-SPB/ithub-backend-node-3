import { Router, type Request, type Response } from 'express'
import * as z from 'zod'
import multer from 'multer'
import { Prisma } from '../../generated/prisma/client.js'

import { productsRepository } from '../repository/products.repository.js'
import { formatSuccess } from '../middleware/format-result.js'
import {
    getManyProductsInputSchema,
    getProductsWithMetaOutputSchema,
    createProductInputSchema,
    getProductOutputSchema,
    getProductInputSchema,
    updateProductInputSchema,
} from '../schemas/products.schema.js'

const MAX_IMAGE_SIZE = 2 * 1024 * 1024
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png'])

const imageUploader = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_IMAGE_SIZE },
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME.has(file.mimetype)) {
            cb(null, true)
        } else {
            cb(new Error('INVALID_FILE_TYPE'))
        }
    },
})

function buildImageUrl(file: Express.Multer.File): string {
    return `/static/${Date.now()}-${file.originalname}`
}

export const productsRouter = Router()

productsRouter.get('/', async (req: Request, res: Response, next) => {
    try {
        const parsed = z.parse(getManyProductsInputSchema, req)
        const result = await productsRepository.getAll(parsed)
        const payload = getProductsWithMetaOutputSchema.parse(result)

        formatSuccess(res, payload, '200')
    } catch (err) {
        next(err)
    }
})

productsRouter.get('/:id', async (req: Request, res: Response, next) => {
    try {
        const parsed = z.parse(getProductInputSchema, req)
        const product = await productsRepository.getOne(parsed.params.id)
        const payload = getProductOutputSchema.parse(product)

        formatSuccess(res, payload, '200')
    } catch (err: any) {
        if (err.message === 'Record not found') {
            res.status(404).json({ error: err.message })
        } else {
            next(err)
        }
    }
})

productsRouter.post(
    '/',
    imageUploader.single('image'),
    async (req: Request, res: Response, next) => {
        try {
            const parsed = z.parse(createProductInputSchema, req)
            const imageUrl = req.file ? buildImageUrl(req.file) : null

            const created = await productsRepository.add({ ...parsed, imageUrl })
            const payload = getProductOutputSchema.parse(created)

            formatSuccess(res, payload, '201')
        } catch (err) {
            next(err)
        }
    }
)

productsRouter.patch(
    '/:id',
    imageUploader.single('image'),
    async (req: Request, res: Response, next) => {
        try {
            const parsed = z.parse(updateProductInputSchema, req)
            const { id } = parsed.params
            const owner = parsed.headers.authorization

            const patch: Prisma.ProductUpdateInput = { ...parsed.body }

            if (req.file) {
                patch.imageUrl = buildImageUrl(req.file)
            }

            const updated = await productsRepository.update(id, owner, patch)
            const payload = getProductOutputSchema.parse(updated)

            formatSuccess(res, payload, '200')
        } catch (err: any) {
            if (err.message === 'Forbidden') {
                res.status(403).json({
                    error: 'Forbidden: You are not the owner of this product',
                })
            } else if (err.message === 'Record not found') {
                res.status(404).json({ error: err.message })
            } else {
                next(err)
            }
        }
    }
)