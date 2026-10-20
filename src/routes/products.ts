import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";

import multer from "multer";

import { prisma } from "../prisma.js";
import { formatSuccess } from "../middleware/format-result.js";
import {
  createProductInputSchema,
  updateProductInputSchema,
  getProductOutputSchema,
  getProductsInputSchema,
  getProductsWithMetaOutputSchema,
} from "../schemas/products.schema.js";
import authenticate from "../middleware/authenticate.js";
import type { RequestWithAuth } from "../types.js";

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("только jpeg и png формат"));
    }
    cb(null, true);
  },
});

export const productsRouter = Router();

productsRouter.get(
  "/",
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const input = getProductsInputSchema.parse(request);
      const { category, minPrice, maxPrice, page, limit } = input.query;

      const where: {
        category?: "electronics" | "clothing" | "food" | "other";
        price?: { gte?: number; lte?: number };
      } = {};

      if (category) where.category = category;
      if (minPrice !== undefined || maxPrice !== undefined) {
        where.price = {};
        if (minPrice !== undefined) where.price.gte = minPrice;
        if (maxPrice !== undefined) where.price.lte = maxPrice;
      }

      const [total, items] = await Promise.all([
        prisma.product.count({ where }),
        prisma.product.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          include: {
            account: {
              select: {
                email: true,
                profile: { select: { bio: true, avatar: true } },
              },
            },
          },
        }),
      ]);

      const data = items.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        category: p.category,
        description: p.description,
        imageUrl: p.imageUrl,
        archived: p.archived,
        createdAt: p.createdAt,
        accountId: p.accountId,
        accountEmail: p.account.email,
        bio: p.account.profile?.bio ?? null,
        avatar: p.account.profile?.avatar ?? null,
      }));

      const responseData = getProductsWithMetaOutputSchema.parse({
        data,
        meta: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      });

      formatSuccess(response, responseData, "200");
    } catch (error) {
      next(error);
    }
  },
);

productsRouter.get(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params["id"]);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: "нет такого id" });
      }

      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          account: {
            select: {
              email: true,
              profile: { select: { bio: true, avatar: true } },
            },
          },
        },
      });

      if (!product) {
        return res.status(404).json({ error: "продукт не найден" });
      }

      const data = {
        id: product.id,
        name: product.name,
        price: product.price,
        category: product.category,
        description: product.description,
        imageUrl: product.imageUrl,
        archived: product.archived,
        createdAt: product.createdAt,
        accountId: product.accountId,
        accountEmail: product.account.email,
        bio: product.account.profile?.bio ?? null,
        avatar: product.account.profile?.avatar ?? null,
      };

      const validated = getProductOutputSchema.parse(data);
      formatSuccess(res, { data: validated }, "200");
    } catch (error) {
      next(error);
    }
  },
);

productsRouter.post(
  "/",
  authenticate,
  upload.single("image"),
  async (req: RequestWithAuth, res: Response, next: NextFunction) => {
    try {
      const input = createProductInputSchema.parse({
        body: req.body,
        headers: req.headers,
      });

      const imageUrl = req.file ? `/uploads/${req.file.originalname}` : null;

      const product = await prisma.product.create({
        data: {
          name: input.body.name,
          price: input.body.price,
          category: input.body.category,
          description: input.body.description ?? null,
          imageUrl,
          account: { connect: { email: req.user!.email } },
        },
        include: {
          account: {
            select: {
              email: true,
              profile: { select: { bio: true, avatar: true } },
            },
          },
        },
      });

      const data = {
        id: product.id,
        name: product.name,
        price: product.price,
        category: product.category,
        description: product.description,
        imageUrl: product.imageUrl,
        archived: product.archived,
        createdAt: product.createdAt,
        accountId: product.accountId,
        accountEmail: product.account.email,
        bio: product.account.profile?.bio ?? null,
        avatar: product.account.profile?.avatar ?? null,
      };

      const validated = getProductOutputSchema.parse(data);
      formatSuccess(res, { data: validated }, "201");
    } catch (error) {
      next(error);
    }
  },
);

productsRouter.patch(
  "/:id",authenticate,
  upload.single("image"),
  async (req: RequestWithAuth, res: Response, next: NextFunction) => {
    try {
      const input = updateProductInputSchema.parse({
        body: req.body,
        headers: req.headers,
        params: req.params,
      });

      const id = input.params.id;

      const existing = await prisma.product.findUnique({
        where: { id },
        select: { account: { select: { email: true } } },
      });

      if (!existing) {
        return res.status(404).json({ error: "не найден" });
      }

      if (existing.account.email !== req.user!.email) {
        return res.status(403).json({ error: "нет прав" });
      }


      const data: {
        name?: string;
        price?: number;
        category?: "electronics" | "clothing" | "food" | "other";
        description?: string;
        imageUrl?: string;
      } = {};

      if (input.body.name !== undefined) data.name = input.body.name;
      if (input.body.price !== undefined) data.price = input.body.price;
      if (input.body.category !== undefined)
        data.category = input.body.category;
      if (input.body.description !== undefined)
        data.description = input.body.description;
      if (req.file) data.imageUrl = `/uploads/${req.file.originalname}`;

      const updated = await prisma.product.update({
        where: { id },
        data,
        include: {
          account: {
            select: {
              email: true,
              profile: { select: { bio: true, avatar: true } },
            },
          },
        },
      });

      const responseData = {
        id: updated.id,
        name: updated.name,
        price: updated.price,
        category: updated.category,
        description: updated.description,
        imageUrl: updated.imageUrl,
        archived: updated.archived,
        createdAt: updated.createdAt,
        accountId: updated.accountId,
        accountEmail: updated.account.email,
        bio: updated.account.profile?.bio ?? null,
        avatar: updated.account.profile?.avatar ?? null,
      };

      const validated = getProductOutputSchema.parse(responseData);
      formatSuccess(res, { data: validated }, "200");
    } catch (error) {
      next(error);
    }
  },
);
