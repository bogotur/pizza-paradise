import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import PageLoader from "../components/PageLoader";
import styles from "../styles/MyOrdersPage.module.css";

type MyOrder = {
  id: number;
  total: number;
  status: string;
  created_at: string | null;
  transaction_id: string | null;
  payment_method: string | null;
  card_last4: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  delivery_address: string | null;
  comment: string | null;
};

type Ingredient = { id: number; name: string };

type OrderItem = {
  id: number;
  order_id: number;
  name: string;
  image: string;
  size_cm: number;
  qty: number;
  unit_price: number;
  subtotal: number;
  ingredients?: Ingredient[];
};

type DetailsResponse = {
  order: MyOrder;
  items: OrderItem[];
};

type SortKey = "date_desc" | "date_asc" | "total_desc" | "total_asc" | "id_desc" | "id_asc";

const statusOptions = [
  { value: "all", label: "усі" },
  { value: "pending", label: "в очікуванні" },
  { value: "paid", label: "сплачено" },
  { value: "cooking", label: "готується" },
  { value: "delivering", label: "у доставці" },
  { value: "done", label: "готове" },
  { value: "canceled", label: "скасоване" },
];

const statusUa: Record<string, string> = {
  pending: "в очікуванні",
  paid: "сплачено",
  cooking: "готується",
  delivering: "у доставці",
  done: "готове",
  canceled: "скасоване",
};

