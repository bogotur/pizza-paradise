import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/connection.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Заповніть всі поля' });
  }

  try {
    const { rows: existing } = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Користувач вже існує' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      'INSERT INTO users (email, password) VALUES ($1, $2)',
      [email, hashedPassword]
    );

    res.json({ message: 'Користувача створено' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Заповніть всі поля' });
  }

  try {
    const { rows: users } = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: 'Користувача не знайдено' });
    }

    const user = users[0];
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(400).json({ message: 'Невірний пароль' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, email, role, created_at FROM users WHERE id = $1 LIMIT 1`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Auth me error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;