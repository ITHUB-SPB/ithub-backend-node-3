import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";

import rateLimit from "express-rate-limit";
import { prisma } from "../prisma.js";
import { formatSuccess } from "../middleware/format-result.js";
import crypto from "node:crypto";
import { createAccountInputSchema } from "../schemas/users.schema.js";
import jwt from "jsonwebtoken";

const jwtSecret = process.env["JWT_SECRET"] || "secret-key";

const authRouter = Router();
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: "лимит на попытки входа",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

authRouter.post(
  "/api/auth/register",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = createAccountInputSchema.parse({
        body: req.body,
      });

      const existingAccount = await prisma.account.findUnique({
        where: { email: input.body.email },
      });

      if (existingAccount) {
        return res.status(400).json({
          success: false,
          error: "такая почта уже есть",
        });
      }
      const salt = process.env["SALT"];
      if (!salt) {
        throw new Error("нет соли");
      }
      const hashedPassword = crypto
        .scryptSync(input.body.password, salt, 64)
        .toString("hex");

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

authRouter.post(
  "/api/auth/login",
  loginLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = createAccountInputSchema.parse({
        body: req.body,
      });

      const account = await prisma.account.findUnique({
        where: { email: input.body.email },
      });

      const authError = () => {
        return res.status(401).json({
          success: false,
          error: "Неверный email или пароль",
        });
      };

      if (!account) {
        return authError();
      }

      const salt = process.env["SALT"];
      if (!salt) {
        throw new Error("нет соли");
      }

      const hashedPassword = crypto
        .scryptSync(input.body.password, salt, 64)
        .toString("hex");

      if (account.password !== hashedPassword) {
        return authError();
      }

      const payload = {
        id: account.id,
        email: account.email,
        role: account.role,
      };

      const accessToken = jwt.sign(payload, jwtSecret, { expiresIn: "15m" });

      const refreshToken = jwt.sign({ id: account.id }, jwtSecret, {
        expiresIn: "7d",
      });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env["NODE_ENV"] === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      const data = {
        accessToken,
        user: {
          id: account.id,
          email: account.email,
          role: account.role,
        },
      };

      formatSuccess(res, { data }, "200");
    } catch (error) {
      next(error);
    }
  },
);

authRouter.post(
  "/api/auth/refresh",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tokenFromCookie = req.cookies?.refreshToken;

      if (!tokenFromCookie) {
        return res.status(401).json({
          success: false,
          error: "нету рефреш токена",
        });
      }

      let decoded: any;
      try {
        decoded = jwt.verify(tokenFromCookie, jwtSecret);
      } catch (err) {
        return res.status(401).json({
          success: false,
          error: "плохой рефреш токен",
        });
      }

      const account = await prisma.account.findUnique({
        where: { id: Number(decoded.id) },
      });

      if (!account) {
        return res.status(401).json({
          success: false,
          error: "пользователь не найден",
        });
      }

      const payload = {
        id: account.id,
        email: account.email,
        role: account.role,
      };

      const accessToken = jwt.sign(payload, jwtSecret, { expiresIn: "15m" });

      const responseData = {
        accessToken,
        user: {
          id: account.id,
          email: account.email,
          role: account.role,
        },
      };

      formatSuccess(res, {responseData}, "200");
    } catch (error) {
      next(error);
    }
  },
);

authRouter.post(
  "/api/auth/logout",
  (req: Request, res: Response, next: NextFunction) => {
    try {
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env["NODE_ENV"] === "production",
        sameSite: "strict",
      });

      formatSuccess(res, {}, "200");

    } catch (error) {
      next(error);
    }
  },
);
