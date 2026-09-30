import path from 'node:path'
import { Router, type Request, type Response } from "express";
import * as mime from 'mime-types'
import multer from "multer";


const uploadMiddlewareMemory = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 1024 * 1024 * 2 }
})

const uploadMiddlewareDisk = multer({
    storage: multer.diskStorage({
        destination: path.join(import.meta.dirname, '..', '..', 'assets', 'media'),
        filename: (_, file, callback) => {
            const extension = path.extname(file.originalname)
            const nameWithoutExtension = path.parse(file.originalname).name
            const name = `${nameWithoutExtension}_${Date.now()}${extension}`
            callback(null, name)
        }
    }),
    limits: {
        fileSize: 1024 * 1024 * 2,
        files: 3
    },
    fileFilter: (_, file, callback) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'text/plain']
        const realMimeType = mime.lookup(file.originalname)

        if (!realMimeType) {
            callback(new Error('Недопустимый mimeType'))
        } else if (allowedMimeTypes.includes(realMimeType)) {
            callback(null, true)
        } else {
            callback(new Error('Недопустимый mimeType'))
        }
    }
})

export const mediaRouter = Router()

mediaRouter.get('/media', (request: Request, response: Response) => {
    response.json()
})

mediaRouter.post(
    '/media/upload',
    uploadMiddlewareDisk.fields([
        { name: "document", maxCount: 2 },
        { name: "avatar", maxCount: 1 }
    ]),
    (request: Request, response: Response
    ) => {
        console.log(request.file)
        response.end()
    })