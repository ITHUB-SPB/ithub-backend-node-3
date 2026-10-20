import { type NextFunction, type Response } from "express";
import { type RequestWithAuth } from "../types.js";
import jwt from "jsonwebtoken";

const jwtSecret = process.env["JWT_SECRET"] || "secret-key";

export default async function authenticate(
  request: RequestWithAuth,
  response: Response,
  next: NextFunction,
) {
  try {
    const authHeader = request.header("authorization");

    if (!authHeader) {
      return response.status(401).json({
        success: false,
        error: "нет авторизации",
      });
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    if (!token) {
      return response.status(401).json({
        success: false,
        error: "в хедере нет токена",
      });
    }

    try {
      const decoded = jwt.verify(token, jwtSecret) as {
        id: number;
        email: string;
        role: "user" | "moderator";
      };

      request.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      };

      next();
    } catch (jwtError) {
      return response.status(401).json({
        success: false,
        error:
          "рефрешни токен",
      });
    }
  } catch (error) {
    next(error);
  }
}
