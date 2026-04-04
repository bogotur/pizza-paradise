import express from "express";
import { db } from "../db/connection.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

const normalizePhone = (value = "") => String(value).replace(/[^\d+]/g, "").trim();

const isValidName = (value = "") => {
  const trimmed = String(value).trim();

  if (trimmed.length < 2 || trimmed.length > 50) return false;

  const nameRegex = /^[A-Za-zА-Яа-яІіЇїЄєҐґ'`\-\s]+$/;
  return nameRegex.test(trimmed);
};

const isValidPhone = (value = "") => {
  const normalized = normalizePhone(value);
  const digitsOnly = normalized.replace(/\D/g, "");

  if (digitsOnly.length < 10 || digitsOnly.length > 12) return false;

  const uaPhoneRegex = /^(\+380\d{9}|380\d{9}|0\d{9})$/;
  return uaPhoneRegex.test(normalized);
};

const isValidAddress = (value = "") => {
  const trimmed = String(value).trim();

  if (trimmed.length < 8 || trimmed.length > 120) return false;

  const hasLetters = /[A-Za-zА-Яа-яІіЇїЄєҐґ]/.test(trimmed);
  const hasNumber = /\d/.test(trimmed);

  return hasLetters && hasNumber;
};

const toMoney = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return null;
  return Number(num.toFixed(2));
};

router.get("/my", auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `
      SELECT
        id,
        total,
        status,
        created_at,
        transaction_id,
        payment_method,
        card_last4,
        delivery_address,
        comment
      FROM orders
      WHERE user_id = $1
      ORDER BY id DESC
      `,
      [req.user.id]
    );

    res.json(rows);
  } catch (err) {
    console.error("My orders error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/my/:id", auth, async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid id" });

  try {
    const { rows: orders } = await db.query(
      `SELECT *
       FROM orders
       WHERE id = $1 AND user_id = $2
       LIMIT 1`,
      [id, req.user.id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: "Not found" });
    }

    const { rows: items } = await db.query(
      `SELECT * FROM order_items WHERE order_id = $1 ORDER BY id ASC`,
      [id]
    );

    if (items.length === 0) {
      return res.json({ order: orders[0], items: [] });
    }

    const itemIds = items.map((x) => x.id);

    const { rows: ings } = await db.query(
      `
      SELECT
        oii.order_item_id,
        i.id,
        i.name
      FROM order_item_ingredients oii
      JOIN ingredients i ON i.id = oii.ingredient_id
      WHERE oii.order_item_id = ANY($1::int[])
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
    console.error("My order details error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", auth, async (req, res) => {
  const {
    customer_name,
    customer_phone,
    delivery_address,
    comment,
    items,
  } = req.body;

  const safeName = String(customer_name || "").trim();
  const safePhone = normalizePhone(customer_phone || "");
  const safeAddress = String(delivery_address || "").trim();
  const safeComment = comment ? String(comment).trim().slice(0, 250) : null;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Кошик порожній" });
  }

  if (!isValidName(safeName)) {
    return res.status(400).json({ message: "Введіть коректне ім’я" });
  }

  if (!isValidPhone(safePhone)) {
    return res.status(400).json({ message: "Введіть коректний номер телефону" });
  }

  if (!isValidAddress(safeAddress)) {
    return res.status(400).json({ message: "Вкажіть коректну адресу доставки" });
  }

  const normalizedItems = [];
  let total = 0;

  for (const it of items) {
    const pizzaId = Number(it.pizzaId);
    const sizeCm = Number(it.size_cm);
    const quantity = Number(it.quantity);
    const basePrice = toMoney(it.basePrice);
    const ingredientsPrice = toMoney(it.ingredientsPrice || 0);
    const unitPrice = toMoney(it.unit_price);
    const subtotal = toMoney(it.subtotal);

    const ingredientIds = Array.isArray(it.ingredientIds)
      ? [...new Set(it.ingredientIds.map(Number).filter((x) => Number.isInteger(x) && x > 0))]
      : [];

    normalizedItems.push({
      pizzaId,
      size_cm: sizeCm,
      quantity,
      basePrice,
      ingredientsPrice,
      unit_price: unitPrice,
      subtotal,
      ingredientIds,
      name: it.name,
      image: it.image,
    });

    total = Number((total + subtotal).toFixed(2));
  }

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const orderResult = await client.query(
      `INSERT INTO orders (
         user_id, total, status, payment_method, transaction_id,
         customer_name, customer_phone, delivery_address, comment
       )
       VALUES ($1, $2, 'pending', 'card', NULL, $3, $4, $5, $6)
       RETURNING id`,
      [
        req.user.id,
        total,
        safeName,
        safePhone,
        safeAddress,
        safeComment,
      ]
    );

    const orderId = orderResult.rows[0].id;

    for (const it of normalizedItems) {
      const itemResult = await client.query(
        `INSERT INTO order_items (
           order_id, pizza_id, name, image, size_cm, qty,
           base_price, ingredients_price, unit_price, subtotal
         )
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         RETURNING id`,
        [
          orderId,
          it.pizzaId,
          it.name,
          it.image,
          it.size_cm,
          it.quantity,
          it.basePrice,
          it.ingredientsPrice,
          it.unit_price,
          it.subtotal,
        ]
      );

      const orderItemId = itemResult.rows[0].id;

      for (const ingId of it.ingredientIds) {
        await client.query(
          `INSERT INTO order_item_ingredients (order_item_id, ingredient_id)
           VALUES ($1, $2)`,
          [orderItemId, ingId]
        );
      }
    }

    await client.query("COMMIT");
    res.json({ success: true, orderId });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Create order error:", err);
    res.status(500).json({ message: "Помилка сервера" });
  } finally {
    client.release();
  }
});

export default router;