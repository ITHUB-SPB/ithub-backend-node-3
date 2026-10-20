import * as z from "zod";
import { type Request as ExpressRequest } from "express"; // Импортируем правильный тип запроса из Express
import { metaSchema } from "./schemas/common.schema.js";

export type ErrorWithCode = Error & { code?: `${4 | 5}${number}${number}` };

export type BaseEntity = {
  id: string | number;
};

export type DataWithMeta<T> = {
  data: Partial<T>[];
  meta: z.infer<typeof metaSchema>;
};

export type RequestAuth = {
  user?: {
    id: number;
    email: string;
    role: "user" | "moderator";
  };
};

export type RequestWithAuth = ExpressRequest & RequestAuth;
