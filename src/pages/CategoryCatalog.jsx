import { useState, useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Loader, Folder, ShoppingBag, ChevronRight,
  ChevronLeft, Package
} from "lucide-react";
import api from "../services/api";
import { useCart } from "../context/CartContext";

const ITEMS_PER_PAGE = 9;

export default function CategoryCatalog() {
  const { id } = useParams(); 
  const { addToCart } = useCart();

  // Stan kategorii
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  
  // Stan wybranej kategorii
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Stan produktów
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  // Pobieranie drzewa kategorii
  useEffect(() => {
    const loadAllCategories = async () => {
      setLoadingCategories(true);
      try {
        const response = await api.get('/categories/active');
        setCategories(response.data || []);
      } catch (err) {
        console.error('Błąd kategorii:', err);
      } finally {
        setLoadingCategories(false);
      }
    };
    loadAllCategories();
  }, []);

  // Logika wyboru kategorii na podstawie URL
  
  // Funkcja szukająca w drzewie
  const findCategoryById = (categoriesList, idToFind) => {
    for (const cat of categoriesList) {
      if (cat.id == idToFind) return cat;
      if (cat.children && cat.children.length > 0) {
        const found = findCategoryById(cat.children, idToFind);
        if (found) return found;
      }
    }
    return null;
  };

  useEffect(() => {
    if (id && categories.length > 0) {
      const found = findCategoryById(categories, id);
      if (found) {
        setSelectedCategory(found);
      } else {

        setSelectedCategory({ id: id, name: "Kategoria", description: "" });
      }
    }
  }, [id, categories]);


  // Pobieranie produktów
  useEffect(() => {
    const targetId = selectedCategory?.id || id;
    if (!targetId) return;

    const loadProducts = async () => {
      setLoadingProducts(true);
      try {
        const params = new URLSearchParams();
        params.append('page', currentPage);
        params.append('size', ITEMS_PER_PAGE);
        
        const response = await api.get(`/products/category/${targetId}?${params.toString()}`);
        
        const data = response.data;
        setProducts(data.content || []);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);

      } catch (err) {
        console.error('Błąd produktów:', err);
        setProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    };

    loadProducts();
  }, [selectedCategory, id, currentPage]);


  // --- HELPERY DO DRZEWA ---
  const flattenCategories = (categoriesList, level = 0) => {
    let result = [];
    if (!Array.isArray(categoriesList)) return result;
    // Sortowanie alfabetyczne
    const sortedList = [...categoriesList].sort((a, b) => a.name.localeCompare(b.name, 'pl'));

    sortedList.forEach(category => {
      result.push({
        ...category,
        level: level,
        displayName: category.name
      });
      if (category.children && category.children.length > 0) {
        result = result.concat(flattenCategories(category.children, level + 1));
      }
    });
    return result;
  };

  const flatCategories = useMemo(() => flattenCategories(categories), [categories]);


  // --- WIDOKI ---

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Katalog produktów</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* LEWA KOLUMNA: Drzewo Kategorii */}
          <div className="w-full lg:w-1/4 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden sticky top-24">
              <div className="p-4 border-b bg-gray-50">
                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                  <Folder className="h-4 w-4" /> Kategorie
                </h3>
              </div>
              
              {loadingCategories ? (
                 <div className="p-8 flex justify-center"><Loader className="animate-spin h-5 w-5 text-gray-400"/></div>
              ) : (
                <ul className="max-h-[80vh] overflow-y-auto py-2">
                  {flatCategories.map(category => (
                    <li key={category.id}>
                      <Link
                        to={`/category/${category.id}`} 
                        onClick={() => setCurrentPage(0)} // Reset paginacji przy zmianie
                        className={`w-full text-left flex items-center py-2.5 px-4 transition-colors text-sm
                          ${(selectedCategory?.id == category.id || id == category.id)
                            ? 'bg-black text-white font-medium' 
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                          }`}
                        style={{ paddingLeft: `${(category.level * 16) + 16}px` }}
                      >
                        <span className="truncate">{category.displayName}</span>
                        {(selectedCategory?.id == category.id || id == category.id) && (
                          <ChevronRight className="h-4 w-4 ml-auto text-white" />
                        )}
                      </Link>
                    </li>
                  ))}
                  {flatCategories.length === 0 && (
                      <li className="p-4 text-sm text-gray-500 text-center">Brak kategorii</li>
                  )}
                </ul>
              )}
            </div>
          </div>

          {/* PRAWA KOLUMNA: Produkty */}
          <div className="w-full lg:w-3/4">
            {!id ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center min-h-[400px] flex flex-col items-center justify-center">
                <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Wybierz kategorię</h3>
                <p className="text-gray-500 mt-1">Wybierz kategorię z listy po lewej stronie, aby zobaczyć produkty.</p>
              </div>
            ) : (
              <div>
                {/* Nagłówek Kategorii */}
                <div className="mb-6 border-b pb-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-gray-900">
                            {selectedCategory?.name || "Produkty"}
                        </h2>
                        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                            Wyników: {totalElements}
                        </span>
                    </div>
                    {selectedCategory?.description && (
                        <p className="text-gray-600 mt-2 text-sm">{selectedCategory.description}</p>
                    )}
                </div>

                {loadingProducts ? (
                  <div className="flex justify-center py-20">
                    <Loader className="h-10 w-10 animate-spin text-gray-400" />
                  </div>
                ) : products.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {products.map((product) => (
                        <div 
                          key={product.id}
                          className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all group flex flex-col h-full relative"
                        >
                            <Link to={`/product/${product.seoSlug}`} className="block">
                              <div className="aspect-square bg-gray-100 overflow-hidden relative">
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
                            </Link>
                          
                          <div className="p-4 flex flex-col flex-grow">
                            <Link to={`/product/${product.seoSlug}`}>
                                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 min-h-[3rem]">
                                {product.name}
                                </h3>
                            </Link>

                            <div className="flex-grow"></div>

                            <div className="mt-4 space-y-3">
                                <div className="text-lg font-bold text-gray-900">
                                    {typeof product.price === 'number' ? product.price.toFixed(2) : '0.00'} zł
                                </div>
                                <button
                                    onClick={() => addToCart(product)}
                                    className="w-full bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors font-medium flex items-center justify-center gap-2 active:scale-95"
                                >
                                    <ShoppingBag className="h-4 w-4" />
                                    Dodaj do koszyka
                                </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Paginacja */}
                    {totalPages > 1 && (
                      <div className="flex justify-center items-center mt-12 gap-4">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 0))}
                          disabled={currentPage === 0}
                          className="p-2 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <span className="text-sm font-medium text-gray-700">
                          Strona {currentPage + 1} z {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages - 1))}
                          disabled={currentPage === totalPages - 1}
                          className="p-2 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-white rounded-lg p-16 text-center border border-dashed border-gray-300 mt-4">
                    <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-gray-900 font-medium">Brak produktów</h3>
                    <p className="text-gray-500 text-sm mt-1">
                      Nie znaleziono produktów w tej kategorii.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}