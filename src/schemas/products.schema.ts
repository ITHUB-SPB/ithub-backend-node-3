import * as z from "zod";
import { metaSchema } from "./common.schema.js";

export const createProductInputSchema = z.object({
  body: z.strictObject({
    name: z.string().min(2).max(100),
    price: z.coerce.number().positive(),
    category: z.enum(["electronics", "clothing", "food", "other"]),
    description: z.optional(z.string().max(500)),
  }),
  headers: z.looseObject({
    Authorization: z.email(),
  }),
});

export const productSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  price: z.number(),
  category: z.enum(["electronics", "clothing", "food", "other"]),
  description: z.string().nullable(),
  imageUrl: z.string().nullable(),
  archived: z.boolean(),
  createdAt: z.date(),
  accountId: z.number().int().positive(),
});

export const getProductOutputSchema = productSchema.extend({
  accountEmail: z.email(),
  bio: z.string().nullable(),
  avatar: z.string().nullable(),
});



export const getProductsInputSchema = z.object({
  query: z.object({
    category: z.enum(["electronics", "clothing", "food", "other"]).optional(),
    minPrice: z.coerce.number().nonnegative().optional(),
    maxPrice: z.coerce.number().positive().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().default(10),
  }),
});

export const updateProductInputSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    price: z.coerce.number().positive().optional(),
    category: z.enum(["electronics", "clothing", "food", "other"]).optional(),
    description: z.string().max(500).optional(),
  }),
  headers: z.looseObject({
    Authorization: z.email(),
  }),
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

export const getProductsOutputSchema = z.array(getProductOutputSchema);

export const getProductsWithMetaOutputSchema = z.object({
  data: getProductsOutputSchema,
  meta: metaSchema,
});
