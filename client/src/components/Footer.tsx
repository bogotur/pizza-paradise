import React from 'react';
import { HashLink } from 'react-router-hash-link'; 
import styles from '../styles/Footer.module.css';

const Footer: React.FC = () => {
    
    const linksData = [
        {
            title: 'Головна', linkTo: '/#top', 
            items: [
                {text: 'Замовити', href: '/#menu-section'},
                {text: 'Про нас', href: '/#about-section'},
                {text: 'Події', href: '/#events-section'}, 
                {text: 'Меню', href: '/#menu-section'}]
        },
        {
            title: 'Події', linkTo: '/#events-section',
            items: [
                {text: 'Три піци,і кава безкоштовно!', href: '/#events-section'},
                {text: 'Дві піци за одну ціну', href: '/#events-section'}, 
                {text: 'Екскурсія кухнею', href: '/#events-section'}]
        },
        {
            title: 'Меню', linkTo: '/menu#menu-section',
            items: [
                {text: 'Показати всі', href: '/#menu-section'},
                {text: 'М`ясна', href: '/#menu-section'},
                {text: 'Класична', href: '/#menu-section'},
                {text: 'Сирна', href: '/#menu-section'}]
        },
        {
            title: 'Про нас', linkTo: '/#about-section',
            items: [
                {text: 'Наша історія', href: '/#about-section'},
                {text: 'Хто ми?', href: '/#about-section'}]
        },
    ];

    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.topSection}>
                    <HashLink to="/" className={styles.logo}>pizzaParadise</HashLink>
                    <div className={styles.linkColumns}>
                        {linksData.map((col, index) => (
                            <div key={index} className={styles.column}>                            
                                <HashLink to={col.linkTo} className={styles.columnTitle} smooth>
                                    {col.title}
                                </HashLink>
                                <ul>
                                    {col.items.map((item, i) => (
                                        <li key={i} className={styles.linkItem}>                                           
                                            <HashLink to={item.href} className={styles.link} smooth>{item.text}</HashLink>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className={styles.bottomSection}>
                    <a href="tel:0 800 77 77 88" className={styles.contact}>
                        0 (800) 77 77 88
                    </a>
                    
                    <div className={styles.socialIcons}>
                        <a href="#" className={styles.socialLink}>
                            <i className={styles.instaIcon}></i>
                        </a>
                        <a href="#" className={styles.socialLink}>
                            <i className={styles.twitterIcon}></i>
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;