import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader, Package, ArrowLeft, Image as ImageIcon, Plus, Minus, ShoppingBag } from 'lucide-react';
import api from '../services/api';
import { useCart } from "../context/CartContext";

// Klasy CSS do ukrywania strzałek w polach number
const HIDE_ARROWS_CSS = `
/* Hide number arrows for Chrome, Safari, Edge, Opera */
.hide-number-arrows::-webkit-outer-spin-button,
.hide-number-arrows::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}
/* Hide number arrows for Firefox */
.hide-number-arrows {
    -moz-appearance: textfield;
}
`;


export default function ProductDetail() {
    const { slug } = useParams();
    const [product, setProduct] = useState(null);
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [quantity, setQuantity] = useState(1);
    const [mainImage, setMainImage] = useState(null);

    const { addToCart } = useCart();

    useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true);
            setError(null);
            try {
                // Pobranie podstawowych danych produktu po slug
                const productResponse = await api.get(`/products/slug/${slug}`);
                const productData = productResponse.data;
                setProduct(productData);

                // Pobranie obrazków
                const imagesResponse = await api.get(`/products/${productData.id}/images`);
                const allImages = imagesResponse.data || [];
                setImages(allImages);

                // Ustawienie głównego obrazka (miniatura lub pierwszy z listy)
                const thumbnail = allImages.find(img => img.isThumbnail) || allImages[0];
                setMainImage(thumbnail || { url: productData.thumbnailUrl });

            } catch (err) {
                // Obsługa błędu
                if (err.response?.status === 404) {
                    setError("Produkt nie został znaleziony.");
                } else {
                    setError("Wystąpił błąd podczas ładowania danych produktu.");
                }
                console.error("Błąd ładowania produktu:", err);
            } finally {
                setLoading(false);
            }
        };

        if (slug) {
            fetchProduct();
        }
    }, [slug]);

    // Formatowanie ceny
    const formatPrice = (price) => {
        return new Intl.NumberFormat('pl-PL', {
            style: 'currency',
            currency: 'PLN'
        }).format(price || 0);
    };

    // Dodawanie produktu do koszyka
    const handleAddToCart = () => {
        addToCart({ ...product, quantity });
    };

    // Logika dostępności
    const stockQuantity = product?.stockQuantity !== undefined ? product.stockQuantity : 10;
    const isAvailable = stockQuantity > 0;

    let stockMessage;
    let stockColor;
    const LOW_STOCK_THRESHOLD = 5;

    if (stockQuantity <= 0) {
        stockMessage = `Chwilowo niedostępny`;
        stockColor = 'text-red-600';
    } else if (stockQuantity <= LOW_STOCK_THRESHOLD) {
        stockMessage = `Na wyczerpaniu zapasów (pozostało ${stockQuantity} szt.)`;
        stockColor = 'text-orange-600';
    } else {
        stockMessage = `Dostępny`;
        stockColor = 'text-green-600';
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader className="h-8 w-8 animate-spin text-gray-600" />
                <span className="ml-2 text-gray-600">Ładowanie szczegółów produktu...</span>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center">
                <Package className="h-16 w-16 text-red-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{error || "Brak danych produktu."}</h3>
                <Link to="/products" className="text-blue-600 hover:text-blue-800 flex items-center mt-4">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Wróć do katalogu
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Wstrzyknięcie stylów ukrywających strzałki w polach number */}
            <style>{HIDE_ARROWS_CSS}</style>

            <div className="flex items-center mb-6 text-gray-600 hover:text-black transition-colors">
                <ArrowLeft className="h-4 w-4 mr-2" />
                <Link to="/products">Powrót do katalogu</Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white p-8 rounded-xl shadow-lg border border-gray-200">

                {/* Galeria */}
                <div>
                    {/* Główne zdjęcie */}
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center mb-4 border border-gray-300">
                        {mainImage?.url ? (
                            <img src={mainImage.url} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                            <ImageIcon className="h-16 w-16 text-gray-400" />
                        )}
                    </div>

                    {/* Miniaturki */}
                    {images.length > 1 && (
                        <div className="flex space-x-3 overflow-x-auto">
                            {images.map(img => (
                                <div
                                    key={img.id}
                                    className={`h-16 w-16 flex-shrink-0 border rounded-lg cursor-pointer transition-all ${img.id === mainImage?.id ? 'border-black ring-2 ring-black' : 'border-gray-300'
                                        }`}
                                    onClick={() => setMainImage(img)}
                                >
                                    <img
                                        src={img.url}
                                        alt={img.altText || product.name}
                                        className="w-full h-full object-cover rounded-lg"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="space-y-6">

                    <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
                    <p className="text-4xl font-extrabold text-black">{formatPrice(product.price)}</p>

                    <div className="border-b border-gray-200 pb-4 space-y-2">
                        <p className="text-gray-600">{product.shortDescription}</p>
                        <p className={`text-sm font-medium ${stockColor}`}>{stockMessage}</p>

                        <p className="text-sm text-gray-500">SKU: {product.sku || 'N/A'}</p>
                        <p className="text-sm text-gray-500">Kategoria: {product.category?.name || 'N/A'}</p>
                    </div>

                    {/* Dynamiczne atrybuty */}
                    {product.attributeValues && product.attributeValues.length > 0 && (
                        <div className="space-y-2 pt-2">
                            <h4 className="font-semibold text-gray-800 border-b border-gray-100 pb-1">Specyfikacja:</h4>
                            <dl className="space-y-1">
                                {product.attributeValues.map((attr, index) => (
                                    <div key={attr.id || index} className="flex text-sm">
                                        <dt className="font-medium text-gray-600 w-1/3">{attr.attributeName}:</dt>
                                        <dd className="text-gray-900 w-2/3">{attr.value}</dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    )}

                    {/* Logistyka */}
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <p className="flex justify-between text-sm">
                            <span className="text-gray-600">Koszt wysyłki:</span>
                            <span className="font-medium text-gray-900">{formatPrice(product.shippingCost)}</span>
                        </p>
                        <p className="flex justify-between text-sm">
                            <span className="text-gray-600">Szacowany czas dostawy:</span>
                            <span className="font-medium text-green-600">{product.estimatedDeliveryTime}</span>
                        </p>
                    </div>

                    {/* Przycisk zakupu z ilością */}
                    <div className="flex space-x-3 items-center">
                        {/* Kontrola Ilości */}
                        <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                            <button
                                type="button"
                                onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                                disabled={quantity <= 1 || !isAvailable}
                                className="p-3 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
                            >
                                <Minus className="h-4 w-4" />
                            </button>
                            <input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(Math.max(1, Math.min(stockQuantity, parseInt(e.target.value) || 1)))}
                                min="1"
                                max={stockQuantity}
                                className="w-16 text-center border-x border-gray-300 focus:outline-none hide-number-arrows"
                                disabled={!isAvailable}
                            />
                            <button
                                type="button"
                                onClick={() => setQuantity(prev => Math.min(stockQuantity, prev + 1))}
                                disabled={quantity >= stockQuantity || !isAvailable}
                                className="p-3 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Główny przycisk */}
                        <button
                            onClick={handleAddToCart}
                            disabled={!isAvailable || quantity > stockQuantity || quantity < 1}
                            className="flex-1 py-3 bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                        >
                            <ShoppingBag className="h-5 w-5" />
                            <span>{isAvailable ? 'Dodaj do koszyka' : 'Niedostępny'}</span>
                        </button>
                    </div>


                    {/* Pełny opis */}
                    <div className="pt-4 border-t border-gray-200">
                        <h4 className="font-semibold text-gray-800 mb-2">Pełny opis:</h4>
                        <p className="text-sm text-gray-600 whitespace-pre-line">{product.description}</p>
                    </div>

                </div>
            </div>
        </div>
    );
}