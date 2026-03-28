import { createContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export interface CartItem {
  cartId: string;
  pizzaId: number;
  name: string;
  image: string;
  size_cm: number;
  basePrice: number;
  quantity: number;
  ingredientIds: number[];
  ingredientsPrice: number;
}

type AddResult = { ok: true } | { ok: false; reason: "NOT_AUTH" };

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "cartId">) => AddResult;
  removeItem: (cartId: string) => void;
  changeQty: (cartId: string, delta: number) => void;
  clear: () => void;
  total: number;
  hydrated: boolean;
}

export const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => ({ ok: false, reason: "NOT_AUTH" }),
  removeItem: () => {},
  changeQty: () => {},
  clear: () => {},
  total: 0,
  hydrated: false,
});

const STORAGE_KEY = "pizza_cart_v1";

function makeCartId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function normalizeIngredientIds(ids: number[] = []) {
  return [...new Set(ids.map(Number).filter((id) => Number.isInteger(id) && id > 0))].sort(
    (a, b) => a - b
  );
}

function isSameCartItem(a: Omit<CartItem, "cartId">, b: CartItem) {
  const aIngredients = normalizeIngredientIds(a.ingredientIds);
  const bIngredients = normalizeIngredientIds(b.ingredientIds);

  return (
    Number(a.pizzaId) === Number(b.pizzaId) &&
    Number(a.size_cm) === Number(b.size_cm) &&
    aIngredients.length === bIngredients.length &&
    aIngredients.every((id, index) => id === bIngredients[index])
  );
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          const safeItems: CartItem[] = parsed
            .map((item) => ({
              cartId: String(item.cartId || makeCartId()),
              pizzaId: Number(item.pizzaId),
              name: String(item.name || ""),
              image: String(item.image || ""),
              size_cm: Number(item.size_cm),
              basePrice: Number(item.basePrice) || 0,
              quantity: Math.max(1, Number(item.quantity) || 1),
              ingredientIds: normalizeIngredientIds(item.ingredientIds || []),
              ingredientsPrice: Number(item.ingredientsPrice) || 0,
            }))
            .filter(
              (item) =>
                item.pizzaId > 0 &&
                item.name.trim() &&
                item.image.trim() &&
                item.size_cm > 0
            );

          setItems(safeItems);
        } else {
          setItems([]);
        }
      } else {
        setItems([]);
      }
    } catch {
      setItems([]);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem: CartContextType["addItem"] = (item) => {
    const token = localStorage.getItem("token");
    if (!token) {
      return { ok: false, reason: "NOT_AUTH" };
    }

    const safeItem: Omit<CartItem, "cartId"> = {
      pizzaId: Number(item.pizzaId),
      name: String(item.name || "").trim(),
      image: String(item.image || "").trim(),
      size_cm: Number(item.size_cm),
      basePrice: Number(item.basePrice) || 0,
      quantity: Math.max(1, Number(item.quantity) || 1),
      ingredientIds: normalizeIngredientIds(item.ingredientIds || []),
      ingredientsPrice: Number(item.ingredientsPrice) || 0,
    };

    setItems((prev) => {
      const existingIndex = prev.findIndex((x) => isSameCartItem(safeItem, x));

      if (existingIndex !== -1) {
        return prev.map((x, index) =>
          index === existingIndex
            ? { ...x, quantity: x.quantity + safeItem.quantity }
            : x
        );
      }

      return [...prev, { ...safeItem, cartId: makeCartId() }];
    });

    return { ok: true };
  };

  const removeItem = (cartId: string) => {
    setItems((prev) => prev.filter((x) => x.cartId !== cartId));
  };

  const changeQty = (cartId: string, delta: number) => {
    setItems((prev) =>
      prev.map((x) => {
        if (x.cartId !== cartId) return x;

        const nextQty = x.quantity + delta;
        return { ...x, quantity: nextQty < 1 ? 1 : nextQty };
      })
    );
  };

  const clear = () => setItems([]);

  const total = useMemo(() => {
    return items.reduce((sum, x) => {
      const onePizza = Number(x.basePrice) + Number(x.ingredientsPrice || 0);
      return sum + onePizza * Number(x.quantity);
    }, 0);
  }, [items]);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, changeQty, clear, total, hydrated }}
    >
      {children}
    </CartContext.Provider>
  );
}