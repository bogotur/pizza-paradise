import React, { useState } from 'react';
import axios from 'axios';
import styles from '../styles/LoginModal.module.css'; // використовуємо той самий стиль

interface Props {
  onClose: () => void;
}

const RegisterModal: React.FC<Props> = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError('Паролі не збігаються');
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', {
        email,
        password,
      });

      console.log('REGISTER RESPONSE:', res.data);

      if (res.data.message) {
        setSuccess(res.data.message);
        setError('');
      }
    } catch (err) {
      console.error(err);
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Помилка реєстрації');
      } else {
        setError('Невідома помилка');
      }
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.loginCard} onClick={e => e.stopPropagation()}>
        <button className={styles.close} onClick={onClose}>✕</button>

        <h1 className={styles.title}>Реєстрація</h1>
        <p className={styles.subtitle}>Створіть новий акаунт</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label>Email</label>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <label>Пароль</label>
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          <label>Підтвердіть пароль</label>
          <input
            type="password"
            placeholder="Підтвердіть пароль"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
          />

          {error && <p className={styles.error}>{error}</p>}
          {success && <p style={{color: '#4BB543', fontSize: '0.85rem'}}>{success}</p>}

          <button type="submit" className={styles.loginBtn}>Зареєструватися</button>
        </form>

        <p className={styles.back} onClick={onClose}>Повернутися назад</p>
      </div>
    </div>
  );
};

export default RegisterModal;
