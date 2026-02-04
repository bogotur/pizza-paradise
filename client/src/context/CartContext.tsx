import { createContext, useEffect, useMemo, useState, ReactNode } from "react";

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
}

export const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => ({ ok: false, reason: "NOT_AUTH" }),
  removeItem: () => {},
  changeQty: () => {},
  clear: () => {},
  total: 0,
});

const STORAGE_KEY = "pizza_cart_v1";

function makeCartId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch {
        setItems([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem: CartContextType["addItem"] = (item) => {
    const token = localStorage.getItem("token");
    if (!token) {
      return { ok: false, reason: "NOT_AUTH" };
    }

    setItems((prev) => [...prev, { ...item, cartId: makeCartId() }]);
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
      const onePizza = Number(x.basePrice) + Number(x.ingredientsPrice);
      return sum + onePizza * Number(x.quantity);
    }, 0);
  }, [items]);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, changeQty, clear, total }}
    >
      {children}
    </CartContext.Provider>
  );
}
