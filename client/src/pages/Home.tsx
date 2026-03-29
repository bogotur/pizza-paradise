import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from '../styles/Home.module.css';
import Pizza from './Pizza';
import Events from './Events';
import About from './About';

import backgroundImageTopRight from '../assets/icons/background_image.png';
import cookingBg from '../assets/icons/cooking_background.png';
import lightningIcon from '../assets/icons/lightning.png';
import pizzaSliceIcon from '../assets/icons/pizza_slice.png';
import friesIcon from '../assets/icons/fries.png';

const Home: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToMenu = () => {
    scrollToSection('menu-section');
  };

  useEffect(() => {
    const sectionId = location.state?.scrollTo;

    if (sectionId) {
      const timer = setTimeout(() => {
        scrollToSection(sectionId);
        navigate(location.pathname, { replace: true, state: {} });
      }, 120);

      return () => clearTimeout(timer);
    }
  }, [location.state, location.pathname, navigate]);

  return (
    <div className={styles.home}>
      <section className={styles.hero} id="top">
        <img
          src={pizzaSliceIcon}
          alt="pizza slice"
          className={styles.backgroundImageTopRight}
        />
        <img
          src={friesIcon}
          alt="fries box"
          className={styles.backgroundImageBottomLeft}
        />

        <div className={styles.container}>
          <div className={styles.heroContent}>
            <div className={styles.left}>
              <h1 className={styles.title}>
                Найшвидша <br />
                <span className={styles.pizzaWithLightning}>
                  <span className={styles.pizzaText}>Доставка</span>
                  <img
                    src={lightningIcon}
                    alt="Lightning icon"
                    className={styles.lightningIcon}
                  />
                </span>
                <span>Піци</span>
              </h1>

              <p className={styles.subtitle}>
                Ми доставимо соковиту піцу для вашої родини за 30 хвилин,
                <br />
                Якщо кур&apos;єр запізниться – піца безкоштовна!
              </p>

              <p className={styles.cooking}>Процес приготування:</p>

              <div className={styles.videoBox}>
                <img
                  src={cookingBg}
                  alt="video"
                  className={styles.videoImg}
                />
                <div className={styles.playBtn}></div>
              </div>

              <div className={styles.buttons}>
                <button type="button" className={styles.orderBtn} onClick={scrollToMenu}>
                  Замовити
                </button>
                <button type="button" className={styles.menuBtn} onClick={scrollToMenu}>
                  Меню
                </button>
              </div>
            </div>

            <div className={styles.right}>
              <img
                src={backgroundImageTopRight}
                alt="Pizza"
                className={styles.heroPizza}
              />
            </div>
          </div>
        </div>
      </section>

      <Pizza />
      <Events />
      <About />
    </div>
  );
};

export default Home;