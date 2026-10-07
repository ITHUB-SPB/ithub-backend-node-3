import * as z from 'zod'
import { prisma } from '../prisma.js'
import { Prisma } from '../../generated/prisma/client.js'

import { ProductsRepository } from './abstract.js'
import {
    createProductInputSchema,
    getProductOutputSchema,
    getManyProductsInputSchema,
    getProductsWithMetaOutputSchema,
} from '../schemas/products.schema.js'

type CreateInput = z.output<typeof createProductInputSchema>
type ManyInput = z.output<typeof getManyProductsInputSchema>
type ManyOutput = z.output<typeof getProductsWithMetaOutputSchema>
type OutputProduct = z.output<typeof getProductOutputSchema>

export class ProductSqliteRepository extends ProductsRepository<false> {

    private toNumericId(raw: number | string): number {
        return typeof raw === 'string' ? parseInt(raw, 10) : raw
    }

    private async requireById(id: number) {
        const found = await prisma.product.findUnique({ where: { id } })
        if (!found) throw new Error('Record not found')
        return found
    }

    override async getOne(rawId: number | string): Promise<OutputProduct> {
        return this.requireById(this.toNumericId(rawId))
    }

    override async getAll(input: ManyInput): Promise<ManyOutput> {
        const { category, minPrice, maxPrice, page, limit } = input.query

        const filter: Prisma.ProductWhereInput = {
            price: { gte: minPrice, lte: maxPrice },
        }

        if (category) {
            filter.category = category
        }

        const [data, total] = await prisma.$transaction([
            prisma.product.findMany({
                where: filter,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.product.count({ where: filter }),
        ])

        return {
            data,
            meta: {
                total,
                page,
                limit,
                pages: total > 0 ? Math.ceil(total / limit) : 0,
            },
        }
    }

    override async add(
        payload: CreateInput & { imageUrl?: string | null }
    ): Promise<OutputProduct> {
        return prisma.product.create({
            data: {
                name: payload.body.name,
                price: payload.body.price,
                category: payload.body.category,
                description: payload.body.description ?? null,
                imageUrl: payload.imageUrl ?? null,
                accountEmail: payload.headers.authorization,
            },
        })
    }

    override async update(
        rawId: number | string,
        ownerEmail: string,
        changes: Prisma.ProductUpdateInput
    ): Promise<OutputProduct> {
        const id = this.toNumericId(rawId)
        const existing = await this.requireById(id)

        if (existing.accountEmail !== ownerEmail) {
            throw new Error('Forbidden')
        }

        return prisma.product.update({ where: { id }, data: changes })
    }

    override async delete(rawId: number | string): Promise<void> {
        const id = this.toNumericId(rawId)
        try {
            await prisma.product.delete({ where: { id } })
        } catch {
            throw new Error('Record not found')
        }
    }
}

export const productsRepository = new ProductSqliteRepository()