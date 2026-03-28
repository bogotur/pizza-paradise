import React, { useContext, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import RegisterModal from './RegisterModal';
import styles from '../styles/LoginModal.module.css';

interface Props {
  onClose: () => void;
}

const LoginModal: React.FC<Props> = ({ onClose }) => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [showRegister, setShowRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);

      const res = await axios.post('http://localhost:5000/api/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });

      if (res.data?.token) {
        login(
          { email: res.data?.user?.email || email.trim().toLowerCase() },
          res.data.token
        );

        toast.success('Успішний вхід');

        setTimeout(() => {
          onClose();
          navigate('/');
        }, 700);

        return;
      }

      setError('Не вдалося увійти');
      toast.error('Не вдалося увійти');
    } catch (err) {
      console.error(err);

      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message || 'Помилка входу';
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

  if (showRegister) {
    return (
      <RegisterModal
        onClose={onClose}
        onBackToLogin={() => setShowRegister(false)}
      />
    );
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.loginCard} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className={styles.close}
          onClick={onClose}
          disabled={loading}
        >
          ✕
        </button>

        <h1 className={styles.title}>Вхід</h1>
        <p className={styles.subtitle}>Увійдіть у свій акаунт</p>

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

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.loginBtn} disabled={loading}>
            {loading ? 'Входимо...' : 'Увійти'}
          </button>
        </form>

        <p className={styles.back}>
          Немає акаунту?{' '}
          <span
            onClick={() => {
              if (!loading) setShowRegister(true);
            }}
            style={{ color: '#ff8c00', cursor: 'pointer', fontWeight: 700 }}
          >
            Зареєструватися
          </span>
        </p>

        <p className={styles.back} onClick={onClose}>
          Повернутися назад
        </p>
      </div>
    </div>
  );
};

export default LoginModal;