import * as z from 'zod'
import { productSchema } from "./schema.js"

export const products: z.output<typeof productSchema>[] = [
    {
        id: 1,
        name: "bloose",
        category: "clothing",
        description: "xl",
        price: 4200,
        stock: 0,
        imageUrl: null,
        createdAt: new Date(2022, 8, 10).toLocaleString()
    },
    {
        id: 2,
        name: "jacket",
        category: "clothing",
        description: "sm",
        price: 13100,
        stock: 0,
        imageUrl: null,
        createdAt: new Date(2022, 9, 11).toLocaleString()
    },
    {
        id: 3,
        name: "ebook",
        category: "electronics",
        description: "sm",
        price: 6500,
        stock: 0,
        imageUrl: null,
        createdAt: new Date(2023, 2, 8).toLocaleString()
    }

]