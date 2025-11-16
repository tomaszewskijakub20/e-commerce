import { useState, useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { 
  Package, Search, Filter, X, Star, ChevronLeft, ChevronRight, Loader 
} from "lucide-react";
import api from "../services/api";

export default function ProductCatalog() {
  const { id } = useParams(); // ID kategorii z URL
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Filtry
  const [filters, setFilters] = useState({
    categoryId: "all",
    priceRange: "all",
    sortBy: "name"
  });

  // Paginacja
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage] = useState(12);
  const [totalPages, setTotalPages] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);

  // Pobieranie danych
  useEffect(() => {
    loadData();
    if (id) {
      loadSelectedCategory();
    }
  }, [currentPage, id]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      let productsResponse;
      
      // Jeśli mamy ID kategorii, pobierz produkty z tej kategorii
      if (id) {
        // TODO: Dodać endpoint do pobierania produktów po kategorii
        // productsResponse = await api.get(`/categories/${id}/products?page=${currentPage}&size=${itemsPerPage}`);
        // Tymczasowo filtrujemy po stronie klienta
        productsResponse = await api.get(`/products?page=${currentPage}&size=1000`);
      } else {
        productsResponse = await api.get(`/products?page=${currentPage}&size=${itemsPerPage}`);
      }

      const productsData = productsResponse.data;
      let productsList = productsData.content || [];
      
      // Tymczasowe filtrowanie po kategorii po stronie klienta
      if (id) {
        productsList = productsList.filter(product => 
          product.categoryName?.toLowerCase().includes(selectedCategory?.name?.toLowerCase() || '')
        );
        // Paginacja po stronie klienta dla kategorii
        const startIndex = currentPage * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        productsList = productsList.slice(startIndex, endIndex);
        setTotalPages(Math.ceil(productsList.length / itemsPerPage));
      } else {
        setTotalPages(productsData.totalPages || 1);
      }
      
      setProducts(productsList);
      setTotalProducts(productsData.totalElements || productsList.length);

      // Pobierz kategorie tylko raz
      if (categories.length === 0) {
        const categoriesResponse = await api.get('/categories');
        setCategories(categoriesResponse.data);
      }

    } catch (error) {
      console.error('Błąd ładowania danych:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSelectedCategory = async () => {
    try {
      const response = await api.get(`/categories/${id}`);
      setSelectedCategory(response.data);
      // Ustaw filtr kategorii na wybraną kategorię
      setFilters(prev => ({ ...prev, categoryId: id }));
    } catch (error) {
      console.error('Błąd ładowania kategorii:', error);
    }
  };

  // Spłaszczanie kategorii dla dropdown
  const flattenCategories = (categoriesList, level = 0) => {
    let result = [];
    categoriesList.forEach(category => {
      result.push({
        ...category,
        displayName: '  '.repeat(level) + category.name
      });
      if (category.children && category.children.length > 0) {
        result = result.concat(flattenCategories(category.children, level + 1));
      }
    });
    return result;
  };

  const flatCategories = useMemo(() => 
    flattenCategories(categories), [categories]
  );

  // Filtrowanie i sortowanie produktów
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products];

    // Filtrowanie po wyszukiwaniu
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.shortDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.categoryName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrowanie po kategorii (jeśli nie jesteśmy w konkretnej kategorii)
    if (!id && filters.categoryId !== "all") {
      const selectedCategory = flatCategories.find(cat => cat.id == filters.categoryId);
      if (selectedCategory) {
        filtered = filtered.filter(product =>
          product.categoryName?.toLowerCase().includes(selectedCategory.name.toLowerCase())
        );
      }
    }

    // Filtrowanie po cenie
    if (filters.priceRange !== "all") {
      switch (filters.priceRange) {
        case "0-100":
          filtered = filtered.filter(p => p.price <= 100);
          break;
        case "100-500":
          filtered = filtered.filter(p => p.price > 100 && p.price <= 500);
          break;
        case "500-1000":
          filtered = filtered.filter(p => p.price > 500 && p.price <= 1000);
          break;
        case "1000+":
          filtered = filtered.filter(p => p.price > 1000);
          break;
      }
    }

    // Sortowanie
    switch (filters.sortBy) {
      case "price-asc":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "name":
      default:
        filtered.sort((a, b) => a.name?.localeCompare(b.name));
        break;
    }

    return filtered;
  }, [products, searchTerm, filters, flatCategories, id]);

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
    setCurrentPage(0);
  };

  const clearFilters = () => {
    setFilters({
      categoryId: id || "all", // Zachowaj kategorię jeśli jesteśmy w widoku kategorii
      priceRange: "all",
      sortBy: "name"
    });
    setSearchTerm("");
    setCurrentPage(0);
  };

  const hasActiveFilters = filters.priceRange !== "all" || 
                          filters.sortBy !== "name" || 
                          searchTerm ||
                          (filters.categoryId !== "all" && !id);

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const ProductCard = ({ product }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-square overflow-hidden bg-gray-100">
        <img
          src={product.thumbnailUrl || "/api/placeholder/300/300"}
          alt={product.name}
          className="w-full h-full object-cover hover:scale-105 transition-transform"
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
        
        <p className="text-gray-600 text-sm mb-2 line-clamp-2">
          {product.shortDescription}
        </p>
        
        <div className="flex items-center gap-2 mb-2">
          {renderStars(4.5)}
          <span className="text-xs text-gray-500">(0)</span>
        </div>
        
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg font-bold text-gray-900">
            {typeof product.price === 'number' ? product.price.toFixed(2) : '0.00'} zł
          </span>
        </div>
        
        <button className="w-full bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors font-medium">
          Dodaj do koszyka
        </button>
      </div>
    </div>
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
                {selectedCategory ? selectedCategory.name : 'Katalog produktów'}
              </h1>
              <p className="text-gray-600 mt-2">
                {selectedCategory ? selectedCategory.description : 'Odkryj naszą kolekcję unikalnych produktów'}
              </p>
              {selectedCategory && (
                <Link 
                  to="/products" 
                  className="text-sm text-blue-600 hover:text-blue-800 mt-1 inline-block"
                >
                  ← Wszystkie kategorie
                </Link>
              )}
            </div>
            <div className="text-sm text-gray-600">
              {selectedCategory ? 
                `Znaleziono ${filteredAndSortedProducts.length} produktów w kategorii` : 
                `Znaleziono ${filteredAndSortedProducts.length} produktów`}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Filtry - ukryj jeśli jesteśmy w konkretnej kategorii */}
          {!id && (
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

                {/* Kategorie */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Kategoria
                  </label>
                  <select
                    value={filters.categoryId}
                    onChange={(e) => handleFilterChange('categoryId', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                  >
                    <option value="all">Wszystkie kategorie</option>
                    {flatCategories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.displayName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cena */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Cena
                  </label>
                  <select
                    value={filters.priceRange}
                    onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                  >
                    <option value="all">Dowolna cena</option>
                    <option value="0-100">Do 100 zł</option>
                    <option value="100-500">100 - 500 zł</option>
                    <option value="500-1000">500 - 1000 zł</option>
                    <option value="1000+">Powyżej 1000 zł</option>
                  </select>
                </div>

                {/* Sortowanie */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Sortuj według
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                  >
                    <option value="name">Nazwa A-Z</option>
                    <option value="price-asc">Cena: od najniższej</option>
                    <option value="price-desc">Cena: od najwyższej</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Produkty */}
          <div className={id ? "lg:col-span-4" : "lg:col-span-3"}>
            {filteredAndSortedProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAndSortedProducts.map((product) => (
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
                          className={`px-4 py-2 border rounded-lg text-sm font-medium ${
                            currentPage === page
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