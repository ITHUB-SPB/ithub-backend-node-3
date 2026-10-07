import { Router, type Request, type Response } from "express";
import * as z from "zod";

import { productsRepository } from "../repository/products.repository.js";
import { formatSuccess } from "../middleware/format-result.js";
import {
  getProductsInputSchema,
  getProductsWithMetaOutputSchema,
} from "../schemas/products.schema.js";
import { prisma } from "../prisma.js";
import multer from 'multer';
import path from 'path';

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Only JPEG and PNG are allowed'));
    }
    cb(null, true);
  },
});

export const productsRouter = Router();

productsRouter.get("/", (request: Request, response: Response, next) => {
  try {
    const input = z.parse(getProductsInputSchema, request);
    const { data, meta } = productsRepository.getAll(input);

    const responseData = getProductsWithMetaOutputSchema.parse({
      data,
      meta,
    });

    formatSuccess(response, responseData, "200");
  } catch (error) {
    next(error);
  }
});

productsRouter.get("/:id", async (req, res) => {
  const product_id = parseInt(req.params["id"] as string, 10);
  const product = await prisma.product.findUnique({
    where: { id: product_id },
    include: {
      account: {
        select: {
          email: true,
          profile: {
            select: { bio: true, avatar: true },
          },
        },
      },
    },
  });
  if (!product) {
    return res.status(404).json({ error: "не нашел" });
  }
  return res.json({ data: product });
});
