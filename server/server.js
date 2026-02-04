import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pizzasRoutes from './routes/pizzas.js';
import authRoutes from './routes/auth.js';
import menuRoutes from './routes/menu.js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/pizzas', pizzasRoutes);
app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.listen(process.env.PORT, () => {
  console.log(`Server is running on http://localhost:${process.env.PORT}`);
});
