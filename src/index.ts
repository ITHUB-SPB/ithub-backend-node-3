import express, { type Request, type Response } from 'express'
import path from 'node:path'

import logger from './middleware/logging.js'
import errorHandler from './middleware/error-handling.js'
import { usersRouter } from './routes/users.js'
import { mediaRouter } from './routes/media.js'

const app = express()

const staticPath = path.join(import.meta.dirname, '..', 'assets')
app.use('/media', express.static(staticPath))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(logger)

app.use(usersRouter)
app.use(mediaRouter)

app.get('/', (_, response) => {
    response.end('ok')
})

app.use((_: Request, response: Response) => {
    response.status(404).json({
        message: "Ресурс не найден"
    })
})

app.use(errorHandler)

app.listen(3000)