import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { Search, Package } from "lucide-react";

export default function SearchResults() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    categoryId: "all",
    priceRange: "all",
    inStock: false,
    isFeatured: false
  });
  
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const query = searchParams.get('q') || '';

  // Pobieranie kategorii
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/categories');
        if (response.ok) {
          const categoriesData = await response.json();
          setCategories(categoriesData);
        }
      } catch (error) {
        console.error('Błąd pobierania kategorii:', error);
      }
    };

    fetchCategories();
  }, []);

  // TODO: Zamienić na prawdziwe API search gdy będzie gotowe
  // Tymczasowo pobieramy wszystkie produkty i filtrujemy lokalnie
  useEffect(() => {
    const searchProducts = async () => {
      if (!query) {
        setProducts([]);
        setFilteredProducts([]);
        return;
      }

      setLoading(true);
      try {
        // TODO: Zamienić na: /api/products/search?name=${query}
        const response = await fetch('http://localhost:8080/api/products');
        
        if (response.ok) {
          const data = await response.json();
          const allProducts = data.content || [];
          
          // Lokalne wyszukiwanie - do wymiany na API
          const searchResults = allProducts.filter(product => 
            product.name?.toLowerCase().includes(query.toLowerCase()) ||
            product.shortDescription?.toLowerCase().includes(query.toLowerCase()) ||
            product.categoryName?.toLowerCase().includes(query.toLowerCase())
          );
          
          setProducts(searchResults);
          setFilteredProducts(searchResults);
        }
      } catch (error) {
        console.error('Błąd wyszukiwania:', error);
        setProducts([]);
        setFilteredProducts([]);
      } finally {
        setLoading(false);
      }
    };

    searchProducts();
  }, [query]);

  // TODO: Zamienić na API filter gdy będzie gotowe
  const handleFilterChange = (filterName, value) => {
    const newFilters = { ...filters, [filterName]: value };
    setFilters(newFilters);
    
    let filtered = [...products];
    
    // Filtrowanie kategorii - do wymiany na API
    if (newFilters.categoryId !== "all") {
      filtered = filtered.filter(product => 
        product.categoryName?.toLowerCase().includes(
          categories.find(cat => cat.id == newFilters.categoryId)?.name?.toLowerCase() || ''
        )
      );
    }
    
    // Filtrowanie ceny - do wymiany na API
    if (newFilters.priceRange !== "all") {
      switch (newFilters.priceRange) {
        case "0-1000":
          filtered = filtered.filter(p => p.price <= 1000);
          break;
        case "1000-3000":
          filtered = filtered.filter(p => p.price > 1000 && p.price <= 3000);
          break;
        case "3000+":
          filtered = filtered.filter(p => p.price > 3000);
          break;
      }
    }
    
    // Filtrowanie dostępności - tymczasowe
    if (newFilters.inStock) {
      filtered = filtered.filter(p => p.inStock !== false);
    }
    
    // TODO: Dodać filtrowanie isFeatured gdy będzie w API
    
    setFilteredProducts(filtered);
  };

  const clearFilters = () => {
    setFilters({ 
      categoryId: "all", 
      priceRange: "all", 
      inStock: false,
      isFeatured: false 
    });
    setFilteredProducts(products);
  };

  // Pobieramy tylko kategorie końcowe (bez dzieci)
  const getLeafCategories = (categories) => {
    const leafCategories = [];
    
    const findLeaves = (categoryList) => {
      categoryList.forEach(category => {
        if (category.children && category.children.length > 0) {
          findLeaves(category.children);
        } else {
          leafCategories.push(category);
        }
      });
    };
    
    findLeaves(categories);
    return leafCategories;
  };

  const leafCategories = getLeafCategories(categories);
  const hasActiveFilters = filters.categoryId !== "all" || 
                          filters.priceRange !== "all" || 
                          filters.inStock;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Nagłówek */}
        <div className="mb-8 pt-8">
          <div className="flex items-center gap-3 mb-4">
            <Search className="h-8 w-8 text-gray-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              {query ? `Wyniki wyszukiwania dla: "${query}"` : 'Wyszukiwanie'}
            </h1>
          </div>
          
          {query && (
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>Znaleziono {filteredProducts.length} produktów</span>
            </div>
          )}
        </div>

        {!query ? (
          <div className="text-center py-16">
            <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Wpisz czego szukasz</h2>
            <p className="text-gray-600">Użyj pola wyszukiwania w górnym menu aby znaleźć produkty</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Filtry */}
            {products.length > 0 && (
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-24">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-semibold text-gray-900 text-lg">Filtry</h3>
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        Wyczyść
                      </button>
                    )}
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
                      {leafCategories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
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
                      <option value="0-1000">Do 1000 zł</option>
                      <option value="1000-3000">1000 - 3000 zł</option>
                      <option value="3000+">Powyżej 3000 zł</option>
                    </select>
                  </div>

                  {/* Dostępność */}
                  <div className="mb-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.inStock}
                        onChange={(e) => handleFilterChange('inStock', e.target.checked)}
                        className="rounded border-gray-300 text-black focus:ring-black"
                      />
                      <span className="ml-2 text-sm text-gray-700">Tylko dostępne</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Wyniki */}
            <div className={products.length > 0 ? "lg:col-span-3" : "lg:col-span-4"}>
              {loading ? (
                <div className="text-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
                  <p className="mt-4 text-gray-600">Wyszukiwanie produktów...</p>
                </div>
              ) : filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map(product => (
                    <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                      <div className="aspect-square overflow-hidden bg-gray-100">
                        <img 
                          src={product.thumbnailUrl || "/api/placeholder/200/200"} 
                          alt={product.name} 
                          className="w-full h-full object-cover hover:scale-105 transition-transform" 
                        />
                      </div>
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1">{product.name}</h3>
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-3">
                          {product.categoryName || 'Brak kategorii'}
                        </p>
                        
                        <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                          {product.shortDescription}
                        </p>
                        
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-lg font-bold text-gray-900">
                            {product.price?.toFixed(2)} zł
                          </span>
                        </div>
                        
                        <button className="w-full py-2 px-4 rounded-lg font-medium bg-black text-white hover:bg-gray-800 transition-colors">
                          Dodaj do koszyka
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : query ? (
                <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
                  <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Nie znaleziono produktów</h3>
                  <p className="text-gray-600 mb-6">Spróbuj zmienić kryteria wyszukiwania lub użyj innych słów kluczowych</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link 
                      to="/products"
                      className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      Zobacz wszystkie produkty
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}