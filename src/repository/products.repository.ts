import * as z from "zod";

import { ProductsRepository } from "./abstract.js";
import {
  productSchema,
  getProductsInputSchema,
  getProductsWithMetaOutputSchema,
  getProductOutputSchema,
  createProductInputSchema,
} from "../schemas/products.schema.js";

import { products } from "../data.js";
import { prisma } from "../prisma.js";

type Product = z.output<typeof productSchema>;

class ProductsRepositorySqlite extends ProductsRepository<false> {
  override add(
    record: z.output<typeof createProductInputSchema>,
  ): Promise<z.output<typeof getProductOutputSchema>> {
    try {
      return await prisma.product.create({
        data: {
          ...record.body,
          account: { connect: { email: record.headers.Authorization } },
        },
        include: {
          account: true,
        },
      });
    } catch(error){
        throw error
    }
  }
}

class ProductsRepositoryLocal extends ProductsRepository<true> {
  private products: Product[];

  constructor() {
    super();
    this.products = products;
  }

  override getAll(
    input: z.output<typeof getProductsInputSchema>,
  ): z.output<typeof getProductsWithMetaOutputSchema> {
    const filteredData = this.products.filter((product) => {
      if (product.category && product.category !== input.query.category) {
        return false;
      }
      return (
        product.price >= input.query.minPrice &&
        product.price <= input.query.maxPrice
      );
    });

    const paginatedData = filteredData.slice(
      (input.query.page - 1) * input.query.limit,
      input.query.page * input.query.limit,
    );

    const meta = {
      total: this.products.length,
      page: input.query.page,
      limit: input.query.limit,
      pages: Math.ceil(this.products.length / input.query.limit),
    } as const;

    return { data: paginatedData, meta };
  }

  override getOne(id: number): Partial<Product> | undefined {
    const record = this.products.find((product) => product.id === id);

    if (!record) {
      throw new Error("Record not found");
    }

    return record;
  }

  override add(record: Omit<Product, "id" | "createdAt">): Partial<Product> {
    const lastId = this.products.at(-1)?.id ?? 0;
    this.products.push({
      ...record,
      id: lastId + 1,
      createdAt: new Date().toLocaleString(),
    });

    return this.products.at(-1)!;
  }

  override update(id: number, newRecord: Partial<Product>): Partial<Product> {
    const record = this.getOne(id);

    if (!record) {
      throw new Error("Record not found");
    }

    return Object.assign(record, newRecord);
  }

  override delete(id: number): void {
    const recordIndex = this.products.findIndex((product) => product.id === id);

    if (recordIndex === -1) {
      throw new Error("Record not found");
    }

    this.products.splice(recordIndex, 1);
  }
}

export const productsRepository = process.env.DEBUG
  ? new ProductsRepositoryLocal()
  : new ProductsRepositoryLocal();
