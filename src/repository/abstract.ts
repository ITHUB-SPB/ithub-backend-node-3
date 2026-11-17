import * as z from 'zod'
import { 
    productSchema, 
    getProductOutputSchema, 
    getProductsInputSchema, 
    createProductInputSchema,
    updateProductInputSchema,
    getProductsWithMetaOutputSchema 
} from '../schemas/products.schema.js'

type Product = z.output<typeof productSchema>
type GetProductOutput = z.output<typeof getProductOutputSchema>
type ProductsWithMetaOutput = z.output<typeof getProductsWithMetaOutputSchema>

abstract class BaseRepository<T, TSync> {
    abstract getAll(input: any): TSync extends true ? any : Promise<any>;
    abstract getOne(id: T): TSync extends true ? any : Promise<any>;
    abstract add(record: any): TSync extends true ? any : Promise<any>;
    abstract update(id: T, record: any): TSync extends true ? any : Promise<any>;
    abstract delete(id: T): TSync extends true ? void : Promise<void>;
}

export abstract class ProductsRepository<KSync> extends BaseRepository<Product['id'], KSync> {
    abstract override getAll(input: z.output<typeof getProductsInputSchema>): KSync extends true ? ProductsWithMetaOutput : Promise<ProductsWithMetaOutput>
    
    abstract override getOne(id: Product['id']): KSync extends true ? GetProductOutput | undefined : Promise<GetProductOutput | undefined>;
    
    abstract override add(
        record: z.output<typeof createProductInputSchema> & { imageUrl?: string | null }
    ): KSync extends true ? Partial<Product> : Promise<Partial<Product>>;
    
    abstract override update(
        id: Product['id'], 
        record: z.output<typeof updateProductInputSchema>
    ): KSync extends true ? GetProductOutput : Promise<GetProductOutput>;
    
    abstract override delete(id: Product['id']): KSync extends true ? void : Promise<void>;
}