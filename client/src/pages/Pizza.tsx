import React, { useEffect, useMemo, useState, useContext } from "react";
import toast from "react-hot-toast";
import styles from "../styles/Menu.module.css";
import IngredientsModal from "../components/IngredientsModal";
import { CartContext } from "../context/CartContext";
import LoginModal from "../components/LoginModal";
import { api } from "../api/api";

interface PizzaSize {
  size_cm: number;
  price: number;
}

interface Pizza {
  id: number;
  name: string;
  description: string;
  image: string;
  sizes: PizzaSize[];
  category: string;
}

const Pizza: React.FC = () => {
  const { addItem } = useContext(CartContext);

  const [pizzas, setPizzas] = useState<Pizza[]>([]);
  const [selectedSize, setSelectedSize] = useState<Map<number, PizzaSize>>(new Map());
  const [quantityMap, setQuantityMap] = useState<Map<number, number>>(new Map());
  const [activeCategory, setActiveCategory] = useState<string>("Показати всі");
  const categories: string[] = ["Показати всі", "М'ясна", "Класична", "Морська", "Сирна"];

  const [ingredientsPizzaId, setIngredientsPizzaId] = useState<number | null>(null);

  const [ingredientsPriceMap, setIngredientsPriceMap] = useState<Map<number, number>>(new Map());
  const [selectedIngredientIdsMap, setSelectedIngredientIdsMap] = useState<Map<number, number[]>>(
    new Map()
  );

  const [isLoginOpen, setIsLoginOpen] = useState(false);

  useEffect(() => {
    api
      .get("/api/menu/")
      .then((res) => {
        console.log("API response:", res.data);

        const data = res.data;

        const fetchedPizzas: Pizza[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.results)
          ? data.results
          : Array.isArray(data?.menu)
          ? data.menu
          : [];

        setPizzas(fetchedPizzas);

        const initialSizes = new Map<number, PizzaSize>(
          fetchedPizzas.map((pizza) => [
            pizza.id,
            pizza.sizes?.find((s) => s.size_cm === 28) || pizza.sizes?.[0],
          ])
        );

        const cleanedInitialSizes = new Map<number, PizzaSize>();
        initialSizes.forEach((value, key) => {
          if (value) cleanedInitialSizes.set(key, value);
        });
        setSelectedSize(cleanedInitialSizes);

        const initialQuantity = new Map<number, number>(
          fetchedPizzas.map((pizza) => [pizza.id, 1])
        );
        setQuantityMap(initialQuantity);
      })
      .catch((err) => {
        console.error("Error fetching pizzas:", err);
        setPizzas([]);
      });
  }, []);

  const handleCategoryChange = (category: string) => setActiveCategory(category);

  const handleSizeChange = (pizzaId: number, sizeObj: PizzaSize) => {
    setSelectedSize((prev) => new Map(prev).set(pizzaId, sizeObj));
  };

  const handleQuantityChange = (pizzaId: number, delta: number) => {
    setQuantityMap((prevMap) => {
      const newMap = new Map(prevMap);
      const currentQuantity = newMap.get(pizzaId) || 1;

      const newQuantity = currentQuantity + delta;
      if (newQuantity < 1) return prevMap;

      newMap.set(pizzaId, newQuantity);
      return newMap;
    });
  };

  const filteredPizzas = useMemo(() => {
    if (!Array.isArray(pizzas)) return [];
    if (activeCategory === "Показати всі") return pizzas;
    return pizzas.filter((pizza) => pizza.category === activeCategory);
  }, [pizzas, activeCategory]);

  const activePizza = useMemo(() => {
    if (ingredientsPizzaId === null) return null;
    return pizzas.find((p) => p.id === ingredientsPizzaId) || null;
  }, [ingredientsPizzaId, pizzas]);

  const activeBasePrice = useMemo(() => {
    if (ingredientsPizzaId === null) return 0;
    return selectedSize.get(ingredientsPizzaId)?.price || 0;
  }, [ingredientsPizzaId, selectedSize]);

  const activeQty = useMemo(() => {
    if (ingredientsPizzaId === null) return 1;
    return quantityMap.get(ingredientsPizzaId) || 1;
  }, [ingredientsPizzaId, quantityMap]);

  const activeInitialSelected = useMemo(() => {
    if (ingredientsPizzaId === null) return [];
    return selectedIngredientIdsMap.get(ingredientsPizzaId) || [];
  }, [ingredientsPizzaId, selectedIngredientIdsMap]);

  const handleApplyIngredients = (
    pizzaId: number,
    payload: { ingredientIds: number[]; ingredientsPrice: number }
  ) => {
    setIngredientsPriceMap((prev) => {
      const next = new Map(prev);
      next.set(pizzaId, payload.ingredientsPrice);
      return next;
    });

    setSelectedIngredientIdsMap((prev) => {
      const next = new Map(prev);
      next.set(pizzaId, payload.ingredientIds);
      return next;
    });
  };

  const pid = ingredientsPizzaId;

  return (
    <>
      <div className={styles.menuPage} id="menu-section">
        <div className={styles.container}>
          <h1 className={styles.pageTitle}>Меню</h1>

          <div className={styles.categoryButtons}>
            {categories.map((category) => (
              <button
                key={category}
                className={activeCategory === category ? styles.active : ""}
                onClick={() => handleCategoryChange(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <div className={styles.pizzaGrid}>
            {Array.isArray(filteredPizzas) &&
              filteredPizzas.map((pizza) => {
                const currentSize = selectedSize.get(pizza.id);
                const currentQuantity = quantityMap.get(pizza.id) || 1;

                const baseTotal = (currentSize?.price || 0) * currentQuantity;
                const extrasOne = ingredientsPriceMap.get(pizza.id) || 0;
                const extrasTotal = extrasOne * currentQuantity;
                const finalTotal = baseTotal + extrasTotal;

                return (
                  <div key={pizza.id} className={styles.pizzaCard}>
                    <img src={`${import.meta.env.VITE_API_URL}/assets/pizza/${pizza.image}`} alt={pizza.name} />
                    <h4>{pizza.name}</h4>
                    <p>{pizza.description}</p>

                    {pizza.sizes && pizza.sizes.length > 0 && (
                      <div className={styles.sizeSelection}>
                        {pizza.sizes.map((sizeObj) => (
                          <div
                            key={sizeObj.size_cm}
                            className={`${styles.sizeCircle} ${
                              currentSize?.size_cm === sizeObj.size_cm ? styles.selectedSize : ""
                            }`}
                            onClick={() => handleSizeChange(pizza.id, sizeObj)}
                          >
                            {sizeObj.size_cm}
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      className={styles.ingridientsBtn}
                      onClick={() => setIngredientsPizzaId(pizza.id)}
                    >
                      + Інгредієнти
                    </button>

                    <div className={styles.cardBottom}>
                      <div className={styles.priceAndQuantity}>
                        <span className={styles.price}>{finalTotal.toFixed(2)}₴</span>

                        <div className={styles.quantityControl}>
                          <button
                            type="button"
                            className={styles.quantityBtn}
                            onClick={() => handleQuantityChange(pizza.id, -1)}
                          >
                            -
                          </button>
                          <span className={styles.quantity}>{currentQuantity}</span>
                          <button
                            type="button"
                            className={styles.quantityBtn}
                            onClick={() => handleQuantityChange(pizza.id, 1)}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        className={styles.orderBtn}
                        onClick={() => {
                          const size = selectedSize.get(pizza.id);
                          if (!size) return;

                          const ingredientIds = selectedIngredientIdsMap.get(pizza.id) || [];
                          const ingredientsPrice = ingredientsPriceMap.get(pizza.id) || 0;

                          const result = addItem({
                            pizzaId: pizza.id,
                            name: pizza.name,
                            image: pizza.image,
                            size_cm: size.size_cm,
                            basePrice: size.price,
                            quantity: currentQuantity,
                            ingredientIds,
                            ingredientsPrice,
                          });

                          if (!result.ok && result.reason === "NOT_AUTH") {
                            setIsLoginOpen(true);
                            return;
                          }

                          toast.success("Товар додано в кошик");
                        }}
                      >
                        Замовити
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {pid !== null && activePizza && (
        <IngredientsModal
          pizzaId={pid}
          pizzaName={activePizza.name}
          basePrice={activeBasePrice}
          quantity={activeQty}
          initialSelectedIds={activeInitialSelected}
          onApply={(payload) => handleApplyIngredients(pid, payload)}
          onClose={() => setIngredientsPizzaId(null)}
        />
      )}

      {isLoginOpen && <LoginModal onClose={() => setIsLoginOpen(false)} />}
    </>
  );
};

export default Pizza;