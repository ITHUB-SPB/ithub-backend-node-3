import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client/extension";

const connectionString = process.env["DATABASE_URL"];

if (!connectionString) {
  throw new Error("данные для подключения отсутствуют");
}

const adapter = new PrismaBetterSqlite3({ url: connectionString });
export const prisma = new PrismaClient({ adapter });
