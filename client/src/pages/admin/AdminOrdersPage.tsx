import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

import PageLoader from "../../components/PageLoader";
import styles from "../../styles/AdminOrdersPage.module.css";

const API = "http://localhost:5000";

type OrderRow = {
  id: number;
  user_id: number | null;
  user_db_id?: number | null;
  email?: string | null;
  user_role?: string | null;
  total: number;
  status: string;
  payment_method: string | null;
  transaction_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  delivery_address: string | null;
  comment: string | null;
  created_at: string | null;
  card_last4: string | null;
};

type Ingredient = {
  id: number;
  name: string;
};

type OrderItem = {
  id: number;
  order_id: number;
  pizza_id: number;
  name: string;
  image: string;
  size_cm: number;
  qty: number;
  base_price: number;
  ingredients_price: number;
  unit_price: number;
  subtotal: number;
  ingredients?: Ingredient[];
};

type SortKey =
  | "date_desc"
  | "date_asc"
  | "total_desc"
  | "total_asc"
  | "id_desc"
  | "id_asc";

const statusOptions = [
  { value: "pending", label: "в очікуванні" },
  { value: "paid", label: "сплачено" },
  { value: "cooking", label: "готується" },
  { value: "delivering", label: "у доставці" },
  { value: "done", label: "готове" },
  { value: "canceled", label: "скасоване" },
];

const statusLabel = (s: string) =>
  statusOptions.find((x) => x.value === s)?.label || s;

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

const hasItems = (v: unknown): v is { items: OrderItem[] } =>
  isObject(v) && Array.isArray(v.items);

const hasOrderWrapped = (v: unknown): v is { order: OrderRow } =>
  isObject(v) && isObject(v.order) && typeof v.order.id === "number";

const hasOrderInline = (v: unknown): v is OrderRow =>
  isObject(v) && typeof v.id === "number" && typeof v.status === "string";

const field = (v?: string | null) => (v && v.trim() ? v : null);

