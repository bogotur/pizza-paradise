import { useEffect, useMemo, useState } from "react";
import styles from "../styles/IngredientsModal.module.css";
import { api } from "../api/api"

interface Ingredient {
  id: number;
  name: string;
  price: number;
  is_available: number;
}

interface Props {
  pizzaId: number;
  pizzaName: string;
  basePrice: number;
  quantity: number;
  onClose: () => void;

  onApply: (payload: { ingredientIds: number[]; ingredientsPrice: number }) => void;

  initialSelectedIds?: number[];
}

export default function IngredientsModal({
  pizzaId,
  pizzaName,
  basePrice,
  quantity,
  onClose,
  onApply,
  initialSelectedIds = [],
}: Props) {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set(initialSelectedIds));
  const [error, setError] = useState<string>("");

  useEffect(() => {
    setError("");
    api
      .get<Ingredient[]>(`/api/pizzas/${pizzaId}/ingredients`)
      .then((res) => setIngredients(res.data))
      .catch((e) => {
        console.error(e);
        setIngredients([]);
        setError("Не вдалося завантажити інгредієнти");
      });
  }, [pizzaId]);

  useEffect(() => {
    setSelected(new Set(initialSelectedIds));
  }, [pizzaId, initialSelectedIds]);

  const extrasSum = useMemo(() => {
    return ingredients
      .filter((i) => selected.has(i.id))
      .reduce((sum, i) => sum + Number(i.price), 0);
  }, [ingredients, selected]);

  const total = useMemo(() => {
    return (Number(basePrice) + extrasSum) * Number(quantity);
  }, [basePrice, extrasSum, quantity]);

  const toggle = (ingredient: Ingredient) => {
    if (ingredient.is_available === 0) return;

    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(ingredient.id)) next.delete(ingredient.id);
      else next.add(ingredient.id);
      return next;
    });
  };

  const handleApply = () => {
    onApply({
      ingredientIds: Array.from(selected),
      ingredientsPrice: extrasSum,
    });
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.close} onClick={onClose}>
          ✕
        </button>

        <h2 className={styles.title}>Інгредієнти</h2>
        <p className={styles.subtitle}>{pizzaName}</p>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.list}>
          {ingredients.map((ing) => {
            const active = selected.has(ing.id);
            const disabled = ing.is_available === 0;

            return (
              <div
                key={ing.id}
                className={`${styles.item} ${active ? styles.active : ""} ${
                  disabled ? styles.disabled : ""
                }`}
                onClick={() => toggle(ing)}
                role="button"
                aria-disabled={disabled}
              >
                <span>{ing.name}</span>
                <span>{disabled ? "Немає" : `+${ing.price}₴`}</span>
              </div>
            );
          })}
        </div>

        <div className={styles.footer}>
          <div className={styles.total}>
            Разом: <strong>{total.toFixed(2)}₴</strong>
          </div>

          <button className={styles.applyBtn} onClick={handleApply}>
            Застосувати (+{extrasSum.toFixed(0)}₴)
          </button>
        </div>
      </div>
    </div>
  );
}
