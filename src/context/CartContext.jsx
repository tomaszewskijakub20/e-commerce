import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
    return useContext(CartContext);
};

// Lokalny klucz do przechowywania koszyka w przeglądarce
const CART_STORAGE_KEY = 'eShopCart';
const FREE_SHIPPING_THRESHOLD = 300.00; // Darmowa wysyłka od 300 zł

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState(() => {
        try {
            const storedCart = localStorage.getItem(CART_STORAGE_KEY);
            return storedCart ? JSON.parse(storedCart) : [];
        } catch (error) {
            console.error("Błąd odczytu localStorage dla koszyka:", error);
            return [];
        }
    });

    // Efekt do synchronizacji stanu z localStorage przy każdej zmianie
    useEffect(() => {
        try {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
        } catch (error) {
            console.error("Błąd zapisu localStorage dla koszyka:", error);
        }
    }, [cartItems]);

    // Dodaj produkt do koszyka
    const addToCart = (product) => {
        setCartItems(prevItems => {
            const existingItem = prevItems.find(item => item.productId === product.id);

            if (existingItem) {
                // Zwiększ ilość
                return prevItems.map(item =>
                    item.productId === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            } else {
                // Dodaj nowy produkt
                return [
                    ...prevItems,
                    {
                        productId: product.id,
                        name: product.name,
                        price: product.price,
                        quantity: 1,
                        thumbnailUrl: product.thumbnailUrl,
                        seoSlug: product.seoSlug,
                    }
                ];
            }
        });
    };

    // Zmień ilość produktu lub usuń
    const updateQuantity = (productId, newQuantity) => {
        setCartItems(prevItems => {
            if (newQuantity <= 0) {
                // Usuń produkt
                return prevItems.filter(item => item.productId !== productId);
            } else {
                // Zaktualizuj ilość
                return prevItems.map(item =>
                    item.productId === productId ? { ...item, quantity: newQuantity } : item
                );
            }
        });
    };

    // Obliczenie sumy koszyka
    const getCartTotals = () => {
        const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

        let shippingCost = 29.99; // Domyślny koszt wysyłki

        if (cartItems.length === 0) {
            shippingCost = 0.00;
        } else if (subtotal >= FREE_SHIPPING_THRESHOLD) {
            // Darmowa wysyłka powyżej 300 zł
            shippingCost = 0.00;
        }

        const total = subtotal + shippingCost;

        return { subtotal, shippingCost, total, count: cartItems.length };
    };

    const clearCart = () => {
        setCartItems([]);
    };

    const value = {
        cartItems,
        addToCart,
        updateQuantity,
        getCartTotals,
        clearCart,
        cartCount: cartItems.length
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};