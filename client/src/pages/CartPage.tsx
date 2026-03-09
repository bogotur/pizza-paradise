import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

import { CartContext } from "../context/CartContext";
import styles from "../styles/CartPage.module.css";

type IngredientRow = { id: number; name: string };

const API_URL = "http://localhost:5000";

const normalizePhone = (value: string) => {
  return value.replace(/[^\d+]/g, "");
};

const validateName = (value: string) => {
  const trimmed = value.trim();

  if (!trimmed) return "Введіть ім’я";
  if (trimmed.length < 2) return "Ім’я занадто коротке";
  if (trimmed.length > 50) return "Ім’я занадто довге";

  const nameRegex = /^[A-Za-zА-Яа-яІіЇїЄєҐґ'`\-\s]+$/;
  if (!nameRegex.test(trimmed)) {
    return "Ім’я містить недопустимі символи";
  }

  return null;
};

const validatePhone = (value: string) => {
  const normalized = normalizePhone(value);
  const digitsOnly = normalized.replace(/\D/g, "");

  if (!normalized) return "Введіть номер телефону";
  if (digitsOnly.length < 10) return "Номер телефону занадто короткий";
  if (digitsOnly.length > 12) return "Номер телефону занадто довгий";

  const uaPhoneRegex = /^(\+380\d{9}|380\d{9}|0\d{9})$/;
  if (!uaPhoneRegex.test(normalized)) {
    return "Введіть коректний номер телефону";
  }

  return null;
};

const validateAddress = (value: string) => {
  const trimmed = value.trim();

  if (!trimmed) return "Введіть адресу доставки";
  if (trimmed.length < 8) return "Адреса занадто коротка";
  if (trimmed.length > 120) return "Адреса занадто довга";

  const hasLetters = /[A-Za-zА-Яа-яІіЇїЄєҐґ]/.test(trimmed);
  const hasNumber = /\d/.test(trimmed);

  if (!hasLetters || !hasNumber) {
    return "Вкажіть повну адресу: вулиця та номер будинку";
  }

  return null;
};

const validateComment = (value: string) => {
  const trimmed = value.trim();

  if (trimmed.length > 250) {
    return "Коментар занадто довгий";
  }

  return null;
};

export default function CartPage() {
  const { items, total, removeItem, changeQty, clear, hydrated } = useContext(CartContext);
  const [loading, setLoading] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [comment, setComment] = useState("");

  const [ingredientsMap, setIngredientsMap] = useState<Record<number, string>>({});

  const navigate = useNavigate();
  
  useEffect(() => {
  window.scrollTo({
    top: 0,
    behavior: "auto",
  });
}, []);

  useEffect(() => {
    const loadIngredients = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/ingredients`);
        const map: Record<number, string> = {};

        (res.data as IngredientRow[]).forEach((x) => {
          map[Number(x.id)] = x.name;
        });

        setIngredientsMap(map);
      } catch {
        toast.error("Не вдалося завантажити інгредієнти");
      }
    };

    loadIngredients();
  }, []);

  const handleCheckout = async () => {
    if (!hydrated) return;

    if (items.length === 0) {
      toast.error("Кошик порожній");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Спочатку увійдіть в акаунт");
      return;
    }

    if (loading) return;

    const nameError = validateName(customerName);
    if (nameError) {
      toast.error(nameError);
      return;
    }

    const phoneError = validatePhone(customerPhone);
    if (phoneError) {
      toast.error(phoneError);
      return;
    }

    const addressError = validateAddress(deliveryAddress);
    if (addressError) {
      toast.error(addressError);
      return;
    }

    const commentError = validateComment(comment);
    if (commentError) {
      toast.error(commentError);
      return;
    }

    setLoading(true);

    try {
      const payloadItems = items.map((x) => {
        const unit_price = Number(x.basePrice) + Number(x.ingredientsPrice || 0);
        const subtotal = unit_price * Number(x.quantity);

        return {
          pizzaId: x.pizzaId,
          name: x.name,
          image: x.image,
          size_cm: x.size_cm,
          quantity: x.quantity,
          basePrice: x.basePrice,
          ingredientsPrice: x.ingredientsPrice || 0,
          unit_price,
          subtotal,
          ingredientIds: Array.isArray(x.ingredientIds) ? x.ingredientIds : [],
        };
      });

      const res = await axios.post(
        `${API_URL}/api/orders`,
        {
          customer_name: customerName.trim(),
          customer_phone: normalizePhone(customerPhone),
          delivery_address: deliveryAddress.trim(),
          comment: comment.trim(),
          items: payloadItems,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Замовлення створено ✅");
      navigate(`/payment/${res.data.orderId}`);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Не вдалося створити замовлення");
      } else {
        toast.error("Не вдалося створити замовлення");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.cartPage}>
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <h1 className={styles.title}>Кошик</h1>

            {!hydrated ? (
              <p className={styles.empty}>Завантаження кошика...</p>
            ) : items.length === 0 ? (
              <p className={styles.empty}>Кошик порожній</p>
            ) : (
              <>
                <div className={styles.list}>
                  {items.map((x) => (
                    <div key={x.cartId} className={styles.item}>
                      <img
                        className={styles.img}
                        src={`${API_URL}/assets/pizza/${x.image}`}
                        alt={x.name}
                      />

                      <div className={styles.info}>
                        <div className={styles.name}>{x.name}</div>
                        <div className={styles.meta}>Розмір: {x.size_cm} см</div>

                        <div className={styles.meta}>
                          Інгредієнти:{" "}
                          {Array.isArray(x.ingredientIds) && x.ingredientIds.length
                            ? x.ingredientIds
                                .map((id: number) => ingredientsMap[id] || `#${id}`)
                                .join(", ")
                            : "—"}
                        </div>
                      </div>

                      <div className={styles.qtyBox}>
                        <button
                          type="button"
                          className={styles.qtyBtn}
                          onClick={() => changeQty(x.cartId, -1)}
                          disabled={loading}
                        >
                          -
                        </button>
                        <span className={styles.qtyNum}>{x.quantity}</span>
                        <button
                          type="button"
                          className={styles.qtyBtn}
                          onClick={() => changeQty(x.cartId, 1)}
                          disabled={loading}
                        >
                          +
                        </button>
                      </div>

                      <div className={styles.price}>
                        {(
                          (Number(x.basePrice) + Number(x.ingredientsPrice || 0)) *
                          Number(x.quantity)
                        ).toFixed(2)}
                        ₴
                      </div>

                      <button
                        type="button"
                        className={styles.remove}
                        onClick={() => removeItem(x.cartId)}
                        disabled={loading}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                <div className={styles.checkoutForm}>
                  <h3 className={styles.formTitle}>Дані доставки</h3>

                  <div className={styles.formGrid}>
                    <div>
                      <label className={styles.label}>Ім’я</label>
                      <input
                        className={styles.input}
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value.slice(0, 50))}
                        placeholder="Іван"
                        disabled={loading}
                        maxLength={50}
                      />
                    </div>

                    <div>
                      <label className={styles.label}>Телефон</label>
                      <input
                        className={styles.input}
                        value={customerPhone}
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(/[^\d+]/g, "").slice(0, 13);
                          setCustomerPhone(cleaned);
                        }}
                        placeholder="+380..."
                        disabled={loading}
                        inputMode="tel"
                        maxLength={13}
                      />
                    </div>

                    <div style={{ gridColumn: "1 / -1" }}>
                      <label className={styles.label}>Адреса</label>
                      <input
                        className={styles.input}
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value.slice(0, 120))}
                        placeholder="Місто, вулиця, будинок, квартира"
                        disabled={loading}
                        maxLength={120}
                      />
                    </div>

                    <div style={{ gridColumn: "1 / -1" }}>
                      <label className={styles.label}>Коментар</label>
                      <input
                        className={styles.input}
                        value={comment}
                        onChange={(e) => setComment(e.target.value.slice(0, 250))}
                        placeholder="Під’їзд, домофон..."
                        disabled={loading}
                        maxLength={250}
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.summary}>
                  <div className={styles.total}>Разом: {Number(total).toFixed(2)}₴</div>

                  <div className={styles.buttons}>
                    <button
                      type="button"
                      className={styles.checkoutBtn}
                      onClick={handleCheckout}
                      disabled={loading || !hydrated}
                    >
                      {loading ? "Створюємо..." : "Оформити"}
                    </button>

                    <button
                      type="button"
                      className={styles.clearBtn}
                      onClick={clear}
                      disabled={loading || !hydrated}
                    >
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