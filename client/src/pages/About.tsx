import React from 'react';
import styles from '../styles/About.module.css';

import smallPizza1 from '../assets/smallPizzas/small-pizza-1.png';
import smallPizza2 from '../assets/smallPizzas/small-pizza-2.png';
import smallPizza3 from '../assets/smallPizzas/small-pizza-3.png';
import smallPizza4 from '../assets/smallPizzas/small-pizza-4.png';
import smallPizza5 from '../assets/smallPizzas/small-pizza-5.png';
import mainPizza from '../assets/smallPizzas/main-pizza-image.png';

const SMALL_PIZZA_IMAGES = [
    smallPizza1,
    smallPizza2,
    smallPizza3,
    smallPizza4,
    smallPizza5
];

const About: React.FC = () => {
    return (
        <div className={styles.aboutPage} id="about-section">
            <div className={styles.container}>
                <div className={styles.aboutContent}>
                    <div className={styles.textColumn}>
                        <h1 className={styles.title}>Про нас</h1>
                        <p className={styles.textBlock}>
                            Всього за пару років ми відкрили 6 торгових точок
                            у різних містах: Київ, Дніпро, Чернівці, Львів,
                            Тернопіль, а в майбутньому ми плануємо розвивати
                            мережу в інших великих містах України.
                        </p>
                        <div className={styles.smallPizzasContainer}>
                            {SMALL_PIZZA_IMAGES.map((imgSrc, index) => (
                                <div
                                    key={index}
                                    className={styles.smallPizzaItem}
                                    style={{
                                        backgroundImage: `url(${imgSrc})`
                                    }}
                                />
                            ))}
                        </div>
                        <p className={styles.textBlock}>
                            Кухня кожної точки має щонайменше: 400-500 кв. метрів,
                            сотні співробітників, які безперебійно, виконують
                            роботу з метою своєчасного отримання / підготовки /
                            формування / доставки замовлень клієнтів.
                        </p>
                    </div>
                    <div className={styles.imageColumn}>
                        <div
                            className={styles.mainPizzaImage}
                            style={{
                                backgroundImage: `url(${mainPizza})`
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default About;