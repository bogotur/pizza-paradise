import React, { useState } from "react";
import axios from "axios";
import { api } from "../../api/api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import PageLoader from "../../components/PageLoader";
import styles from "../../styles/AdminLoginPage.module.css";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError("");
    setLoading(true);

    try {
      const res = await api.post("/api/auth/login", { email, password });

      if (!res.data?.token) {
        setError("Помилка входу");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", res.data.token);

      await api.get("/api/admin/me", {
        headers: { Authorization: `Bearer ${res.data.token}` },
      });

      setTimeout(() => {
        toast.success("Адмін-вхід успішний ✅");
        navigate("/admin", { replace: true });
        setLoading(false);
      }, 1000);
    } catch (err: unknown) {
      localStorage.removeItem("token");

      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Невірні дані або ви не адмін");
      } else {
        setError("Помилка при вході");
      }

      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <PageLoader open={loading} text="Вхід в адмін-панель..." />

      <div className={styles.card}>
        <div className={styles.title}>Адмін-панель</div>
        <div className={styles.subtitle}>Введіть дані адміністратора</div>

        <form className={styles.form} onSubmit={handleLogin}>
          <label className={styles.label}>Email</label>
          <input
            className={styles.input}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@gmail.com"
            required
            disabled={loading}
          />

          <label className={styles.label}>Пароль</label>
          <input
            className={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={loading}
          />

          {error && <div className={styles.error}>{error}</div>}

          <button className={styles.btn} type="submit" disabled={loading}>
            {loading ? "Зачекайте..." : "Увійти"}
          </button>
        </form>
      </div>
    </div>
  );
}