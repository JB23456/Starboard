import { existsSync, writeFileSync } from "node:fs";
import process from "node:process";

if (!process.env.DATABASE_URL && !existsSync(".env")) {
  writeFileSync(".env", 'DATABASE_URL="file:./production.db"\n');
  console.log("No .env found - created one with the default production database URL.");
}
