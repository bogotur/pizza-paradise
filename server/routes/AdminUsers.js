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
        u.id,
        u.email,
        u.role,
        u.created_at,
        COUNT(o.id) AS orders_count,
        COALESCE(SUM(o.total), 0) AS total_spent,
        MAX(o.created_at) AS last_order_at
      FROM users u
      LEFT JOIN orders o ON o.user_id = u.id
      GROUP BY u.id, u.email, u.role, u.created_at
      ORDER BY u.id DESC
      `
    );

    res.json(rows);
  } catch (err) {
    console.error("Admin users list error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id", auth, adminOnly, async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid id" });

  try {
    const [users] = await db.query(
      `
      SELECT
        u.id,
        u.email,
        u.role,
        u.created_at,
        COUNT(o.id) AS orders_count,
        COALESCE(SUM(o.total), 0) AS total_spent,
        MAX(o.created_at) AS last_order_at
      FROM users u
      LEFT JOIN orders o ON o.user_id = u.id
      WHERE u.id = ?
      GROUP BY u.id, u.email, u.role, u.created_at
      LIMIT 1
      `,
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const [orders] = await db.query(
      `
      SELECT
        id,
        total,
        status,
        payment_method,
        transaction_id,
        card_last4,
        customer_name,
        customer_phone,
        delivery_address,
        comment,
        created_at
      FROM orders
      WHERE user_id = ?
      ORDER BY id DESC
      `,
      [id]
    );

    res.json({
      user: users[0],
      orders,
    });
  } catch (err) {
    console.error("Admin user details error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.patch("/:id/role", auth, adminOnly, async (req, res) => {
  const id = Number(req.params.id);
  const { role } = req.body;

  if (!id) return res.status(400).json({ message: "Invalid id" });
  if (!["admin", "user"].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  try {
    if (req.user.id === id && role !== "admin") {
      return res.status(400).json({ message: "Не можна забрати роль admin у самого себе" });
    }

    const [admins] = await db.query(
      `SELECT COUNT(*) AS count FROM users WHERE role = 'admin'`
    );

    if (role !== "admin") {
      const [target] = await db.query(
        `SELECT id, role FROM users WHERE id = ? LIMIT 1`,
        [id]
      );

      if (!target.length) {
        return res.status(404).json({ message: "User not found" });
      }

      if (target[0].role === "admin" && Number(admins[0].count) <= 1) {
        return res.status(400).json({ message: "Має залишитися хоча б один admin" });
      }
    }

    const [result] = await db.query(`UPDATE users SET role = ? WHERE id = ?`, [role, id]);

    if (!result.affectedRows) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Admin user role update error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;