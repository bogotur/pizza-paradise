import { useState, useContext, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";
import PageLoader from "./PageLoader";

import styles from "../styles/UserMenu.module.css";

export default function UserMenu() {
  const { user, logout } = useContext(AuthContext);
  const { clear } = useContext(CartContext); 
  const [open, setOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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

  const handleLogout = () => {
    if (isLoggingOut) return;

    setOpen(false); 
    setIsLoggingOut(true);

    setTimeout(() => {
      clear?.(); 
      logout(); 

      toast("Ви вийшли з акаунту 👋", { icon: "✅" });

      navigate("/"); 
      window.scrollTo({ top: 0, behavior: "smooth" });

      setIsLoggingOut(false);
    }, 1000);
  };

  return (
    <div className={styles.avatarWrapper} ref={menuRef}>
      <PageLoader open={isLoggingOut} text="Вихід..." />

      <div className={styles.iconCircle} onClick={() => setOpen((prev) => !prev)}>
        <img src="/src/assets/icons/user.png" alt="User" />
      </div>

      {open && (
        <div className={styles.dropdown}>
          <button
            type="button"
            className={styles.linkBtn}
            onClick={() => {
              setOpen(false);
              navigate("/profile");
            }}
          >
            Особистий кабінет
          </button>

          <button
            type="button"
            className={styles.linkBtn}
            onClick={() => {
              setOpen(false);
              navigate("/my-orders");
            }}
          >
            Мої замовлення
          </button>

          <div className={styles.divider}></div>

          <button className={styles.logout} onClick={handleLogout}>
            Вийти
          </button>
        </div>
      )}
    </div>
  );
}