const fmtDate = (s: string | null) => {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const field = (v?: string | null) => (v && v.trim() ? v : null);

export default function MyOrdersPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<MyOrder[]>([]);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState<SortKey>("date_desc");

  const [detailsLoading, setDetailsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<MyOrder | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);

  const token = useMemo(() => localStorage.getItem("token"), []);

  useEffect(() => {
    if (!token) {
      toast.error("Увійдіть в акаунт");
      navigate("/", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const api = useMemo(() => {
    return axios.create({
      baseURL: import.meta.env.VITE_API_URL,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
  }, [token]);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/orders/my`);
      setOrders(res.data || []);
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) toast.error(e.response?.data?.message || "Не вдалося завантажити замовлення");
      else toast.error("Не вдалося завантажити замовлення");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const toTime = (x: string | null) => (x ? new Date(x).getTime() : 0);

    let list = [...orders];

    if (statusFilter !== "all") list = list.filter((o) => o.status === statusFilter);

    if (q) {
      list = list.filter((o) => {
        const id = String(o.id);
        const tx = (o.transaction_id || "").toLowerCase();
        return id.includes(q) || tx.includes(q);
      });
    }

    list.sort((a, b) => {
      if (sort === "date_desc") return toTime(b.created_at) - toTime(a.created_at);
      if (sort === "date_asc") return toTime(a.created_at) - toTime(b.created_at);
      if (sort === "total_desc") return Number(b.total || 0) - Number(a.total || 0);
      if (sort === "total_asc") return Number(a.total || 0) - Number(b.total || 0);
      if (sort === "id_desc") return b.id - a.id;
      if (sort === "id_asc") return a.id - b.id;
      return 0;
    });

    return list;
  }, [orders, query, statusFilter, sort]);

  const openDetails = async (o: MyOrder) => {
    if (!token) return;

    setOpen(true);
    setSelected(o);
    setItems([]);
    setDetailsLoading(true);

    try {
      const res = await api.get<DetailsResponse>(`/api/orders/my/${o.id}`);
      setSelected(res.data.order);
      setItems(res.data.items || []);
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) toast.error(e.response?.data?.message || "Не вдалося завантажити деталі");
      else toast.error("Не вдалося завантажити деталі");
      setItems([]);
    } finally {
      setDetailsLoading(false);
    }
  };

  const close = () => {
    setOpen(false);
    setSelected(null);
    setItems([]);
    setDetailsLoading(false);
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <PageLoader
          open={loading}
          text="Завантажуємо замовлення..."
          subtext="Підтягуємо список з сервера"
          progress={45}
        />

        <div className={styles.container}>
          <div className={styles.head}>
            <div>
              <h1 className={styles.title}>Мої замовлення</h1>
              <div className={styles.subtitle}>
                Знайдено: <b>{filtered.length}</b> / {orders.length}
              </div>
            </div>

            <button className={styles.refresh} onClick={load} disabled={loading}>
              Оновити
            </button>
          </div>

          <div className={styles.toolbar}>
            <input
              className={styles.search}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Пошук: #id або transaction_id..."
            />

            <select className={styles.select} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            <select className={styles.select} value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
              <option value="date_desc">дата: нові → старі</option>
              <option value="date_asc">дата: старі → нові</option>
              <option value="total_desc">сума: більша → менша</option>
              <option value="total_asc">сума: менша → більша</option>
              <option value="id_desc">id: більший → менший</option>
              <option value="id_asc">id: менший → більший</option>
            </select>
          </div>

          <div className={styles.list}>
            {filtered.length === 0 ? (
              <div className={styles.empty}>Нічого не знайдено</div>
            ) : (
              filtered.map((o) => (
                <button key={o.id} className={styles.card} onClick={() => openDetails(o)}>
                  <div className={styles.top}>
                    <div>
                      <div className={styles.orderId}>Замовлення #{o.id}</div>
                      <div className={styles.meta}>
                        {fmtDate(o.created_at)} •{" "}
                        {o.transaction_id ? <span className={styles.mono}>{o.transaction_id}</span> : "без транзакції"}
                      </div>
                    </div>

                    <div className={styles.right}>
                      <div className={styles.total}>{Number(o.total || 0).toFixed(2)} ₴</div>
                      <div className={styles.badge} data-status={o.status}>
                        {statusUa[o.status] || o.status}
                      </div>
                    </div>
                  </div>

                  <div className={styles.grid}>
                    <div className={styles.box}>
                      <div className={styles.label}>Адреса</div>
                      <div className={styles.value}>
                        {field(o.delivery_address) ? o.delivery_address : <span className={styles.pill}>Не вказано</span>}
                      </div>
                    </div>

                    <div className={styles.box}>
                      <div className={styles.label}>Оплата</div>
                      <div className={styles.value}>
                        {o.payment_method || "—"} {o.card_last4 ? `• **** ${o.card_last4}` : ""}
                      </div>
                    </div>

                    <div className={styles.box}>
                      <div className={styles.label}>Коментар</div>
                      <div className={styles.value}>
                        {field(o.comment) ? o.comment : <span className={styles.pill}>Немає</span>}
                      </div>
                    </div>
                  </div>

                  {o.status === "pending" && (
                    <div className={styles.payHint}>
                      Натисни, щоб відкрити деталі. Оплату можна завершити на сторінці /payment/{o.id}.
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {open && (
          <div className={styles.modalOverlay} onMouseDown={close}>
            <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
              <div className={styles.modalHead}>
                <div>
                  <div className={styles.modalTitle}>Замовлення #{selected?.id ?? "—"}</div>
                  <div className={styles.modalSub}>
                    {fmtDate(selected?.created_at || null)} •{" "}
                    {selected?.transaction_id ? <span className={styles.mono}>{selected.transaction_id}</span> : "без транзакції"}
                  </div>
                </div>

                <button className={styles.closeBtn} onClick={close}>
                  ✕
                </button>
              </div>

              <div className={styles.modalGrid}>
                <div className={styles.modalBox}>
                  <div className={styles.label}>Статус</div>
                  <div className={styles.value}>
                    <span className={styles.badge} data-status={selected?.status || "pending"}>
                      {statusUa[selected?.status || "pending"] || selected?.status}
                    </span>
                  </div>
                </div>

                <div className={styles.modalBox}>
                  <div className={styles.label}>Сума</div>
                  <div className={styles.value}>{Number(selected?.total || 0).toFixed(2)} ₴</div>
                </div>

                <div className={styles.modalBox}>
                  <div className={styles.label}>Адреса</div>
                  <div className={styles.value}>
                    {field(selected?.delivery_address) ? selected!.delivery_address : <span className={styles.pill}>Не вказано</span>}
                  </div>
                </div>

                <div className={styles.modalBox}>
                  <div className={styles.label}>Оплата</div>
                  <div className={styles.value}>
                    {selected?.payment_method || "—"} {selected?.card_last4 ? `• **** ${selected.card_last4}` : ""}
                  </div>
                </div>
              </div>

              <div className={styles.divider} />

              <div className={styles.itemsHead}>
                <div className={styles.itemsTitle}>Позиції</div>
                {detailsLoading && <div className={styles.hint}>Завантаження...</div>}
              </div>

              {!detailsLoading && items.length === 0 ? (
                <div className={styles.hint}>Немає позицій</div>
              ) : (
                <div className={styles.items}>
                  {items.map((it) => (
                    <div key={it.id} className={styles.itemRow}>
                      <img className={styles.itemImg} src={"/api/assets/pizza/${it.image}"} alt={it.name} />

                      <div className={styles.itemInfo}>
                        <div className={styles.itemName}>{it.name}</div>
                        <div className={styles.itemMeta}>
                          {it.size_cm} см • x{it.qty} • {Number(it.unit_price || 0).toFixed(2)} ₴
                        </div>

                        {it.ingredients && it.ingredients.length > 0 ? (
                          <div className={styles.ingList}>
                            {it.ingredients.map((ing) => (
                              <span key={ing.id} className={styles.ingChip}>
                                {ing.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          !detailsLoading && <div className={styles.ingEmpty}>Інгредієнти не вказані</div>
                        )}
                      </div>

                      <div className={styles.itemPrice}>{Number(it.subtotal || 0).toFixed(2)} ₴</div>
                    </div>
                  ))}
                </div>
              )}

              {selected?.status === "pending" && (
                <button className={styles.payBtn} onClick={() => navigate(`/payment/${selected.id}`)}>
                  Перейти до оплати →
                </button>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}