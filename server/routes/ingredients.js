import express from "express";
import { db } from "../db/connection.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { rows } = await db.query(
      `
      SELECT id, name
      FROM ingredients
      WHERE is_available = TRUE
      ORDER BY name ASC
      `
    );

    res.json(rows);
  } catch (err) {
    console.error("Ingredients list error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;