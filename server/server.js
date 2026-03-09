import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pizzasRoutes from './routes/pizzas.js';
import authRoutes from './routes/auth.js';
import menuRoutes from './routes/menu.js';
import ordersRoutes from './routes/orders.js';
import PaymentsRoutes from './routes/payments.js';
import ingredientsRoutes from "./routes/ingredients.js";
import path from 'path';
import { fileURLToPath } from 'url';
import adminRouter from './routes/admin.js';
import adminOrdersRouter from './routes/adminOrders.js';
import AdminUsersRouter from './routes/AdminUsers.js';

dotenv.config();
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

app.use('/api/admin', adminRouter);
app.use('/api/admin/orders', adminOrdersRouter);
app.use('/api/admin/users', AdminUsersRouter);
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/pizzas', pizzasRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/payments', PaymentsRoutes);
app.use('/api/ingredients', ingredientsRoutes);
app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.listen(process.env.PORT, () => {
  console.log(`Server is running on http://localhost:${process.env.PORT}`);
});
