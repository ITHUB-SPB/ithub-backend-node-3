import * as z from 'zod'
import type { BaseEntity, DataWithMeta } from "../types.js";
import { productSchema, getProductsInputSchema } from '../schema.js'

type Product = z.output<typeof productSchema>

abstract class BaseRepository<T extends BaseEntity, TSync> {
    abstract getAll(input: unknown): TSync extends true ? DataWithMeta<T> : Promise<DataWithMeta<T>>;
    abstract getOne(id: T['id']): TSync extends true ? Partial<T> | undefined : Promise<Partial<T> | undefined>;
    abstract add(record: Omit<T, 'id'>): TSync extends true ? Partial<T> : Promise<Partial<T>>;
    abstract update(id: T['id'], newRecord: Partial<T>): TSync extends true ? Partial<T> : Promise<Partial<T>>;
    abstract delete(id: T['id']): TSync extends true ? void : Promise<void>;
}

export abstract class ProductsRepository<KSync> extends BaseRepository<Product, KSync> {
    abstract override getAll(input: z.output<typeof getProductsInputSchema>['query']): KSync extends true ? DataWithMeta<Product> : Promise<DataWithMeta<Product>>
    abstract override getOne(id: Product['id']): KSync extends true ? Partial<Product> | undefined : Promise<Partial<Product> | undefined>;
    abstract override add(record: Omit<Product, 'id'>): KSync extends true ? Partial<Product> : Promise<Partial<Product>>;
    abstract override update(id: Product['id'], newRecord: Partial<Product>): KSync extends true ? Partial<Product> : Promise<Partial<Product>>;
    abstract override delete(id: Product['id']): KSync extends true ? void : Promise<void>;
}
