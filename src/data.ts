import * as z from 'zod'
import { getProductOutputSchema } from "./schemas/products.schema.js"

export const products: z.output<typeof getProductOutputSchema>[] = [
    {
        id: 1,
        name: "bloose",
        category: "clothing",
        description: "xl",
        price: 4200,
        imageUrl: null,
        accountEmail: "test@example.com",
        archived: false,
        createdAt: new Date(2022, 8, 10)
    },
    {
        id: 2,
        name: "jacket",
        category: "clothing",
        description: "sm",
        price: 13100,
        imageUrl: null,
        accountEmail: "test2@example.com",
        archived: false,
        createdAt: new Date(2022, 9, 11)
    },
    {
        id: 3,
        name: "ebook",
        category: "electronics",
        description: "sm",
        price: 6500,
        imageUrl: null,
        accountEmail: "test@example.com",
        archived: false,
        createdAt: new Date(2023, 2, 8)
    }
]