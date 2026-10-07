import * as z from "zod";
import { metaSchema } from "./common.schema.js";

export const createProductInputSchema = z.object({
  body: z.strictObject({
    name: z.string().min(2).max(100),
    price: z.number().positive(),
    category: z.enum(["electronics", "clothing", "food", "other"]),
    stock: z.number().positive().int(),
    description: z.nullable(z.string().max(500)),
    imageUrl: z.nullable(z.url()),
  }),
  headers: z.looseObject({
    Authorization: z.email()
  })
});

export const productSchema = createProductInputSchema.extend({
  id: z.number().positive().int(),
  accountId: z.number().positive().int(),
  archived: z.boolean(),
  createdAt: z.date(),
});

export const getProductOutputSchema = productSchema.extend({
  accountEmail: z.email(),
  bio: z.string().optional(),
  avatar: z.string().optional(),
});
export const getProductsInputSchema = z.object({
  query: z.object({
    category: z.optional(
      z.literal(["electronics", "clothing", "food", "other"]),
    ),
    minPrice: z
      .optional(z.number().positive())
      .default(-Number.MAX_SAFE_INTEGER),
    maxPrice: z
      .optional(z.number().positive())
      .default(Number.MAX_SAFE_INTEGER),
    page: z.optional(z.number().positive().int()).default(1),
    limit: z.optional(z.number().positive().int()).default(10),
  }),
});

export const getProductsOutputSchema = z.array(productSchema);

export const getProductsWithMetaOutputSchema = z.object({
  data: getProductsOutputSchema,
  meta: metaSchema,
});
