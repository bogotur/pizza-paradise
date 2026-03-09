import express from "express";
import { db } from "../db/connection.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

function makeTxId() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const rnd = Math.floor(10000 + Math.random() * 89999);
  return `FAKE-${y}${m}${day}-${rnd}`;
}

router.post("/fake", auth, async (req, res) => {
  const { orderId, card_last4 } = req.body;

  if (!orderId) return res.status(400).json({ message: "orderId required" });

  try {
    const [rows] = await db.query(
      "SELECT id FROM orders WHERE id = ? AND user_id = ? LIMIT 1",
      [orderId, req.user.id]
    );

    if (rows.length === 0) return res.status(404).json({ message: "Order not found" });

    const tx = makeTxId();

    await db.query(
      "UPDATE orders SET status = 'paid', transaction_id = ?, card_last4 = ? WHERE id = ?",
      [tx, card_last4 || null, orderId]
    );

    res.json({ success: true, transaction_id: tx });
  } catch (err) {
    console.error("Fake payment error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;