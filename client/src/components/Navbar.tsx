import { useState, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "../styles/Navbar.module.css";
import LoginModal from "./LoginModal";
import { AuthContext } from "../context/AuthContext";
import UserMenu from "./UserMenu";
import { CartContext } from "../context/CartContext";

import bagIcon from "../assets/icons/bag.png";

const scrollToElement = (id: string) => {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
};

export default function Navbar() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const { user } = useContext(AuthContext);
  const { items } = useContext(CartContext);
  const navigate = useNavigate();
  const location = useLocation();

  const itemsCount = items.reduce((sum, x) => sum + x.quantity, 0);

  const handleSectionNavigate = (sectionId: string) => {
    if (location.pathname === "/") {
      scrollToElement(sectionId);
      return;
    }

    navigate("/", { state: { scrollTo: sectionId } });
  };

  const handleHomeClick = () => {
    if (location.pathname === "/") {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      return;
    }

    navigate("/");
  };

  return (
    <>
      <nav className={styles.navbar}>
        <div className={styles.container}>
          <div className={styles.navContent}>
            <div className={styles.brandContainer}>
              <button
                type="button"
                className={styles.brandLink}
                onClick={handleHomeClick}
              >
                <span className={styles.brand}>pizzaParadise</span>
              </button>
            </div>

            <ul className={styles.menu}>
              <li>
                <button type="button" onClick={handleHomeClick}>
                  Головна
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleSectionNavigate("menu-section")}
                >
                  Меню
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleSectionNavigate("events-section")}
                >
                  Події
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleSectionNavigate("about-section")}
                >
                  Про нас
                </button>
              </li>
            </ul>

            <div className={styles.rightSection}>
              {!user && (
                <button
                  className={styles.signin}
                  onClick={() => setIsLoginOpen(true)}
                >
                  Вхід
                </button>
              )}

              {user && <UserMenu />}

              <div
                className={styles.iconCircle}
                onClick={() => navigate("/cart")}
                role="button"
                aria-label="Cart"
              >
                <img src={bagIcon} alt="bag" />

                {itemsCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-6px",
                      right: "-6px",
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      background: "#FFA228",
                      color: "#1E0C00",
                      fontSize: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                    }}
                  >
                    {itemsCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {isLoginOpen && <LoginModal onClose={() => setIsLoginOpen(false)} />}
    </>
  );
}