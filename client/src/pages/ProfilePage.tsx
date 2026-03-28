import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { api } from "../api/api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import PageLoader from "../components/PageLoader";
import styles from "../styles/ProfilePage.module.css";

type TabKey = "profile" | "orders";

type Profile = {
  id: number;
  email: string;
  role?: string;
  created_at?: string | null;
};

type MyOrder = {
  id: number;
  total: number;
  status: string;
  created_at: string | null;
  transaction_id: string | null;
};

const statusUa: Record<string, string> = {
  pending: "в очікуванні",
  paid: "сплачено",
  cooking: "готується",
  delivering: "у доставці",
  done: "доставлено",
  canceled: "скасоване",
};

const fmtDate = (s: string | null) => {
  if (!s) return "";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function ProfilePage() {
  const navigate = useNavigate();

  const [tab, setTab] = useState<TabKey>("profile");
  const [loading, setLoading] = useState(false);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<MyOrder[]>([]);

  const token = useMemo(() => localStorage.getItem("token"), []);

  useEffect(() => {
    if (!token) {
      toast.error("Увійдіть в акаунт");
      navigate("/", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const load = async () => {
    if (!token) return;
    setLoading(true);

    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [meRes, myOrdersRes] = await Promise.all([
        api.get("/api/auth/me", { headers }),
        api.get("/api/orders/my", { headers }),
      ]);

      setProfile(meRes.data);
      setOrders(myOrdersRes.data || []);
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        toast.error(e.response?.data?.message || "Не вдалося завантажити профіль");
      } else {
        toast.error("Не вдалося завантажити профіль");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    toast("Ви вийшли з акаунта");
    navigate("/", { replace: true });
  };

  return (
    <div className={styles.page}>
      <PageLoader
        open={loading}
        text="Завантажуємо профіль..."
        subtext="Підтягуємо ваші дані та замовлення"
        progress={42}
      />

      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>Особистий кабінет</h1>
              <div className={styles.subtitle}>Профіль, замовлення та налаштування</div>
            </div>

            <button className={styles.logoutBtn} onClick={logout}>
              Вийти
            </button>
          </div>

          <div className={styles.shell}>
            <aside className={styles.sidebar}>
              <button
                className={`${styles.navItem} ${tab === "profile" ? styles.navActive : ""}`}
                onClick={() => setTab("profile")}
              >
                👤 Профіль
              </button>

              <div className={styles.sidebarHint}>
                <div className={styles.hintTitle}>Швидко</div>
                <div className={styles.hintText}>
                  Перевіряй статус замовлень і керуй своїми даними.
                </div>
              </div>
            </aside>

            <main className={styles.content}>
              {tab === "profile" && (
                <div className={styles.grid}>
                  <div className={styles.card}>
                    <div className={styles.cardTitle}>Дані акаунта</div>

                    <div className={styles.row}>
                      <div className={styles.label}>Email</div>
                      <div className={styles.value}>{profile?.email || <span className={styles.pill}>—</span>}</div>
                    </div>             

                    <div className={styles.row}>
                      <div className={styles.label}>Створено</div>
                      <div className={styles.value}>
                        {fmtDate(profile?.created_at || null) || <span className={styles.pill}>—</span>}
                      </div>
                    </div>
                  </div>

                  <div className={styles.card}>
                    <div className={styles.cardTitle}>Статистика</div>
                    <div className={styles.kpis}>
                      <div className={styles.kpi}>
                        <div className={styles.kpiLabel}>Замовлень</div>
                        <div className={styles.kpiValue}>{orders.length}</div>
                      </div>
                      <div className={styles.kpi}>
                        <div className={styles.kpiLabel}>Оплачені</div>
                        <div className={styles.kpiValue}>{orders.filter((o) => o.status === "paid").length}</div>
                      </div>
                      <div className={styles.kpi}>
                        <div className={styles.kpiLabel}>В очікуванні</div>
                        <div className={styles.kpiValue}>{orders.filter((o) => o.status === "pending").length}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {tab === "orders" && (
                <div className={styles.card}>
                  <div className={styles.cardTop}>
                    <div>
                      <div className={styles.cardTitle}>Мої замовлення</div>
                      <div className={styles.cardSub}>Якщо статус "в очікуванні" — можна клікнути на замовлення та перейти на сторінку оплати</div>
                    </div>
                  </div>

                  {orders.length === 0 ? (
                    <div className={styles.empty}>Поки немає замовлень</div>
                  ) : (
                    <div className={styles.ordersList}>
                      {orders.map((o) => (
                        <button
                          key={o.id}
                          className={styles.orderRow}
                          onClick={() => {
                            if (o.status === "pending") navigate(`/payment/${o.id}`);
                          }}
                        >
                          <div className={styles.orderLeft}>
                            <div className={styles.orderId}>Замовлення #{o.id}</div>
                            <div className={styles.orderMeta}>{fmtDate(o.created_at)}</div>
                          </div>

                          <div className={styles.orderRight}>
                            <div className={styles.orderTotal}>{Number(o.total).toFixed(2)} ₴</div>
                            <div className={styles.badge} data-status={o.status}>
                              {statusUa[o.status] || o.status}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </main>
          </div>
        </div>
      </section>
    </div>
  );
}