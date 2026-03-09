import express from "express";
import { db } from "../db/connection.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

function adminOnly(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin only" });
  }
  next();
}

router.get("/", auth, adminOnly, async (req, res) => {
  try {
    const [rows] = await db.query(
      `
      SELECT
        o.id,
        o.user_id,
        u.id AS user_db_id,
        u.email,
        u.role AS user_role,
        o.total,
        o.status,
        o.payment_method,
        o.transaction_id,
        o.card_last4,
        o.customer_name,
        o.customer_phone,
        o.delivery_address,
        o.comment,
        o.created_at
      FROM orders o
      LEFT JOIN users u ON u.id = o.user_id
      ORDER BY o.id DESC
      `
    );

    res.json(rows);
  } catch (err) {
    console.error("Admin orders list error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id", auth, adminOnly, async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid id" });

  try {
    const [orders] = await db.query(
      `
      SELECT
        o.*,
        u.id AS user_db_id,
        u.email,
        u.role AS user_role
      FROM orders o
      LEFT JOIN users u ON u.id = o.user_id
      WHERE o.id = ?
      LIMIT 1
      `,
      [id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: "Not found" });
    }

    const [items] = await db.query(
      `SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC`,
      [id]
    );

    if (items.length === 0) {
      return res.json({ order: orders[0], items: [] });
    }

    const itemIds = items.map((x) => x.id);

    const [ings] = await db.query(
      `
      SELECT
        oii.order_item_id,
        i.id,
        i.name
      FROM order_item_ingredients oii
      JOIN ingredients i ON i.id = oii.ingredient_id
      WHERE oii.order_item_id IN (?)
      ORDER BY oii.order_item_id ASC, i.name ASC
      `,
      [itemIds]
    );

    const map = new Map();
    for (const row of ings) {
      if (!map.has(row.order_item_id)) map.set(row.order_item_id, []);
      map.get(row.order_item_id).push({ id: row.id, name: row.name });
    }

    const itemsWithIngredients = items.map((it) => ({
      ...it,
      ingredients: map.get(it.id) || [],
    }));

    res.json({ order: orders[0], items: itemsWithIngredients });
  } catch (err) {
    console.error("Admin order details error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.patch("/:id/status", auth, adminOnly, async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body;

  const allowed = ["pending", "paid", "cooking", "delivering", "done", "canceled"];
  if (!id) return res.status(400).json({ message: "Invalid id" });
  if (!allowed.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {
    await db.query(`UPDATE orders SET status = ? WHERE id = ?`, [status, id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Admin order status error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", auth, adminOnly, async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid id" });

  try {
    const [r] = await db.query("DELETE FROM orders WHERE id = ?", [id]);

    if (!r.affectedRows) return res.status(404).json({ message: "Not found" });

    res.json({ success: true });
  } catch (err) {
    console.error("Admin order delete error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;