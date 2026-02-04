import { useState, useContext } from "react";
import { HashLink } from "react-router-hash-link";
import { useNavigate } from "react-router-dom";
import styles from "../styles/Navbar.module.css";
import LoginModal from "./LoginModal";
import { AuthContext } from "../context/AuthContext";
import UserMenu from "./UserMenu";
import { CartContext } from "../context/CartContext";

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};

export default function Navbar() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const { user } = useContext(AuthContext);
  const { items } = useContext(CartContext);
  const navigate = useNavigate();

  const itemsCount = items.reduce((sum, x) => sum + x.quantity, 0);

  return (
    <>
      <nav className={styles.navbar}>
        <div className={styles.container}>
          <div className={styles.navContent}>
            <div className={styles.brandContainer}>
              <HashLink to="/" className={styles.brandLink} onClick={scrollToTop}>
                <span className={styles.brand}>pizzaParadise</span>
              </HashLink>
            </div>

            <ul className={styles.menu}>
              <li>
                <HashLink to="#top" smooth>
                  Головна
                </HashLink>
              </li>
              <li>
                <HashLink to="#menu-section" smooth>
                  Меню
                </HashLink>
              </li>
              <li>
                <HashLink to="#events-section" smooth>
                  Події
                </HashLink>
              </li>
              <li>
                <HashLink to="#about-section" smooth>
                  Про нас
                </HashLink>
              </li>
            </ul>

            <div className={styles.rightSection}>
              {!user && (
                <button className={styles.signin} onClick={() => setIsLoginOpen(true)}>
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
                <img src="/src/assets/icons/bag.png" alt="bag" />

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
