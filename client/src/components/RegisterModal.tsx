import React, { useContext, useState } from 'react';
import axios from 'axios';
import { api } from '../api/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import styles from '../styles/LoginModal.module.css';

interface Props {
  onClose: () => void;
  onBackToLogin?: () => void;
}

const RegisterModal: React.FC<Props> = ({ onClose, onBackToLogin }) => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const finishAuth = (userEmail: string, token: string) => {
    login({ email: userEmail }, token);

    setSuccess(true);
    toast.success("Акаунт успішно створено 🎉");

    setTimeout(() => {
      onClose();
      navigate('/');
    }, 2300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setError('Введіть email');
      return;
    }

    if (password.length < 6) {
      setError('Пароль має містити щонайменше 6 символів');
      return;
    }

    if (password !== confirmPassword) {
      setError('Паролі не збігаються');
      return;
    }

    try {
      setLoading(true);

      const registerRes = await api.post('/api/auth/register', {
        email: trimmedEmail,
        password,
      });

      if (registerRes.data?.token) {
        finishAuth(
          registerRes.data?.user?.email || trimmedEmail,
          registerRes.data.token
        );
        return;
      }

      const loginRes = await api.post('/api/auth/login', {
        email: trimmedEmail,
        password,
      });

      if (loginRes.data?.token) {
        finishAuth(
          loginRes.data?.user?.email || trimmedEmail,
          loginRes.data.token
        );
        return;
      }

      setError('Реєстрація пройшла, але не вдалося авторизуватись');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message || 'Помилка реєстрації';
        setError(msg);
        toast.error(msg);
      } else {
        setError('Невідома помилка');
        toast.error('Невідома помилка');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.overlay}>
        <div className={styles.loginCard}>
          <div className={styles.successWrapper}>
            <div className={styles.successIcon}></div>

            <h1 className={styles.title}>Готово!</h1>
            <p className={styles.subtitle}>Акаунт успішно створено</p>

            <div className={styles.successBar}>
              <div className={styles.successBarFill}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.loginCard} onClick={(e) => e.stopPropagation()}>
        <button className={styles.close} onClick={onClose} disabled={loading}>
          ✕
        </button>

        <h1 className={styles.title}>Реєстрація</h1>
        <p className={styles.subtitle}>Створіть новий акаунт</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label>Email</label>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />

          <label>Пароль</label>
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />

          <label>Підтвердіть пароль</label>
          <input
            type="password"
            placeholder="Підтвердіть пароль"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
          />

          {error && <p className={styles.error}>{error}</p>}

          <button className={styles.loginBtn} disabled={loading}>
            {loading ? 'Реєстрація...' : 'Зареєструватися'}
          </button>
        </form>

        <p className={styles.back} onClick={onBackToLogin}>
          Уже є акаунт? Увійти
        </p>
      </div>
    </div>
  );
};

export default RegisterModal;