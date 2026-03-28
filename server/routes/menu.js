import express from "express";
import { db } from "../db/connection.js";

const router = express.Router();

const PIZZA_SIZES_QUERY = `
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
`;

router.get("/", async (req, res) => {
    try {
        const [results] = await db.query(PIZZA_SIZES_QUERY);

        const groupedPizzas = results.reduce((acc, row) => {
            const { id, name, description, image, category, size_cm, price } = row;

            let pizza = acc.find((p) => p.id === id);

            if (!pizza) {
                pizza = {
                    id,
                    name,
                    description,
                    image,
                    category,
                    sizes: [],
                };
                acc.push(pizza);
            }

            pizza.sizes.push({
                size_cm,
                price: parseFloat(price),
            });

            return acc;
        }, []);

        res.json(groupedPizzas);
    } catch (err) {
        console.error("DB error:", err);
        res.status(500).json({ error: "Database query error" });
    }
});

export default router;