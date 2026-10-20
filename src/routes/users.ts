import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";

import { prisma } from "../prisma.js";
import { formatSuccess } from "../middleware/format-result.js";
import {
  createAccountInputSchema,
  createProfileInputSchema,
  updateProfileInputSchema,
} from "../schemas/users.schema.js";
import crypto from "node:crypto";

import multer from "multer";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";
import owns from "../middleware/owns.js";
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

export const usersRouter = Router();

usersRouter.get(
  "/",
  authenticate,
  authorize(["read:any:accounts"]),
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const page = Number(request.query["page"]) || 1;
      const limit = Number(request.query["limit"]) || 10;

      const [total, items] = await Promise.all([
        prisma.account.count(),
        prisma.account.findMany({
          skip: (page - 1) * limit,
          take: limit,
          include: {
            profile: true,
          },
        }),
      ]);

      const data = items.map((account) => ({
        id: account.id,
        email: account.email,
        createdAt: account.createdAt,
        bio: account.profile?.bio ?? null,
        avatar: account.profile?.avatar ?? null,
      }));

      const responseData = {
        data,
        meta: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      };

      formatSuccess(response, responseData, "200");
    } catch (error) {
      next(error);
    }
  },
);

usersRouter.get(
  "/me",
  authenticate,
  async (req: RequestWithAuth, res: Response, next: NextFunction) => {
    try {
      const currentUserId = req.user!.id;

      const account = await prisma.account.findUnique({
        where: { id: currentUserId },
        include: {
          profile: true,
          products: true,
        },
      });

      if (!account) {
        return res
          .status(404)
          .json({ success: false, error: "Профиль не найден" });
      }

      const responseData = {
        id: account.id,
        email: account.email,
        role: account.role,
        createdAt: account.createdAt,
        profile: account.profile
          ? {
              id: account.profile.id,
              bio: account.profile.bio,
              avatar: account.profile.avatar ?? null,
            }
          : null,
        products: account.products.map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          category: p.category,
          description: p.description,
          imageUrl: p.imageUrl,
          archived: p.archived,
          createdAt: p.createdAt,
        })),
      };

      formatSuccess(res, { responseData }, "200");
    } catch (error) {
      next(error);
    }
  },
);

usersRouter.get(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params["id"]);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: "нет такого id" });
      }

      const account = await prisma.account.findUnique({
        where: { id },
        include: { profile: true, products: true },
      });
      if (!account) {
        return res.status(404).json({ error: "пользователь не найден" });
      }

      const data = {
        id: account.id,
        email: account.email,
        createdAt: account.createdAt,
        bio: account.profile?.bio ?? null,
        avatar: account.profile?.avatar ?? null,
        products: account.products.map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          category: p.category,
          imageUrl: p.imageUrl,
          archived: p.archived,
        })),
      };

      formatSuccess(res, { data }, "200");
    } catch (error) {
      next(error);
    }
  },
);

usersRouter.post(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = createAccountInputSchema.parse({
        body: req.body,
      });

      const salt = process.env["SALT"];
      if (!salt) {
        throw new Error("нет соли");
      }
      const hashedPassword = crypto
        .createHmac("sha256", salt)
        .update(input.body.password)
        .digest("hex");
      const account = await prisma.account.create({
        data: {
          email: input.body.email,
          password: hashedPassword,
        },
      });
      const data = {
        id: account.id,
        email: account.email,
      };

      formatSuccess(res, { data }, "201");
    } catch (error) {
      next(error);
    }
  },
);

usersRouter.delete(
  "/:id",
  authenticate,
  authorize(["delete:own:accounts", "delete:any:accounts"]),
  owns("account", "id", "id"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params["id"]);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: "нет такого id" });
      }

      const account = await prisma.account.delete({
        where: { id },
        include: { profile: true, products: true },
      });

      const data = {
        id: account.id,
        email: account.email,
      };
      formatSuccess(res, { data }, "200");
    } catch (error) {
      next(error);
    }
  },
);

usersRouter.post(
  "/:id/profile",
  authenticate,
  authorize(["create:own:accounts"]),
  async (req: RequestWithAuth, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params["id"]);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: "нет такого id" });
      }

      const input = createProfileInputSchema.parse({
        body: req.body,
        params: req.params,
        headers: {
          Authorization:
            req.header("authorization") || req.headers["authorization"],
        },
      });

      if (req.user!.id !== id) {
        return res.status(403).json({ error: "нет прав" });
      }

      const existingProfile = await prisma.profile.findUnique({
        where: { accountId: id },
      });

      if (existingProfile) {
        return res.status(400).json({
          error: "профиль уже существует",
        });
      }

      const newProfile = await prisma.profile.create({
        data: {
          bio: input.body.bio,
          avatar: input.body.avatar ?? null,
          account: {
            connect: { id: id },
          },
        },
      });

      formatSuccess(res, { newProfile }, "201");
    } catch (error) {
      next(error);
    }
  },
);

usersRouter.patch(
  "/:id/profile",
  upload.single("image"),
  authenticate,
  authorize(["edit:own:accounts"]),
  owns("account", "id", "id"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = updateProfileInputSchema.parse({
        body: req.body,
        params: req.params,
        headers: {
          Authorization:
            req.header("authorization") || req.headers["authorization"],
        },
      });

      const id = Number(input.params.id);

      const existing = await prisma.account.findUnique({
        where: { id },
        select: { email: true },
      });

      if (!existing) {
        return res.status(404).json({ error: "не найден" });
      }

      if (existing.email !== input.headers.Authorization) {
        return res.status(403).json({ error: "нет прав" });
      }

      const profileData: {
        bio?: string;
        avatar?: string | null;
      } = {};

      if (input.body.bio !== undefined) profileData.bio = input.body.bio;

      if (req.file) {
        profileData.avatar = `/uploads/${req.file.originalname}`;
      } else if (input.body.avatar !== undefined) {
        profileData.avatar = input.body.avatar;
      }

      const updated = await prisma.account.update({
        where: { id },
        data: {
          profile: {
            upsert: {
              create: {
                bio: profileData.bio ?? "",
                avatar: profileData.avatar ?? null,
              },
              update: profileData,
            },
          },
        },
        include: {
          profile: {
            select: {
              bio: true,
              avatar: true,
            },
          },
        },
      });

      const responseData = {
        id: updated.id,
        email: updated.email,
        bio: updated.profile?.bio ?? null,
        avatar: updated.profile?.avatar ?? null,
      };

      formatSuccess(res, { data: responseData }, "200");
    } catch (error) {
      next(error);
    }
  },
);

//openssl хеш пароля
