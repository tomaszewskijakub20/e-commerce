import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Search as SearchIcon, Package, Loader, Filter, X, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../services/api";

export default function SearchResults() {
  const location = useLocation();
  const navigate = useNavigate();

  // Pobieramy parametry z paska adresu URL
  const searchParams = new URLSearchParams(location.search);
  const query = searchParams.get('q') || '';

  // Stan danych z API
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Stan filtrów i paginacji
  const [currentPage, setCurrentPage] = useState(0);
  const [categories, setCategories] = useState([]); // Do listy rozwijanej

  const [filters, setFilters] = useState({
    minPrice: searchParams.get('minPrice') || "",
    maxPrice: searchParams.get('maxPrice') || "",
  });

  // Stan sortowania
  const [sortOption, setSortOption] = useState(searchParams.get('sort') || "id,asc");

  // Pobierz listę kategorii (tylko do wyświetlenia w filtrach, jeśli potrzebne)
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories/active');
        setCategories(response.data); // Zakładamy, że to płaska lista lub drzewo
      } catch (error) {
        console.error('Błąd pobierania kategorii:', error);
      }
    };
    fetchCategories();
  }, []);

  // Resetuj stronę, gdy użytkownik wpisze nowe hasło w pasku wyszukiwania
  useEffect(() => {
    setCurrentPage(0);
    setFilters({
      minPrice: searchParams.get('minPrice') || "",
      maxPrice: searchParams.get('maxPrice') || "",
    });
  }, [query, location.search]);

  // Główma funkcja wyszukiwania
  useEffect(() => {
    const searchProducts = async () => {
      setLoading(true);
      try {
        // Budowanie parametrów URL
        const params = new URLSearchParams();

        if (query) params.append('query', query);
        params.append('page', currentPage);
        params.append('size', 12); // Ilość na stronę

        if (filters.minPrice) params.append('minPrice', filters.minPrice);
        if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);

        params.append('sort', sortOption);

        // Wywołanie POST /api/search
        const response = await api.post(`/search?${params.toString()}`, {});

        const data = response.data;
        setProducts(data.content || []);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);

      } catch (error) {
        console.error('Błąd wyszukiwania:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce - opóźnienie zapytania przy szybkim pisaniu/klikaniu
    const timeoutId = setTimeout(() => {
      searchProducts();
    }, 300);

    return () => clearTimeout(timeoutId);

  }, [query, currentPage, filters, sortOption]);

  // Obsługa zdarzeń

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(0); // Po zmianie filtra wracamy na 1 stronę
  };

  const clearFilters = () => {
    setFilters({ minPrice: "", maxPrice: "" });
    setSortOption("id,asc");
    setCurrentPage(0);
    // Aktualizujemy URL, usuwając filtry, ale zostawiając query
    navigate({ pathname: location.pathname, search: `?q=${query}` });
  };

  const handleProductClick = (seoSlug) => {
    // Nawigacja do nowej trasy /product/:slug
    navigate(`/product/${seoSlug}`);
  };

  // Funkcja pomocnicza do wyświetlania kategorii w select (jeśli drzewo)
  const flattenCategories = (cats, level = 0) => {
    let result = [];
    cats.forEach(cat => {
      result.push({ ...cat, level });
      if (cat.children) {
        result = result.concat(flattenCategories(cat.children, level + 1));
      }
    });
    return result;
  };
  const flatCategories = flattenCategories(categories);

  // Karta produktu (MOCK - ZASTĄPIĆ faktycznym komponentem ProductCard)
  const ProductCard = ({ product }) => (
    <div
      key={product.id}
      onClick={() => handleProductClick(product.seoSlug)}
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
    >
      <div className="aspect-square overflow-hidden bg-gray-100 relative">
        {product.thumbnailUrl ? (
          <img
            src={product.thumbnailUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-12 w-12 text-gray-300" />
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="text-xs text-gray-500 mb-1">{product.categoryName}</div>
        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
          {product.name}
        </h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {product.shortDescription}
        </p>
        <div className="flex items-center justify-between mt-auto">
          <span className="text-lg font-bold text-gray-900">
            {product.price ? new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(product.price) : '0,00 zł'}
          </span>
        </div>
      </div>
    </div>
  );


  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Nagłówek i Sortowanie */}
        <div className="mb-8 pt-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <SearchIcon className="h-8 w-8 text-gray-600" />
              <h1 className="text-3xl font-bold text-gray-900">
                {query ? `Wyniki dla: "${query}"` : 'Wyszukiwanie'}
              </h1>
            </div>
            <p className="text-sm text-gray-600 ml-11">
              Znaleziono {totalElements} produktów
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Sortuj:</label>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="border border-gray-300 rounded-md text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="id,asc">Domyślne</option>
              <option value="price,asc">Cena: Rosnąco</option>
              <option value="price,desc">Cena: Malejąco</option>
              <option value="name_sort,asc">Nazwa: A-Z</option>
              <option value="name_sort,desc">Nazwa: Z-A</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* LEWY PANEL: Filtry */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-24">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                  <Filter className="h-5 w-5" /> Filtry
                </h3>
                {(filters.minPrice || filters.maxPrice) && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
                  >
                    <X className="h-3 w-3" /> Wyczyść
                  </button>
                )}
              </div>

              {/* Cena */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Cena (PLN)
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    name="minPrice"
                    placeholder="Od"
                    value={filters.minPrice}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-black focus:border-black"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="number"
                    name="maxPrice"
                    placeholder="Do"
                    value={filters.maxPrice}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-black focus:border-black"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* PRAWY PANEL: Wyniki */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="text-center py-16">
                <Loader className="h-12 w-12 animate-spin text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Przeszukiwanie katalogu...</p>
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                    />
                  ))}
                </div>

                {/* Paginacja */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-12 gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                      disabled={currentPage === 0}
                      className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50 bg-white"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <span className="px-4 py-2 bg-white border border-gray-300 rounded-md flex items-center text-sm">
                      Strona {currentPage + 1} z {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={currentPage === totalPages - 1}
                      className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50 bg-white"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
                <SearchIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Nie znaleziono produktów</h3>
                <p className="text-gray-600 mb-6">
                  Nie znaleźliśmy produktów pasujących do zapytania "{query}" przy wybranych filtrach.
                </p>
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