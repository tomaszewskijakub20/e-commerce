import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { ShoppingCart, Trash2, ArrowRight, Minus, Plus, XCircle, LogIn, User } from "lucide-react";

export default function Cart() {
    const { cartItems, updateQuantity, getCartTotals, clearCart } = useCart();
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const { subtotal, shippingCost, total, count } = getCartTotals();

    const formatPrice = (price) => {
        return new Intl.NumberFormat('pl-PL', {
            style: 'currency',
            currency: 'PLN'
        }).format(price || 0);
    };

    const handleCheckout = () => {
        navigate("/checkout");
    };

    if (count === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-16">
                <ShoppingCart className="h-20 w-20 text-gray-400 mb-6" />
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Twój koszyk jest pusty</h1>
                <p className="text-gray-600 mb-8">Dodaj produkty, aby rozpocząć zakupy.</p>
                <Link to="/products" className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2">
                    Rozpocznij zakupy <ArrowRight className="h-4 w-4" />
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Koszyk ({count} {count === 1 ? 'produkt' : 'produktów'})</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Lewa kolumna: Lista produktów */}
                <div className="lg:col-span-2 space-y-6">
                    {cartItems.map((item) => (
                        <div key={item.productId} className="flex items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                             <Link to={`/product/${item.seoSlug}`} className="flex-shrink-0">
                                <img
                                    src={item.thumbnailUrl || '/api/placeholder/100/100'}
                                    alt={item.name}
                                    className="w-20 h-20 object-cover rounded-lg"
                                />
                            </Link>
                            <div className="flex-1 min-w-0 mx-4">
                                <Link to={`/product/${item.seoSlug}`} className="text-lg font-semibold text-gray-900 hover:text-blue-600 truncate">
                                    {item.name}
                                </Link>
                                <p className="text-sm text-gray-500">Cena: {formatPrice(item.price)}</p>
                            </div>
                            <div className="flex items-center space-x-2 border border-gray-300 rounded-lg p-1">
                                <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="text-gray-600 hover:bg-gray-100 p-1 rounded disabled:opacity-50" disabled={item.quantity <= 1}>
                                    <Minus className="h-4 w-4" />
                                </button>
                                <span className="font-medium w-6 text-center">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="text-gray-600 hover:bg-gray-100 p-1 rounded">
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="font-bold text-lg text-right w-24 ml-4">
                                {formatPrice(item.price * item.quantity)}
                            </div>
                            <button onClick={() => updateQuantity(item.productId, 0)} className="text-red-500 hover:text-red-700 ml-4 p-2 rounded-full hover:bg-red-50 transition-colors">
                                <Trash2 className="h-5 w-5" />
                            </button>
                        </div>
                    ))}
                     <div className="mt-6 flex justify-between">
                        <Link to="/products" className="text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-2">
                            <ArrowRight className="h-4 w-4 transform rotate-180" /> Kontynuuj zakupy
                        </Link>
                        <button onClick={clearCart} className="text-red-600 hover:text-red-800 font-medium flex items-center space-x-2">
                            <XCircle className="h-4 w-4" /> Wyczyść koszyk
                        </button>
                    </div>
                </div>

                {/* Prawa kolumna: Podsumowanie */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 sticky top-24">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-3">Podsumowanie</h2>
                        <div className="space-y-3 text-gray-700">
                            <div className="flex justify-between">
                                <span>Wartość produktów:</span>
                                <span className="font-medium">{formatPrice(subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Koszty wysyłki:</span>
                                <span className="font-medium">
                                    {shippingCost === 0.00 && subtotal > 0 ? (
                                        <>
                                            <span className="line-through text-gray-500 mr-2">{formatPrice(20.00)}</span>
                                            <span className="text-green-600">DARMOWA</span>
                                        </>
                                    ) : formatPrice(shippingCost)}
                                </span>
                            </div>
                        </div>
                        <div className="border-t border-gray-300 mt-4 pt-4 flex justify-between items-center">
                            <span className="text-xl font-bold text-gray-900">Do zapłaty:</span>
                            <span className="text-2xl font-extrabold text-black">{formatPrice(total)}</span>
                        </div>

                        {/* Obsługa Gościa i Użytkownika */}
                        <div className="mt-6 space-y-3">
                            <button
                                onClick={handleCheckout}
                                className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 shadow-md"
                            >
                                <span>{isAuthenticated ? "Przejdź do kasy" : "Kupuję jako gość"}</span>
                                <ArrowRight className="h-5 w-5" />
                            </button>
                            
                            {!isAuthenticated && (
                                <div className="text-center">
                                    <span className="text-sm text-gray-500 block mb-2">- lub -</span>
                                    <Link 
                                        to="/login" 
                                        state={{ from: '/checkout' }}
                                        className="w-full py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center justify-center space-x-2"
                                    >
                                        <LogIn className="h-4 w-4" />
                                        <span>Zaloguj się aby kupić</span>
                                    </Link>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Logując się zyskujesz historię zamówień i szybsze zakupy.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}