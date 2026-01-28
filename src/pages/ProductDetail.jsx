import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
    Loader, Package, ArrowLeft, Image as ImageIcon, 
    Plus, Minus, ShoppingBag, Tag, Shield 
} from 'lucide-react';
import api from '../services/api';
import { useCart } from "../context/CartContext";

const HIDE_ARROWS_CSS = `
.hide-number-arrows::-webkit-outer-spin-button,
.hide-number-arrows::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}
.hide-number-arrows {
    -moz-appearance: textfield;
}
`;

export default function ProductDetail() {
    const { slug } = useParams();
    
    const [product, setProduct] = useState(null);
    const [images, setImages] = useState([]);
    const [attributes, setAttributes] = useState([]); 
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [mainImage, setMainImage] = useState(null);

    const { addToCart } = useCart();

    useEffect(() => {
        const fetchProductData = async () => {
            setLoading(true);
            setError(null);
            try {
                // 1. Pobierz produkt po slugu
                const productResponse = await api.get(`/products/slug/${slug}`);
                const productData = productResponse.data;
                setProduct(productData);

                // Domyślnie bierzemy atrybuty z obiektu produktu (jeśli są)
                // Ale endpoint dedykowany jest ważniejszy
                let finalAttributes = productData.attributeValues || [];

                if (productData && productData.id) {
                    // 2. Pobierz zdjęcia i atrybuty z dedykowanych endpointów (tak jak w ProductView)
                    const [imagesResponse, attributesResponse] = await Promise.allSettled([
                        api.get(`/products/${productData.id}/images`),
                        api.get(`/product-attribute-values/product/${productData.id}`)
                    ]);

                    // Obsługa zdjęć
                    if (imagesResponse.status === 'fulfilled') {
                        const allImages = imagesResponse.value.data || [];
                        setImages(allImages);
                        
                        // Ustawienie głównego zdjęcia
                        const thumbnail = allImages.find(img => img.isThumbnail) || allImages[0];
                        setMainImage(thumbnail || { url: productData.thumbnailUrl });
                    } else {
                        setMainImage({ url: productData.thumbnailUrl });
                    }

                    // Obsługa atrybutów - NADPISUJEMY tym co przyszło z dedykowanego endpointu
                    // To rozwiązuje problem z pustymi wartościami, bo ProductView używa tego endpointu
                    if (attributesResponse.status === 'fulfilled' && Array.isArray(attributesResponse.value.data)) {
                        const fetchedAttributes = attributesResponse.value.data;
                        if (fetchedAttributes.length > 0) {
                            finalAttributes = fetchedAttributes;
                        }
                    }
                }

                setAttributes(finalAttributes);

            } catch (err) {
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
            fetchProductData();
        }
    }, [slug]);

    const formatPrice = (price) => {
        return new Intl.NumberFormat('pl-PL', {
            style: 'currency',
            currency: 'PLN'
        }).format(price || 0);
    };

    const handleAddToCart = () => {
        addToCart({ ...product, quantity });
    };

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
            <style>{HIDE_ARROWS_CSS}</style>

            <div className="flex items-center mb-6 text-gray-600 hover:text-black transition-colors">
                <ArrowLeft className="h-4 w-4 mr-2" />
                <Link to="/products">Powrót do katalogu</Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white p-6 md:p-8 rounded-xl shadow-lg border border-gray-200">

                {/* LEWA KOLUMNA: Galeria */}
                <div>
                    {/* GŁÓWNE ZDJĘCIE - Stały wymiar: 400px mobile / 500px desktop */}
                    <div className="w-full h-[400px] lg:h-[500px] bg-white rounded-lg border border-gray-200 flex items-center justify-center relative overflow-hidden mb-4">
                        {mainImage?.url ? (
                            <img 
                                src={mainImage.url} 
                                alt={product.name} 
                                className="w-full h-full object-contain p-2" 
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center text-gray-400">
                                <ImageIcon className="h-16 w-16 mb-2" />
                                <span className="text-sm">Brak zdjęcia</span>
                            </div>
                        )}
                        {!isAvailable && (
                            <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-md z-10">
                                WYPRZEDANY
                            </div>
                        )}
                    </div>

                    {/* MINIATURKI - Stały wymiar: 80x80px */}
                    {images.length > 1 && (
                        <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300">
                            {images.map(img => (
                                <button
                                    key={img.id}
                                    type="button"
                                    className={`relative w-20 h-20 flex-shrink-0 border rounded-lg overflow-hidden transition-all ${
                                        img.id === mainImage?.id 
                                        ? 'border-black ring-2 ring-black ring-offset-1' 
                                        : 'border-gray-200 hover:border-gray-400'
                                    }`}
                                    onClick={() => setMainImage(img)}
                                >
                                    <img
                                        src={img.url}
                                        alt={img.altText || product.name}
                                        className="w-full h-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* PRAWA KOLUMNA: Info */}
                <div className="flex flex-col h-full">

                    {/* Nagłówek i Cena */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                        <div className="flex items-end gap-4 mb-4">
                            <p className="text-4xl font-extrabold text-black">{formatPrice(product.price)}</p>
                            <span className={`text-sm font-medium mb-2 ${stockColor}`}>
                                ● {stockMessage}
                            </span>
                        </div>
                        <p className="text-gray-600 leading-relaxed border-b border-gray-100 pb-4">
                            {product.shortDescription}
                        </p>
                    </div>

                    {/* Wybór ilości i Przycisk */}
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 mb-8">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex border border-gray-300 rounded-lg overflow-hidden bg-white w-full sm:w-auto h-12">
                                <button
                                    type="button"
                                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                                    disabled={quantity <= 1 || !isAvailable}
                                    className="px-4 hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center justify-center"
                                >
                                    <Minus className="h-4 w-4" />
                                </button>
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(Math.max(1, Math.min(stockQuantity, parseInt(e.target.value) || 1)))}
                                    min="1"
                                    max={stockQuantity}
                                    className="w-16 text-center border-x border-gray-200 focus:outline-none hide-number-arrows font-medium h-full"
                                    disabled={!isAvailable}
                                />
                                <button
                                    type="button"
                                    onClick={() => setQuantity(prev => Math.min(stockQuantity, prev + 1))}
                                    disabled={quantity >= stockQuantity || !isAvailable}
                                    className="px-4 hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center justify-center"
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>

                            <button
                                onClick={handleAddToCart}
                                disabled={!isAvailable || quantity > stockQuantity || quantity < 1}
                                className="flex-1 h-12 bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition-transform active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2 shadow-lg"
                            >
                                <ShoppingBag className="h-5 w-5" />
                                <span>{isAvailable ? 'Dodaj do koszyka' : 'Niedostępny'}</span>
                            </button>
                        </div>

                        {/* Info logistyczne */}
                        <div className="mt-4 space-y-2 text-sm text-gray-500">
                            <p className="flex justify-between border-b border-gray-200 pb-1 border-dashed">
                                <span>Kategoria:</span> <span className="text-gray-700 font-medium">{product.category?.name || '-'}</span>
                            </p>
                            <p className="flex justify-between border-b border-gray-200 pb-1 border-dashed">
                                <span>Wysyłka:</span> <span className="text-gray-700">{formatPrice(product.shippingCost)}</span>
                            </p>
                            <p className="flex justify-between">
                                <span>Czas dostawy:</span> <span className="text-green-600 font-medium">{product.estimatedDeliveryTime}</span>
                            </p>
                        </div>
                    </div>

                    {/* Specyfikacja (Atrybuty) - ZGODNA Z PRODUCTVIEW */}
                    {attributes && attributes.length > 0 && (
                        <div className="mb-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                <Tag className="h-5 w-5 mr-2" /> Specyfikacja techniczna
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {attributes.map((attr, index) => (
                                    <div key={attr.id || index} className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex flex-col">
                                        <span className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1 flex items-center">
                                            {/* ZMIANA: Używamy attr.attributeName (jak w ProductView) */}
                                            {attr.attributeName}
                                            {attr.isKeyAttribute && <Shield className="h-3 w-3 ml-1 text-blue-500" />}
                                        </span>
                                        {/* ZMIANA: Używamy attr.attributeValue || attr.value (zabezpieczenie) */}
                                        <span className="font-medium text-gray-900 break-words">
                                            {attr.attributeValue || attr.value || '-'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Pełny opis */}
                    <div className="mt-auto">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Opis szczegółowy</h3>
                        <div className="text-gray-700 leading-relaxed whitespace-pre-line text-justify text-sm md:text-base">
                            {product.description}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}