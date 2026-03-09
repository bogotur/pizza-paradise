import { useContext, useEffect } from "react";
import { CartContext } from "../context/CartContext";
import styles from "../styles/CartPage.module.css";

export default function CartPage() {
  const { items, total, removeItem, changeQty, clear } = useContext(CartContext);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  return (
    <div className={styles.cartPage}>
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <h1 className={styles.title}>Кошик</h1>

            {items.length === 0 ? (
              <p className={styles.empty}>Кошик порожній</p>
            ) : (
              <>
                <div className={styles.list}>
                  {items.map((x) => (
                    <div key={x.cartId} className={styles.item}>
                      <img
                        className={styles.img}
                        src={`http://localhost:5000/assets/pizza/${x.image}`}
                        alt={x.name}
                      />

                      <div className={styles.info}>
                        <div className={styles.name}>{x.name}</div>
                        <div className={styles.meta}>Розмір: {x.size_cm} см</div>
                        <div className={styles.meta}>
                          Інгредієнти: {x.ingredientIds.length ? x.ingredientIds.join(", ") : "—"}
                        </div>
                      </div>

                      <div className={styles.qtyBox}>
                        <button
                          className={styles.qtyBtn}
                          onClick={() => changeQty(x.cartId, -1)}
                        >
                          -
                        </button>
                        <span className={styles.qtyNum}>{x.quantity}</span>
                        <button
                          className={styles.qtyBtn}
                          onClick={() => changeQty(x.cartId, 1)}
                        >
                          +
                        </button>
                      </div>

                      <div className={styles.price}>
                        {((x.basePrice + x.ingredientsPrice) * x.quantity).toFixed(2)}₴
                      </div>

                      <button className={styles.remove} onClick={() => removeItem(x.cartId)}>
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                <div className={styles.summary}>
                  <div className={styles.total}>Разом: {total.toFixed(2)}₴</div>

                  <div className={styles.buttons}>
                    <button className={styles.checkoutBtn}>
                      Оформити
                    </button>
                    <button className={styles.clearBtn} onClick={clear}>
                      Очистити
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
