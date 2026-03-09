import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

import PageLoader from "../../components/PageLoader";
import styles from "../../styles/AdminUsersPage.module.css";

const API = "http://localhost:5000";

type UserRow = {
  id: number;
  email: string;
  role: string;
  created_at: string | null;
  orders_count: number;
  total_spent: number;
  last_order_at: string | null;
};

type UserOrder = {
  id: number;
  total: number;
  status: string;
  payment_method: string | null;
  transaction_id: string | null;
  card_last4: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  delivery_address: string | null;
  comment: string | null;
  created_at: string | null;
};

type SortKey =
  | "id_desc"
  | "id_asc"
  | "date_desc"
  | "date_asc"
  | "orders_desc"
  | "orders_asc"
  | "spent_desc"
  | "spent_asc";

const roleOptions = [
  { value: "all", label: "усі ролі" },
  { value: "admin", label: "admin" },
  { value: "user", label: "user" },
];

const statusLabel = (s: string) => {
  const map: Record<string, string> = {
    pending: "в очікуванні",
    paid: "сплачено",
    cooking: "готується",
    delivering: "у доставці",
    done: "готове",
    canceled: "скасоване",
  };
  return map[s] || s;
};

export default function AdminUsersPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserRow[]>([]);

  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sort, setSort] = useState<SortKey>("id_desc");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [userOrders, setUserOrders] = useState<UserOrder[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [updatingId, setUpdatingId] = useState<number | null>(null);

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
      const res = await api.get("/api/admin/users");
      setUsers((res.data as UserRow[]) || []);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Помилка завантаження користувачів");
      } else {
        toast.error("Помилка завантаження користувачів");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openDetails = async (user: UserRow) => {
    if (!token) return;

    setIsModalOpen(true);
    setSelectedUser(user);
    setUserOrders([]);
    setDetailsLoading(true);

    try {
      const res = await api.get(`/api/admin/users/${user.id}`);
      setSelectedUser(res.data.user || user);
      setUserOrders(Array.isArray(res.data.orders) ? res.data.orders : []);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Не вдалося завантажити деталі");
      } else {
        toast.error("Не вдалося завантажити деталі");
      }
      setUserOrders([]);
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setUserOrders([]);
    setDetailsLoading(false);
  };

  const changeRole = async (id: number, role: string) => {
    if (!token) return;

    const prev = users;
    setUpdatingId(id);

    setUsers((p) => p.map((u) => (u.id === id ? { ...u, role } : u)));
    if (selectedUser?.id === id) setSelectedUser({ ...selectedUser, role });

    try {
      await api.patch(`/api/admin/users/${id}/role`, { role });
      toast.success("Роль оновлено");
    } catch (err: unknown) {
      setUsers(prev);

      const old = prev.find((x) => x.id === id);
      if (old && selectedUser?.id === id) setSelectedUser(old);

      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Не вдалося змінити роль");
      } else {
        toast.error("Не вдалося змінити роль");
      }
    } finally {
      setUpdatingId(null);
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

    let list = [...users];

    if (roleFilter !== "all") {
      list = list.filter((u) => u.role === roleFilter);
    }

    if (q) {
      list = list.filter((u) => {
        return (
          String(u.id).includes(q) ||
          (u.email || "").toLowerCase().includes(q) ||
          (u.role || "").toLowerCase().includes(q)
        );
      });
    }

    list.sort((a, b) => {
      if (sort === "id_desc") return b.id - a.id;
      if (sort === "id_asc") return a.id - b.id;
      if (sort === "date_desc") return toTime(b.created_at) - toTime(a.created_at);
      if (sort === "date_asc") return toTime(a.created_at) - toTime(b.created_at);
      if (sort === "orders_desc") return Number(b.orders_count || 0) - Number(a.orders_count || 0);
      if (sort === "orders_asc") return Number(a.orders_count || 0) - Number(b.orders_count || 0);
      if (sort === "spent_desc") return Number(b.total_spent || 0) - Number(a.total_spent || 0);
      if (sort === "spent_asc") return Number(a.total_spent || 0) - Number(b.total_spent || 0);
      return 0;
    });

    return list;
  }, [users, query, roleFilter, sort]);

  return (
    <div className={styles.page}>
      <PageLoader open={loading} text="Завантажуємо користувачів..." />

      <div className={styles.container}>
        <div className={styles.head}>
          <div>
            <h1 className={styles.title}>Користувачі</h1>
            <div className={styles.hint}>
              Знайдено: <b>{filtered.length}</b> / {users.length}
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
            placeholder="Пошук: id, email, role..."
          />

          <select
            className={styles.select}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            {roleOptions.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>

          <select
            className={styles.select}
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
          >
            <option value="id_desc">id: більший → менший</option>
            <option value="id_asc">id: менший → більший</option>
            <option value="date_desc">дата: нові → старі</option>
            <option value="date_asc">дата: старі → нові</option>
            <option value="orders_desc">замовлень: більше → менше</option>
            <option value="orders_asc">замовлень: менше → більше</option>
            <option value="spent_desc">сума: більша → менша</option>
            <option value="spent_asc">сума: менша → більша</option>
          </select>
        </div>

        <div className={styles.list}>
          {filtered.length === 0 ? (
            <div className={styles.empty}>Нічого не знайдено</div>
          ) : (
            filtered.map((u) => {
              const isUpdating = updatingId === u.id;

              return (
                <div key={u.id} className={styles.userCard}>
                  <div className={styles.topRow}>
                    <div>
                      <div className={styles.userId}>Користувач #{u.id}</div>
                      <div className={styles.email}>{u.email}</div>
                      <div className={styles.meta}>Зареєстрований: {formatDate(u.created_at)}</div>
                    </div>

                    <div className={styles.right}>
                      <div className={styles.total}>
                        {Number(u.total_spent || 0).toFixed(2)} ₴
                      </div>
                      <div className={styles.badge} data-role={u.role}>
                        {u.role}
                      </div>
                    </div>
                  </div>

                  <div className={styles.infoGrid}>
                    <div className={styles.infoBox}>
                      <div className={styles.infoLabel}>Замовлень</div>
                      <div className={styles.infoValue}>{Number(u.orders_count || 0)}</div>
                    </div>

                    <div className={styles.infoBox}>
                      <div className={styles.infoLabel}>Останнє замовлення</div>
                      <div className={styles.infoValue}>{formatDate(u.last_order_at)}</div>
                    </div>

                    <div className={styles.infoBox}>
                      <div className={styles.infoLabel}>Роль</div>
                      <div className={styles.infoValue}>{u.role}</div>
                    </div>
                  </div>

                  <div className={styles.actions}>
                    <select
                      className={styles.select}
                      value={u.role}
                      disabled={isUpdating}
                      onChange={(e) => changeRole(u.id, e.target.value)}
                    >
                      <option value="admin">admin</option>
                      <option value="user">user</option>
                    </select>

                    <button className={styles.detailsBtn} onClick={() => openDetails(u)}>
                      Деталі
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
                <div className={styles.modalTitle}>
                  {selectedUser ? `Користувач #${selectedUser.id}` : "Користувач"}
                </div>
                <div className={styles.modalSub}>{selectedUser?.email || "—"}</div>
              </div>

              <button className={styles.modalClose} onClick={closeModal}>
                ✕
              </button>
            </div>

            <div className={styles.modalGrid}>
              <div className={styles.modalBox}>
                <div className={styles.modalLabel}>Email</div>
                <div className={styles.modalValue}>
                  {detailsLoading ? <span className={styles.skeletonLine} /> : selectedUser?.email || "—"}
                </div>
              </div>

              <div className={styles.modalBox}>
                <div className={styles.modalLabel}>Роль</div>
                <div className={styles.modalValue}>
                  {detailsLoading ? <span className={styles.skeletonLineSm} /> : selectedUser?.role || "—"}
                </div>
              </div>

              <div className={styles.modalBox}>
                <div className={styles.modalLabel}>Дата реєстрації</div>
                <div className={styles.modalValue}>
                  {detailsLoading ? <span className={styles.skeletonLineSm} /> : formatDate(selectedUser?.created_at || null)}
                </div>
              </div>

              <div className={styles.modalBox}>
                <div className={styles.modalLabel}>Всього замовлень</div>
                <div className={styles.modalValue}>
                  {detailsLoading ? <span className={styles.skeletonLineSm} /> : Number(selectedUser?.orders_count || 0)}
                </div>
              </div>

              <div className={styles.modalBox}>
                <div className={styles.modalLabel}>Загальна сума</div>
                <div className={styles.modalValue}>
                  {detailsLoading ? <span className={styles.skeletonLineSm} /> : `${Number(selectedUser?.total_spent || 0).toFixed(2)} ₴`}
                </div>
              </div>

              <div className={styles.modalBox}>
                <div className={styles.modalLabel}>Останнє замовлення</div>
                <div className={styles.modalValue}>
                  {detailsLoading ? <span className={styles.skeletonLineSm} /> : formatDate(selectedUser?.last_order_at || null)}
                </div>
              </div>
            </div>

            <div className={styles.modalDivider} />

            <div className={styles.itemsHead}>
              <div className={styles.itemsTitle}>Замовлення користувача</div>
              {detailsLoading && <div className={styles.detailsHint}>Завантаження...</div>}
            </div>

            {!detailsLoading && userOrders.length === 0 ? (
              <div className={styles.detailsHint}>У користувача ще немає замовлень</div>
            ) : (
              <div className={styles.ordersList}>
                {userOrders.map((order) => (
                  <div key={order.id} className={styles.orderRow}>
                    <div className={styles.orderMain}>
                      <div className={styles.orderName}>Замовлення #{order.id}</div>
                      <div className={styles.orderMeta}>
                        {formatDate(order.created_at)} • {order.customer_name || "Без імені"} •{" "}
                        {order.customer_phone || "Без телефону"}
                      </div>
                      <div className={styles.orderMeta}>
                        {order.delivery_address || "Адреса не вказана"}
                      </div>
                    </div>

                    <div className={styles.orderSide}>
                      <div className={styles.orderTotal}>
                        {Number(order.total || 0).toFixed(2)} ₴
                      </div>
                      <div className={styles.orderStatus} data-status={order.status}>
                        {statusLabel(order.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}