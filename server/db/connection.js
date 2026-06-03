import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

export const db = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false,
        },
      }
    : {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT) || 5432,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl:
          process.env.DB_SSL === "true"
            ? { rejectUnauthorized: false }
            : false,
      }
);

db.connect()
  .then(() => {
    console.log("✅ PostgreSQL connected");
  })
  .catch((err) => {
    console.error("❌ PostgreSQL connection error:", err);
  });