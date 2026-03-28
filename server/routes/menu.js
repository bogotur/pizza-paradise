import express from "express";
import pool from "../db.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
          p.id,
          p.name,
          p.description,
          p.image,
          c.name AS category,
          ps.size_cm,
          ps.price
      FROM
          pizzas p
      JOIN
          pizza_sizes ps ON p.id = ps.pizza_id
      JOIN
          categories c ON p.category_id = c.id
      ORDER BY
          p.id, ps.size_cm;
    `);

    const pizzasMap = new Map();

    for (const row of rows) {
      if (!pizzasMap.has(row.id)) {
        pizzasMap.set(row.id, {
          id: row.id,
          name: row.name,
          description: row.description,
          image: row.image,
          category: row.category,
          sizes: [],
        });
      }

      pizzasMap.get(row.id).sizes.push({
        size_cm: row.size_cm,
        price: Number(row.price),
      });
    }

    res.json(Array.from(pizzasMap.values()));
  } catch (error) {
    console.error("DB error:", error);
    res.status(500).json({ error: "Database query error" });
  }
});

export default router;