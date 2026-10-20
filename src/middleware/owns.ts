import { type NextFunction, type Response } from "express";
import { prisma } from "../prisma.js";
import { type RequestWithAuth } from "../types.js";

type Resource = "account" | "product";

export default function owns(
  resource: Resource,
  routeParamName: string,
  dbFieldName: string,
) {
  return async (
    request: RequestWithAuth,
    response: Response,
    next: NextFunction,
  ) => {
    try {
      const currentUser = request.user;
      if (!currentUser) {
        return response.status(401).json({ error: "авторизируйся" });
      }

      if (currentUser.role === "moderator") {
        return next();
      }

      const paramValue = request.params[routeParamName];
      if (!paramValue) {
        return response
          .status(400)
          .json({ error: `параметра пути ${routeParamName} нету` });
      }

      const stringParam = Array.isArray(paramValue)
        ? paramValue[0]
        : paramValue;

      if (!stringParam) {
        return response.status(400).json({ error: "параметр пустой" });
      }

      const maybeNumber = Number(stringParam);
      const parsedValue = Number.isNaN(maybeNumber) ? stringParam : maybeNumber;

      const dbModel = (prisma as any)[resource];
      if (!dbModel) {
        return response
          .status(500)
          .json({ error: `модель призмы${resource} не найдена` });
      }

      const record = await dbModel.findUnique({
        where: { [dbFieldName]: parsedValue },
      });

      if (!record) {
        return response.status(404).json({ error: "в бд нету" });
      }

      let hasRights = false;

      if (resource === "account") {
        hasRights = record.email === currentUser.email;
      } else if (resource === "product") {
        hasRights = record.accountId === currentUser.id;
      }

      if (!hasRights) {
        return response.status(403).json({
          error: "нет прав",
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
