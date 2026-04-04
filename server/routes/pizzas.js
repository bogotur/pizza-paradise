import express from "express";
import { db } from "../db/connection.js";

const router = express.Router();

const GET_PIZZA_INGREDIENTS = `
  SELECT
    i.id,
    i.name,
    i.price,
    i.is_available
  FROM pizza_allowed_ingredients pai
  JOIN ingredients i ON i.id = pai.ingredient_id
  WHERE pai.pizza_id = $1
  ORDER BY i.name;
`;

router.get("/:id/ingredients", async (req, res) => {
  const pizzaId = Number(req.params.id);

  if (!pizzaId) {
    return res.status(400).json({ message: "Invalid pizza id" });
  }

  try {
    const { rows } = await db.query(GET_PIZZA_INGREDIENTS, [pizzaId]);
    res.json(rows);
  } catch (err) {
    console.error("Ingredients DB error:", err);
    res.status(500).json({ message: "Database query error" });
  }
});

export default router;