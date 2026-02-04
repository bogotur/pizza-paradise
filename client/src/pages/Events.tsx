import React from 'react';
import styles from '../styles/Events.module.css';

import cookingImg from '../assets/background/cooking.png';
import blogImg from '../assets/background/blog.png';
import twoForOneImg from '../assets/background/2for1.png';
import kitchenTourImg from '../assets/background/tour.png';
import freeCoffeeImg from '../assets/background/free_coffee.png';
import instagramImg from '../assets/background/instagram.png';
import whereUsImg from '../assets/background/where.png';

    const STATIC_EVENTS_DATA = [
        { title: 'ЯК МИ ГОТУЄМО', image: cookingImg, special: false },
        { title: 'НАШ БЛОГ', image: blogImg, special: false },
        { title: 'ДВІ ПІЦИ ЗА ОДНУ ЦІНУ', image: twoForOneImg, special: false },
        { title: 'ЕКСКУРСІЯ КУХНЕЮ', image: kitchenTourImg, special: true },
        { title: 'ТРИ ПІЦИ, І КАВА БЕЗКОШТОВНО!', image: freeCoffeeImg, special: false },
        { title: 'НАШ INSTAGRAM', image: instagramImg, special: false },
        { title: 'ЧОМУ САМЕ МИ?', image: whereUsImg, special: false },
    ];

    const Events: React.FC = () => {
    return (
        <div className={styles.eventsPage} id="events-section">
            <div className={styles.container}>
                <div className={styles.eventsGrid}>
                    <div className={styles.eventTextBlock}>
                        <h2 className={styles.eventTitle}>Події</h2>
                        <p className={styles.eventDescription}>
                            У нашій піцерії регулярно проводяться заходи, 
                            які дозволяють вам насолодитися смачною їжею за нижчою ціною!
                        </p>
                    </div>
                    
                    {STATIC_EVENTS_DATA.map((card, index) => (
                        <div
                            key={index}
                            className={`${styles.card} ${card.special ? styles.specialCard : ''}`}
                        >
                        <div 
                            className={styles.cardOverlay}
                            style={{
                                backgroundImage: `url(${card.image})`
                            }}
                        >
                            <h4 className={styles.cardTitle}>{card.title}</h4>
                        </div>

                        <button className={styles.moreButton}>Детальніше</button>
                    </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Events;