import * as z from 'zod'
import { ProductsRepository } from "./abstract.js";
import { productSchema, getProductsInputSchema, getProductsWithMetaOutputSchema } from '../schema.js'

import { products } from "../data.js";

type Product = z.output<typeof productSchema>

class ProductsRepositoryLocal extends ProductsRepository<true> {
    private products: Product[];

    constructor() {
        super()
        this.products = products;
    }

    override getAll(input: z.output<typeof getProductsInputSchema>['query']): z.output<typeof getProductsWithMetaOutputSchema> {
        const filteredData = this.products.filter((product) => {
            if (product.category && product.category !== input.category) {
                return false
            }
            return product.price >= input.minPrice && product.price <= input.maxPrice
        })

        const paginatedData = filteredData.slice((input.page - 1) * input.limit, input.page * input.limit)

        const meta = {
            total: this.products.length,
            page: input.page,
            limit: input.limit,
            pages: Math.ceil(this.products.length / input.limit),
        } as const;

        return { data: paginatedData, meta }
    }

    override getOne(id: number): Product {
        const record = this.products.find(product => product.id === id)

        if (!record) {
            throw new Error('Record not found')
        }

        return record
    }

    override add(record: Omit<Product, "id">): Product {
        const lastId = this.products.at(-1)?.id ?? 0
        this.products.push({ ...record, id: lastId + 1 })

        return this.products.at(-1)!
    }

    override update(id: number, newRecord: Partial<Product>): Product {
        const record = this.getOne(id)

        if (!record) {
            throw new Error('Record not found')
        }

        return Object.assign(record, newRecord)
    }

    override delete(id: number): void {
        const recordIndex = this.products.findIndex(product => product.id === id)

        if (recordIndex === -1) {
            throw new Error('Record not found')
        }

        this.products.splice(recordIndex, 1)
    }
}

export const productsRepository = process.env.DEBUG ? new ProductsRepositoryLocal() : new ProductsRepositoryLocal()