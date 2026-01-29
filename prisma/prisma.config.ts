import path from "node:path";
import { defineConfig } from "prisma/config";

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, "schema.prisma"),

  migrate: {
    async adapter() {
      const { Pool } = await import("@neondatabase/serverless");
      const { PrismaNeon } = await import("@prisma/adapter-neon");

      const connectionString = process.env.DATABASE_URL_UNPOOLED;
      if (!connectionString) {
        throw new Error("DATABASE_URL_UNPOOLED is required for migrations");
      }

      const pool = new Pool({ connectionString });
      return new PrismaNeon(pool);
    },
  },
});
