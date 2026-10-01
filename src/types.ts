import * as z from 'zod'
import { metaSchema } from "./schemas/common.schema.js";

export type ErrorWithCode = Error & { code?: `${4 | 5}${number}${number}` }

export type BaseEntity = {
    id: string | number;
}

export type DataWithMeta<T> = {
    data: Partial<T>[],
    meta: z.infer<typeof metaSchema>
}
