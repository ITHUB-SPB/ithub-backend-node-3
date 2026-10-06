import * as z from 'zod'
import { prisma } from '../prisma.js'

import { ProductsRepository } from "./abstract.js";
import { 
    createProductInputSchema, 
    getProductOutputSchema, 
    getManyProductsInputSchema, 
    getProductsWithMetaOutputSchema 
} from '../schemas/products.schema.js'

export class ProductsRepositorySqlite extends ProductsRepository<false> {
    
    override async add(
        record: z.output<typeof createProductInputSchema> & { imageUrl?: string | null }
    ): Promise<z.output<typeof getProductOutputSchema>> {
        try {
            const createdRecord = await prisma.product.create({
                data: {
                    name: record.body.name,
                    price: record.body.price,
                    category: record.body.category,
                    description: record.body.description ?? null,
                    imageUrl: record.imageUrl ?? null, 
                    accountEmail: record.headers.authorization,
                },
            })

            return createdRecord
        } catch (error) {
            throw error
        }
    }

    override async getAll(input: z.output<typeof getManyProductsInputSchema>): Promise<z.output<typeof getProductsWithMetaOutputSchema>> {
        const { category, minPrice, maxPrice, page, limit } = input.query

        const where: any = {
            price: {
                gte: minPrice,
                lte: maxPrice
            }
        }

        if (category) {
            where.category = category
        }

        const skip = (page - 1) * limit
        const take = limit

        const [products, total] = await prisma.$transaction([
            prisma.product.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.product.count({ where })
        ])

        const pages = total > 0 ? Math.ceil(total / limit) : 0

        return {
            data: products,
            meta: {
                total,
                page,
                limit,
                pages
            }
        }
    }

    override async getOne(id: number | string): Promise<z.output<typeof getProductOutputSchema>> {
        const numericId = typeof id === 'string' ? parseInt(id, 10) : id;

        const product = await prisma.product.findUnique({
            where: { id: numericId }
        })

        if (!product) {
            throw new Error('Record not found')
        }

        return product
    }

    async update(id: number | string, email: string, fields: any): Promise<z.output<typeof getProductOutputSchema>> {
        const numericId = typeof id === 'string' ? parseInt(id, 10) : id;

        const product = await prisma.product.findUnique({
            where: { id: numericId }
        })

        if (!product) {
            throw new Error('Record not found')
        }

        if (product.accountEmail !== email) {
            throw new Error('Forbidden')
        }

        const updatedRecord = await prisma.product.update({
            where: { id: numericId },
            data: fields
        })

        return updatedRecord
    }

    override async delete(id: number | string): Promise<void> {
        const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
        
        try {
            await prisma.product.delete({
                where: { id: numericId }
            })
        } catch (error) {
            throw new Error('Record not found')
        }
    }
}
