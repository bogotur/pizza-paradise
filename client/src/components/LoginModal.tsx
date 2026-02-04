import React, { useState, useContext } from "react";
import axios from "axios";
import styles from "../styles/LoginModal.module.css";
import RegisterModal from "./RegisterModal";
import { AuthContext } from "../context/AuthContext";

interface Props {
  onClose: () => void;
}

const LoginModal: React.FC<Props> = ({ onClose }) => {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });

      console.log("LOGIN RESPONSE:", res.data);

      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        login({ email }); // оновлюємо контекст
        onClose();
      } else {
        setError(res.data.message || "Помилка входу");
      }
    } catch (err) {
      console.error(err);
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Помилка входу");
      } else {
        setError("Невідома помилка");
      }
    }
  };

  return (
    <>
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.loginCard} onClick={(e) => e.stopPropagation()}>
          <button className={styles.close} onClick={onClose}>✕</button>

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
            />

            <label>Пароль</label>
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && <p className={styles.error}>{error}</p>}

            <button type="submit" className={styles.loginBtn}>Увійти</button>
          </form>

          <p className={styles.registerText}>
            Немає акаунту? <span onClick={() => setIsRegisterOpen(true)}>Зареєструватися</span>
          </p>

          <p className={styles.back} onClick={onClose}>Повернутися назад</p>
        </div>
      </div>

      {isRegisterOpen && <RegisterModal onClose={() => setIsRegisterOpen(false)} />}
    </>
  );
};

export default LoginModal;