export default function AdminOrdersPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderRow[]>([]);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState<SortKey>("date_desc");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [items, setItems] = useState<OrderItem[]>([]);

  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const token = useMemo(() => localStorage.getItem("token"), []);

  const api = useMemo(() => {
    return axios.create({
      baseURL: API,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
  }, [token]);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/admin/orders`);
      setOrders((res.data as OrderRow[]) || []);
    } catch (err: unknown) {
      if (axios.isAxiosError(err))
        toast.error(err.response?.data?.message || "Помилка завантаження");
      else toast.error("Помилка завантаження");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openDetails = async (o: OrderRow) => {
    if (!token) return;

    setIsModalOpen(true);
    setSelectedOrder(o);
    setItems([]);
    setDetailsLoading(true);

    try {
      const res = await api.get(`/api/admin/orders/${o.id}`);
      const data: unknown = res.data;

      if (hasItems(data)) setItems(data.items);
      else setItems([]);

      if (hasOrderWrapped(data)) setSelectedOrder(data.order);
      else if (hasOrderInline(data)) setSelectedOrder(data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err))
        toast.error(err.response?.data?.message || "Не вдалося завантажити деталі");
      else toast.error("Не вдалося завантажити деталі");
      setItems([]);
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
    setItems([]);
    setDetailsLoading(false);
  };

  const changeStatus = async (id: number, status: string) => {
    if (!token) return;

    const prev = orders;
    setUpdatingId(id);

    setOrders((p) => p.map((o) => (o.id === id ? { ...o, status } : o)));
    if (selectedOrder?.id === id) setSelectedOrder({ ...selectedOrder, status });

    try {
      await api.patch(`/api/admin/orders/${id}/status`, { status });
      toast.success("Статус оновлено");
    } catch (err: unknown) {
      setOrders(prev);
      if (selectedOrder?.id === id) {
        const old = prev.find((x) => x.id === id);
        if (old) setSelectedOrder(old);
      }
      if (axios.isAxiosError(err))
        toast.error(err.response?.data?.message || "Не вдалося змінити статус");
      else toast.error("Не вдалося змінити статус");
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteOrder = async (id: number) => {
    if (!token) return;

    const ok = window.confirm(`Видалити замовлення #${id}? Це дію не можна скасувати.`);
    if (!ok) return;

    const prev = orders;
    setDeletingId(id);

    setOrders((p) => p.filter((o) => o.id !== id));

    try {
      await api.delete(`/api/admin/orders/${id}`);
      toast.success("Замовлення видалено");
      if (selectedOrder?.id === id) closeModal();
    } catch (err: unknown) {
      setOrders(prev);
      if (axios.isAxiosError(err))
        toast.error(err.response?.data?.message || "Не вдалося видалити");
      else toast.error("Не вдалося видалити");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (s: string | null) => {
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const toTime = (x: string | null) => (x ? new Date(x).getTime() : 0);

    let list = [...orders];

    if (statusFilter !== "all") list = list.filter((o) => o.status === statusFilter);

    if (q) {
      list = list.filter((o) => {
        const id = String(o.id);
        const userId = String(o.user_id ?? "");
        const email = (o.email || "").toLowerCase();
        const tx = (o.transaction_id || "").toLowerCase();
        const phone = (o.customer_phone || "").toLowerCase();
        const name = (o.customer_name || "").toLowerCase();
        const addr = (o.delivery_address || "").toLowerCase();

        return (
          id.includes(q) ||
          userId.includes(q) ||
          email.includes(q) ||
          tx.includes(q) ||
          phone.includes(q) ||
          name.includes(q) ||
          addr.includes(q)
        );
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

  const modalOrder = selectedOrder;

  return (
    <div className={styles.page}>
      <PageLoader open={loading} text="Завантажуємо замовлення..." />

      <div className={styles.container}>
        <div className={styles.head}>
          <div>
            <h1 className={styles.title}>Замовлення</h1>
            <div className={styles.hint}>
              Знайдено: <b>{filtered.length}</b> / {orders.length}
            </div>
          </div>

          <div className={styles.headRight}>
            <button className={styles.refresh} onClick={load} disabled={loading}>
              Оновити
            </button>
          </div>
        </div>

        <div className={styles.toolbar}>
          <input
            className={styles.search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Пошук: #id, email, user id, транзакція, імʼя, телефон, адреса..."
          />

          <select
            className={styles.select}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">усі статуси</option>
            {statusOptions.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          <select
            className={styles.select}
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
          >
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
            filtered.map((o) => {
              const isUpdating = updatingId === o.id;
              const isDeleting = deletingId === o.id;

              return (
                <div key={o.id} className={styles.orderCard}>
                  <div className={styles.topRow}>
                    <div>
                      <div className={styles.orderId}>Замовлення #{o.id}</div>
                      <div className={styles.meta}>
                        {field(o.customer_name) ? o.customer_name : "Гість"} •{" "}
                        {field(o.customer_phone) ? o.customer_phone : "без телефону"} •{" "}
                        {formatDate(o.created_at)}
                      </div>
                    </div>

                    <div className={styles.right}>
                      <div className={styles.total}>{Number(o.total || 0).toFixed(2)} ₴</div>
                      <div className={styles.badge} data-status={o.status}>
                        {statusLabel(o.status)}
                      </div>
                    </div>
                  </div>

                  <div className={styles.infoGrid}>
                    <div className={styles.infoBox}>
                      <div className={styles.infoLabel}>Акаунт</div>
                      <div className={styles.infoValue}>
                        {field(o.email) ? (
                          <>
                            <div>{o.email}</div>
                            <div className={styles.meta}>
                              User ID: {o.user_id ?? "—"}
                              {o.user_role ? ` • ${o.user_role}` : ""}
                            </div>
                          </>
                        ) : (
                          <span className={styles.emptyPill}>Користувача не знайдено</span>
                        )}
                      </div>
                    </div>

                    <div className={styles.infoBox}>
                      <div className={styles.infoLabel}>Адреса доставки</div>
                      <div className={styles.infoValue}>
                        {field(o.delivery_address) ? (
                          o.delivery_address
                        ) : (
                          <span className={styles.emptyPill}>Не вказано</span>
                        )}
                      </div>
                    </div>

                    <div className={styles.infoBox}>
                      <div className={styles.infoLabel}>Оплата</div>
                      <div className={styles.infoValue}>
                        {o.payment_method || "—"}{" "}
                        {o.card_last4 ? `• **** ${o.card_last4}` : ""}
                      </div>
                    </div>

                    <div className={styles.infoBox}>
                      <div className={styles.infoLabel}>Транзакція</div>
                      <div className={styles.infoValue}>
                        {field(o.transaction_id) ? (
                          <span className={styles.mono}>{o.transaction_id}</span>
                        ) : (
                          <span className={styles.emptyPill}>Немає</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className={styles.actions}>
                    <select
                      className={styles.select}
                      value={o.status}
                      disabled={isUpdating || isDeleting}
                      onChange={(e) => changeStatus(o.id, e.target.value)}
                    >
                      {statusOptions.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>

                    <button
                      className={styles.detailsBtn}
                      disabled={isDeleting}
                      onClick={() => openDetails(o)}
                    >
                      Деталі
                    </button>

                    <button
                      className={styles.dangerBtn}
                      disabled={isUpdating || isDeleting}
                      onClick={() => deleteOrder(o.id)}
                    >
                      {isDeleting ? "Видаляємо..." : "Видалити"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay} onMouseDown={closeModal}>
          <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
            <div className={styles.modalHead}>
              <div>
                <div className={styles.modalTitle}>Замовлення #{modalOrder?.id ?? "—"}</div>
                <div className={styles.modalSub}>
                  {field(modalOrder?.customer_name) ? modalOrder!.customer_name : "Гість"} •{" "}
                  {field(modalOrder?.customer_phone) ? modalOrder!.customer_phone : "без телефону"}
                </div>
              </div>

              <button className={styles.modalClose} onClick={closeModal}>
                ✕
              </button>
            </div>

            <div className={styles.modalGrid}>
              <div className={styles.modalBox}>
                <div className={styles.modalLabel}>Акаунт користувача</div>
                <div className={styles.modalValue}>
                  {detailsLoading ? (
                    <span className={styles.skeletonLine} />
                  ) : field(modalOrder?.email) ? (
                    <>
                      <div>{modalOrder!.email}</div>
                      <div className={styles.meta}>
                        User ID: {modalOrder?.user_id ?? "—"}
                        {modalOrder?.user_role ? ` • ${modalOrder.user_role}` : ""}
                      </div>
                    </>
                  ) : (
                    <span className={styles.emptyPill}>Користувача не знайдено</span>
                  )}
                </div>
              </div>

              <div className={styles.modalBox}>
                <div className={styles.modalLabel}>Адреса</div>
                <div className={styles.modalValue}>
                  {detailsLoading ? (
                    <span className={styles.skeletonLine} />
                  ) : field(modalOrder?.delivery_address) ? (
                    modalOrder!.delivery_address
                  ) : (
                    <span className={styles.emptyPill}>Не вказано</span>
                  )}
                </div>
              </div>

              <div className={styles.modalBox}>
                <div className={styles.modalLabel}>Оплата</div>
                <div className={styles.modalValue}>
                  {detailsLoading ? (
                    <span className={styles.skeletonLineSm} />
                  ) : (
                    <>
                      {modalOrder?.payment_method || "—"}{" "}
                      {modalOrder?.card_last4 ? `• **** ${modalOrder.card_last4}` : ""}
                    </>
                  )}
                </div>
              </div>

              <div className={styles.modalBox}>
                <div className={styles.modalLabel}>Статус</div>
                <div className={styles.modalValue}>
                  {detailsLoading ? (
                    <span className={styles.skeletonPill} />
                  ) : (
                    <span className={styles.badge} data-status={modalOrder?.status || "pending"}>
                      {statusLabel(modalOrder?.status || "pending")}
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.modalBox}>
                <div className={styles.modalLabel}>Сума</div>
                <div className={styles.modalValue}>
                  {detailsLoading ? (
                    <span className={styles.skeletonLineSm} />
                  ) : (
                    `${Number(modalOrder?.total || 0).toFixed(2)} ₴`
                  )}
                </div>
              </div>
            </div>

            <div className={styles.modalDivider} />

            <div className={styles.itemsHead}>
              <div className={styles.itemsTitle}>Позиції</div>
              {detailsLoading && <div className={styles.detailsHint}>Завантаження...</div>}
            </div>

            {!detailsLoading && items.length === 0 ? (
              <div className={styles.detailsHint}>Немає позицій</div>
            ) : (
              <div className={styles.itemsList}>
                {items.map((it) => (
                  <div key={it.id} className={styles.itemRow}>
                    <img className={styles.itemImg} src={`${API}/assets/pizza/${it.image}`} alt={it.name} />

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

            <div className={styles.modalDivider} />

            <div className={styles.commentBox}>
              <div className={styles.modalLabel}>Коментар</div>
              <div className={styles.modalValue}>
                {detailsLoading ? (
                  <span className={styles.skeletonLine} />
                ) : field(modalOrder?.comment) ? (
                  modalOrder!.comment
                ) : (
                  <span className={styles.emptyPill}>Немає коментаря</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}