import { prisma } from "../prisma.js";
import type { z } from "zod";
import {
    getManyProductsInputSchema,
    createProductInputSchema
} from "../schemas/products.schema.js";

type GetManyInput = z.output<typeof getManyProductsInputSchema>;
type CreateInput = z.output<typeof createProductInputSchema>;

export const productsRepository = {
    async getAll(input: GetManyInput) {
        const { category, minPrice, maxPrice, page, limit } = input.query;

        const where = {
            archived: false,
            ...(category ? { category } : {}),
            price: {
                gte: minPrice,
                lte: maxPrice
            }
        };

        const [data, total] = await Promise.all([
            prisma.product.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: "desc" }
            }),
            prisma.product.count({ where })
        ]);

        return {
            data,
            meta: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        };
    },

    async getOne(id: number) {
        return prisma.product.findUnique({
            where: { id }
        });
    },

    async add(input: CreateInput, imageUrl: string | null) {
        return prisma.product.create({
            data: {
                name: input.body.name,
                price: input.body.price,
                category: input.body.category,
                description: input.body.description ?? null,
                imageUrl,
                accountEmail: input.headers.authorization
            }
        });
    },

    async update(
        id: number,
        accountEmail: string,
        body: {
            name?: string;
            price?: number;
            category?: "electronics" | "clothing" | "food" | "other";
            description?: string | null;
            imageUrl?: string;
        }
    ) {
        const product = await prisma.product.findFirst({
            where: { id, accountEmail, archived: false }
        });

        if (!product) {
            const error = new Error("Товар не найден или нет доступа") as Error & {
                code?: string;
            };
            error.code = "404";
            throw error;
        }

        return prisma.product.update({
            where: { id },
            data: body
        });
    }
};