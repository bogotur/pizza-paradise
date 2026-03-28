import React, { useMemo, useState, useContext } from "react";
import axios from "axios";
import { api } from "../api/api";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import PageLoader from "../components/PageLoader";
import { CartContext } from "../context/CartContext";
import styles from "../styles/PaymentPage.module.css";

function onlyDigits(v: string) {
  return v.replace(/\D/g, "");
}

function formatCard(v: string) {
  const d = onlyDigits(v).slice(0, 16);
  return d.replace(/(.{4})/g, "$1 ").trim();
}

function formatExp(v: string) {
  const d = onlyDigits(v).slice(0, 4);
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)}/${d.slice(2)}`;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type PayStep = "" | "checking" | "bank" | "confirming";

export default function PaymentPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { clear, total } = useContext(CartContext);

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<PayStep>("");

  const [cardNumber, setCardNumber] = useState("");
  const [exp, setExp] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");

  const last4 = useMemo(() => {
    const d = onlyDigits(cardNumber);
    return d.length >= 4 ? d.slice(-4) : "";
  }, [cardNumber]);

  const validate = () => {
    const d = onlyDigits(cardNumber);
    if (d.length !== 16) return "Номер картки має містити 16 цифр";
    if (!/^\d{2}\/\d{2}$/.test(exp)) return "Термін дії має бути у форматі MM/YY";
    if (onlyDigits(cvv).length !== 3) return "CVV має містити 3 цифри";
    if (cardName.trim().length < 3) return "Введіть ім’я власника картки";
    return "";
  };

  const loaderText =
    step === "checking"
      ? "Перевірка даних"
      : step === "bank"
      ? "Зʼєднання з банком"
      : step === "confirming"
      ? "Підтвердження платежу"
      : "Проводимо оплату";

  const loaderSub =
    step === "checking"
      ? "Валідація реквізитів та безпека"
      : step === "bank"
      ? "Відправляємо запит у платіжний шлюз"
      : step === "confirming"
      ? "Фіналізація транзакції"
      : "Будь ласка, не закривайте сторінку";

  const progress = useMemo(() => {
    if (!loading) return 0;
    if (step === "checking") return 28;
    if (step === "bank") return 64;
    if (step === "confirming") return 92;
    return 12;
  }, [loading, step]);

  const payFake = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Спочатку увійдіть в акаунт");
      navigate("/");
      return;
    }

    if (!orderId) {
      toast.error("Немає ID замовлення");
      return;
    }

    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }

    if (loading) return;
    setLoading(true);

    try {
      setStep("checking");
      await sleep(900 + Math.random() * 700);

      setStep("bank");
      await sleep(900 + Math.random() * 900);

      setStep("confirming");
      await sleep(700 + Math.random() * 700);

      const res = await api.post(
        "/api/payments/fake",
        { orderId: Number(orderId), card_last4: last4 },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      clear();
      toast.success(`Оплата успішна ✅ ${res.data.transaction_id}`);
      setTimeout(() => navigate("/"), 900);
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        toast.error(e.response?.data?.message || "Помилка оплати");
      } else {
        toast.error("Помилка оплати");
      }
    } finally {
      setStep("");
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <PageLoader open={loading} text={loaderText} subtext={loaderSub} progress={progress} />

      <div className={styles.wrapper}>
        <div className={styles.card}>
          <div className={styles.header}>
            <div className={styles.title}>Оплата карткою</div>
            <div className={styles.sub}>Замовлення №{orderId}</div>
          </div>

          <div className={styles.bankCard}>
            <div className={styles.brandRow}>
              <div className={styles.brand}>VISA / MasterCard</div>
              <div className={styles.chip} />
            </div>

            <div className={styles.cardNumberPreview}>
              {cardNumber || "•••• •••• •••• ••••"}
            </div>

            <div className={styles.cardMetaRow}>
              <div>
                Термін дії
                <strong>{exp || "MM/YY"}</strong>
              </div>

              <div style={{ textAlign: "right" }}>
                Власник
                <strong>{cardName || "YOUR NAME"}</strong>
              </div>
            </div>
          </div>

          <div className={styles.form}>
            <div>
              <div className={styles.label}>Номер картки</div>
              <input
                className={styles.input}
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCard(e.target.value))}
                placeholder="1234 5678 9012 3456"
                inputMode="numeric"
                disabled={loading}
              />
            </div>

            <div className={styles.row}>
              <div>
                <div className={styles.label}>Термін дії</div>
                <input
                  className={styles.input}
                  value={exp}
                  onChange={(e) => setExp(formatExp(e.target.value))}
                  placeholder="MM/YY"
                  inputMode="numeric"
                  disabled={loading}
                />
              </div>

              <div>
                <div className={styles.label}>CVV</div>
                <input
                  className={styles.input}
                  value={cvv}
                  onChange={(e) => setCvv(onlyDigits(e.target.value).slice(0, 3))}
                  placeholder="123"
                  inputMode="numeric"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <div className={styles.label}>Ім’я на картці</div>
              <input
                className={styles.input}
                value={cardName}
                onChange={(e) => setCardName(e.target.value.toUpperCase())}
                placeholder="YOUR NAME"
                disabled={loading}
              />
            </div>

            <button className={styles.btn} onClick={payFake} disabled={loading}>
              {loading ? "Опрацьовуємо..." : "Підтвердити оплату"}
            </button>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.summaryTitle}>Підсумок</div>

          <div className={styles.summaryBox}>
            <div className={styles.summaryRow}>
              <span>Спосіб оплати</span>
              <span>Картка</span>
            </div>

            <div className={styles.summaryRow}>
              <span>Статус</span>
              <span>Очікує оплату</span>
            </div>

            <div className={styles.summaryRow}>
              <span>До сплати</span>
              <span className={styles.summaryTotal}>
                {Number(total || 0).toFixed(2)} ₴
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}