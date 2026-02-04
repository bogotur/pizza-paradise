import { useState, useContext, useRef, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import styles from "../styles/UserMenu.module.css";

export default function UserMenu() {
  const { user, logout } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div className={styles.avatarWrapper} ref={menuRef}>
      <div
        className={styles.iconCircle}
        onClick={() => setOpen((prev) => !prev)}
      >
        <img src="/src/assets/icons/user.png" alt="User" />
      </div>

      {open && (
        <div className={styles.dropdown}>
          <a href="/profile"> Особистий кабінет</a>
          <a href="/orders"> Мої замовлення</a>

          <div className={styles.divider}></div>

          <button
            className={styles.logout}
            onClick={() => {
              logout();
              setOpen(false);
            }}
          >
             Вийти
          </button>
        </div>
      )}
    </div>
  );
}
