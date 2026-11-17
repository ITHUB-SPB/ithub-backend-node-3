import * as z from 'zod'
import { prisma } from '../prisma.js'
import { Prisma } from '../../generated/prisma/client.js'
import type { ErrorWithCode } from '../types.js'

import { ProductsRepository } from "./abstract.js";
import { 
    createProductInputSchema, 
    getProductOutputSchema, 
    getProductsInputSchema,
    getProductsWithMetaOutputSchema,
    updateProductInputSchema
} from '../schemas/products.schema.js'
import { products } from "../data.js"; 

export class ProductsRepositorySqlite extends ProductsRepository<false> {
    
    override async add(
        record: z.output<typeof createProductInputSchema> & { imageUrl?: string | null }
    ): Promise<z.output<typeof getProductOutputSchema>> {
        const createdRecord = await prisma.product.create({
            data: {
                name: record.body.name,
                price: record.body.price,
                category: record.body.category,
                description: record.body.description ?? null,
                imageUrl: record.imageUrl ?? null, 
                accountEmail: record.headers['authorization'] as string,
            },
        })
        return createdRecord
    }

    override async getAll(input: z.output<typeof getProductsInputSchema>): Promise<z.output<typeof getProductsWithMetaOutputSchema>> {
        const { category, minPrice, maxPrice, page, limit } = input.query

        const where: Prisma.ProductWhereInput = {}
        if (category) where.category = category
        if (minPrice !== undefined || maxPrice !== undefined) {
            where.price = {}
            if (minPrice !== undefined) where.price.gte = minPrice
            if (maxPrice !== undefined) where.price.lte = maxPrice
        }

        const skip = (page - 1) * limit

        const [products, total] = await prisma.$transaction([
            prisma.product.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
            prisma.product.count({ where })
        ])

        return {
            data: products,
            total,
            page,
            limit,
            pages: Math.ceil(total / limit)
        }
    }

    override async getOne(id: number | string): Promise<z.output<typeof getProductOutputSchema>> {
        const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
        const product = await prisma.product.findUnique({ where: { id: numericId } })
        
        if (!product) {
            const error = new Error('Record not found') as ErrorWithCode;
            error.code = "404";
            throw error;
        }
        return product
    }

    override async update(
        id: number | string, 
        record: z.output<typeof updateProductInputSchema>
    ): Promise<z.output<typeof getProductOutputSchema>> {
        const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
        const product = await prisma.product.findUnique({ where: { id: numericId } })

        if (!product) {
            const error = new Error('Record not found') as ErrorWithCode;
            error.code = "404";
            throw error;
        }
        if (product.accountEmail !== record.headers['authorization']) {
            const error = new Error('Forbidden') as ErrorWithCode;
            error.code = "403";
            throw error;
        }

        const updateData = Object.fromEntries(
            Object.entries(record.body).filter(([_, v]) => v !== undefined)
        );

        const updatedRecord = await prisma.product.update({
            where: { id: numericId },
            data: updateData as Prisma.ProductUncheckedUpdateInput
        })
        return updatedRecord
    }

    override async delete(id: number | string): Promise<void> {
        const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
        try {
            await prisma.product.delete({ where: { id: numericId } })
        } catch (error) {
            const err = new Error('Record not found') as ErrorWithCode;
            err.code = "404";
            throw err;
        }
    }
}

class ProductsRepositoryMemory extends ProductsRepository<true> {
    private products: any[] = [...products];

    override getAll(input: z.output<typeof getProductsInputSchema>) {
        return { data: this.products, total: this.products.length, page: 1, limit: 10, pages: 1 }
    }
    override getOne(id: number | string) { return this.products.find(p => p.id === Number(id)) }
    override add(record: any) { 
        const newProd = { ...record.body, id: Date.now(), accountEmail: record.headers['authorization'], imageUrl: record.imageUrl ?? null, archived: false, createdAt: new Date() };
        this.products.push(newProd); 
        return newProd;
    }
    override update(id: number | string, record: z.output<typeof updateProductInputSchema>) {
        const idx = this.products.findIndex(p => p.id === Number(id));
        this.products[idx] = { ...this.products[idx], ...record.body };
        return this.products[idx];
    }
    override delete(id: number | string) { this.products = this.products.filter(p => p.id !== Number(id)) }
}

export const productsRepository = !process.env['DATABASE_URL'] ? new ProductsRepositoryMemory() : new ProductsRepositorySqlite()