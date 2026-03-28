import { useContext, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import PageLoader from "../../components/PageLoader";
import { AuthContext } from "../../context/AuthContext";

import styles from "../../styles/AdminLayout.module.css";

export default function AdminLayout() {
  const { logout } = useContext(AuthContext);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    setTimeout(() => {
      logout();
      localStorage.removeItem("token");
      toast("Ви вийшли з адмін-панелі 👋", { icon: "✅" });
      navigate("/admin/login", { replace: true });
      setIsLoggingOut(false);
    }, 450);
  };

  return (
    <div className={styles.page}>
      <PageLoader open={isLoggingOut} text="Вихід..." />

      <aside className={styles.sidebar}>
        <div className={styles.brand}>pizzaParadise</div>
        <div className={styles.brandSub}>Admin</div>

        <nav className={styles.nav}>
          <NavLink
            to="/admin"
            end
            className={({ isActive }) => (isActive ? styles.active : styles.link)}
          >
             Головна
          </NavLink>

          <NavLink
            to="/admin/orders"
            className={({ isActive }) => (isActive ? styles.active : styles.link)}
          >
             Замовлення
          </NavLink>

          <NavLink
            to="/admin/users"
            className={({ isActive }) => (isActive ? styles.active : styles.link)}
          >
             Користувачі
          </NavLink>
        </nav>

        <button className={styles.logout} onClick={handleLogout}>
          Вийти
        </button>
      </aside>

      <main className={styles.content}>
        <div className={styles.topbar}>
          <div>
            <div className={styles.topTitle}>Адмін-панель</div>
            <div className={styles.topHint}>Керуйте замовленнями та меню</div>
          </div>
        </div>

        <div className={styles.inner}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}