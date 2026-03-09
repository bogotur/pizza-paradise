import React, { useState, useContext } from "react";
import axios from "axios";
import toast from "react-hot-toast";

import styles from "../styles/LoginModal.module.css";
import RegisterModal from "./RegisterModal";
import { AuthContext } from "../context/AuthContext";

import PageLoader from "./PageLoader";

interface Props {
  onClose: () => void;
}

const LoginModal: React.FC<Props> = ({ onClose }) => {
  const { login } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setError("");
    setIsLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });

      if (res.data.token) {
        localStorage.setItem("token", res.data.token);

        login({ email });

        setTimeout(() => {
          toast.success("Авторизація успішна!");
          onClose();
          setIsLoading(false);
        }, 1000);

        return;
      }

      setError(res.data.message || "Помилка входу");
      setIsLoading(false);
    } catch (err) {
      console.error(err);
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Помилка входу");
      } else {
        setError("Невідома помилка");
      }
      setIsLoading(false);
    }
  };

  return (
    <>
      <PageLoader open={isLoading} text="Вхід..." />

      <div className={styles.overlay} onClick={() => !isLoading && onClose()}>
        <div className={styles.loginCard} onClick={(e) => e.stopPropagation()}>
          <button className={styles.close} onClick={() => !isLoading && onClose()} disabled={isLoading}>
            ✕
          </button>

          <h1 className={styles.title}>Вхід</h1>
          <p className={styles.subtitle}>Введіть ваші дані для входу</p>

          <form className={styles.form} onSubmit={handleSubmit}>
            <label>Email</label>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />

            <label>Пароль</label>
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />

            {error && <p className={styles.error}>{error}</p>}

            <button type="submit" className={styles.loginBtn} disabled={isLoading}>
              {isLoading ? "Зачекайте..." : "Увійти"}
            </button>
          </form>

          <p className={styles.registerText}>
            Немає акаунту?{" "}
            <span onClick={() => !isLoading && setIsRegisterOpen(true)}>
              Зареєструватися
            </span>
          </p>

          <p className={styles.back} onClick={() => !isLoading && onClose()}>
            Повернутися назад
          </p>
        </div>
      </div>

      {isRegisterOpen && <RegisterModal onClose={() => setIsRegisterOpen(false)} />}
    </>
  );
};

export default LoginModal;