import express from 'express'
import { db } from '../db/connection.js'
import { auth } from '../middleware/auth.js'

const router = express.Router()

router.get('/me', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, email, role FROM users WHERE id = ? LIMIT 1',
      [req.user.id]
    )

    if (rows.length === 0) return res.status(401).json({ message: 'Unauthorized' })
    if (rows[0].role !== 'admin') return res.status(403).json({ message: 'Ви не є адміністратором' })

    res.json({ success: true, admin: { id: rows[0].id, email: rows[0].email } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Помилка сервера' })
  }
})

export default router