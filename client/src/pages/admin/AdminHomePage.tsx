import { useMemo } from "react";
import { NavLink } from "react-router-dom";

import styles from "../../styles/AdminHomePage.module.css";

export default function AdminHomePage() {
  const now = useMemo(() => {
    const d = new Date();
    return d.toLocaleString("uk-UA", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Адмін-панель</h1>
            <div className={styles.subtitle}>Швидкий доступ до основних дій</div>
          </div>

          <div className={styles.meta}>
            <div className={styles.metaLabel}>Останнє оновлення</div>
            <div className={styles.metaValue}>{now}</div>
          </div>
        </div>

        <div className={styles.grid}>
          <div className={styles.card}>
            <div className={styles.cardTop}>
              <div className={styles.icon}>📦</div>
              <div>
                <div className={styles.cardTitle}>Замовлення</div>
                <div className={styles.cardHint}>Перегляд і керування статусами</div>
              </div>
            </div>

            <NavLink to="/admin/orders" className={styles.primaryBtn}>
              Перейти до замовлень →
            </NavLink>
          </div>

          <div className={styles.card}>
            <div className={styles.cardTop}>
              <div className={styles.icon}>👤</div>
              <div>
                <div className={styles.cardTitle}>Користувачі</div>
                <div className={styles.cardHint}>Список зареєстрованих користувачів</div>
              </div>
            </div>

            <NavLink to="/admin/users" className={styles.primaryBtn}>
              Перейти до користувачів →
            </NavLink>
          </div>
        </div>
      </div>
    </div>
  );
}