import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Package, Search, X, Star, ChevronLeft, ChevronRight, Loader
} from "lucide-react";
import api from "../services/api";
import { useCart } from "../context/CartContext";

// Domyślne wartości sortowania i paginacji
const DEFAULT_SORT = 'name,asc';
const ITEMS_PER_PAGE = 12;

export default function ProductCatalog() {
  const { id } = useParams();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { addToCart } = useCart();

  // Filtry
  const [filters, setFilters] = useState({
    minPrice: "",
    maxPrice: "",
    sortBy: DEFAULT_SORT
  });

  // Paginacja
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);

  // Flaga, czy są aktywne filtry Search API (wyszukiwanie lub cena)
  const hasSearchOrPriceFilters = filters.minPrice || filters.maxPrice || searchTerm;

  // Resetuj stronę przy zmianie filtrów lub wyszukiwania
  useEffect(() => {
    setCurrentPage(0);
  }, [filters.minPrice, filters.maxPrice, searchTerm]);

  // Ładowanie produktów
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);

      try {
        let productsResponse;
        const params = new URLSearchParams();

        // Jeśli jest wyszukiwanie tekstowe lub filtry cenowe, używamy Search API (POST)
        if (hasSearchOrPriceFilters) {
          if (searchTerm) params.append('query', searchTerm);
          params.append('page', currentPage);
          params.append('size', ITEMS_PER_PAGE);

          if (filters.minPrice) params.append('minPrice', filters.minPrice);
          if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);

          productsResponse = await api.post(`/search?${params.toString()}`, {});

        } else {
          // Standardowe API (GET /api/products)
          const [sortByField, sortDir] = filters.sortBy.split(',');
          params.append('page', currentPage);
          params.append('size', ITEMS_PER_PAGE);
          params.append('sortBy', sortByField);
          params.append('sortDir', sortDir || 'asc');

          productsResponse = await api.get(`/products?${params.toString()}`);
        }

        const productsData = productsResponse.data;
        const productsList = productsData.content || [];
        setProducts(productsList);
        setTotalPages(productsData.totalPages || 1);
        setTotalProducts(productsData.totalElements || productsList.length);

      } catch (error) {
        console.error('Błąd ładowania produktów z API:', error.response || error);
        setProducts([]);
        setTotalPages(0);
        setTotalProducts(0);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      loadProducts();
    }, 500);

    return () => clearTimeout(timeoutId);

  }, [currentPage, filters, searchTerm, hasSearchOrPriceFilters]);

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const clearFilters = () => {
    setFilters({
      minPrice: "",
      maxPrice: "",
      sortBy: DEFAULT_SORT
    });
    setSearchTerm("");
  };

  const hasActiveFilters = filters.minPrice || filters.maxPrice || filters.sortBy !== DEFAULT_SORT || searchTerm;

  // --- ZAKTUALIZOWANA KARTA PRODUKTU (Flexbox + Sticky Footer) ---
  const ProductCard = ({ product }) => (
    <Link
      to={`/product/${product.seoSlug}`}
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all group flex flex-col h-full"
    >
      {/* Obrazek */}
      <div className="aspect-square overflow-hidden bg-gray-100 relative">
        <img
          src={product.thumbnailUrl || "/api/placeholder/300/300"}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {!product.isActive && (
           <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] px-2 py-1 rounded uppercase font-bold tracking-wider">
               Niedostępny
           </div>
        )}
      </div>

      {/* Treść */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600">
          {product.name}
        </h3>
        
        {/* Gwiazdki (jeśli używasz) - opcjonalne */}
        {/* <div className="mb-2">{renderStars(4)}</div> */}

        {/* Pusty element wypychający dół */}
        <div className="flex-grow"></div>

        {/* Sekcja dolna: Cena i Przycisk */}
        <div className="mt-4 space-y-3">
          <div className="text-lg font-bold text-gray-900">
            {typeof product.price === 'number' ? product.price.toFixed(2) : '0.00'} zł
          </div>

          <button
            onClick={(e) => {
              e.preventDefault();
              addToCart(product);
            }}
            className="w-full bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors font-medium flex items-center justify-center gap-2"
          >
            Dodaj do koszyka
          </button>
        </div>
      </div>
    </Link>
  );

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin mx-auto text-gray-600" />
          <p className="mt-4 text-gray-600">Ładowanie produktów...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Nagłówek */}
        <div className="mb-8 pt-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Katalog produktów
              </h1>
              <p className="text-gray-600 mt-2">
                Odkryj naszą kolekcję unikalnych produktów
              </p>
            </div>
            <div className="text-sm text-gray-600 hidden sm:block">
              Znaleziono {totalProducts} produktów
            </div>
          </div>
        </div>

        {/* Główny Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Kolumna Filtrów (1/4 szerokości) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-24">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-gray-900 text-lg">Filtry</h3>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                  >
                    <X className="h-4 w-4" />
                    Wyczyść
                  </button>
                )}
              </div>

              {/* Wyszukiwanie */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Szukaj produktów
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Nazwa lub opis..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                  />
                </div>
              </div>

              {/* Cena (Filtry min/max) */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Zakres cenowy (PLN)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-black focus:border-black"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-black focus:border-black"
                  />
                </div>
              </div>

              {/* Sortowanie */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Sortuj według
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black focus:border-black bg-white"
                >
                  <option value="name,asc">Nazwa A-Z</option>
                  <option value="name,desc">Nazwa Z-A</option>
                  <option value="price,asc">Cena: od najniższej</option>
                  <option value="price,desc">Cena: od najwyższej</option>
                </select>
              </div>
            </div>
          </div>

          {/* Kolumna Produktów (3/4 szerokości) */}
          <div className="lg:col-span-3">
            {products.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Paginacja */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center mt-12 space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 0))}
                      disabled={currentPage === 0}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Poprzednia
                    </button>

                    <div className="flex space-x-1">
                      {Array.from({ length: totalPages }, (_, i) => i).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-4 py-2 border rounded-lg text-sm font-medium ${currentPage === page
                            ? 'bg-black text-white border-black'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                          {page + 1}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages - 1))}
                      disabled={currentPage === totalPages - 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      Następna
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Nie znaleziono produktów</h3>
                <p className="text-gray-600 mb-6">Spróbuj zmienić kryteria wyszukiwania</p>
                <button
                  onClick={clearFilters}
                  className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Wyczyść filtry
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}