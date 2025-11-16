import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Package, Plus, Search, Edit3, Trash2, 
  Eye, ChevronLeft, ChevronRight,
  ArrowLeft, Loader, X
} from "lucide-react";
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function Products() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0); // Poprawka statystyk

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Pobieranie produktów i kategorii
  useEffect(() => {
    loadData();
  }, [currentPage]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [productsResponse, categoriesResponse] = await Promise.allSettled([
        api.get(`/products?page=${currentPage}&size=${itemsPerPage}&sortBy=id&sortDir=asc`),
        api.get('/categories')
      ]);

      if (productsResponse.status === 'fulfilled') {
        const productsData = productsResponse.value.data;
        const productsList = productsData.content || productsData;
        
        setProducts(productsList);
        setTotalPages(productsData.totalPages || 1);
        setTotalProducts(productsData.totalElements || 0);
      } else {
        setTotalProducts(0);
        throw new Error('Nie udało się załadować produktów');
      }

      if (categoriesResponse.status === 'fulfilled') {
        setCategories(categoriesResponse.value.data);
      } else {
        setCategories([]);
      }

    } catch (err) {
      setError("Błąd ładowania danych: " + err.message);
    } finally {
      setLoading(false);
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

  // Filtrowanie produktów po wyszukiwaniu i kategorii
  const filteredProducts = useMemo(() => 
    products.filter(product => {
      const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "all" || 
                              product.categoryName?.toLowerCase().includes(selectedCategory.toLowerCase());
      return matchesSearch && matchesCategory;
    }), [products, searchTerm, selectedCategory]
  );

  const canManageProducts = user?.role === 'owner';

  // Obsługa ukrywania produktu
  const handleDeleteClick = (product) => {
    if (!canManageProducts) {
      setError("Nie masz uprawnień do usuwania produktów");
      return;
    }
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setProductToDelete(null);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;

    try {
      setDeleteLoading(true);
      
      // Optymistyczna aktualizacja UI
      setProducts(prev => prev.filter(p => p.id !== productToDelete.id));
      
      await api.delete(`/products/${productToDelete.id}`);
      
      // Przejdź do poprzedniej strony jeśli obecna jest pusta
      if (products.length === 1 && currentPage > 0) {
        setCurrentPage(prev => prev - 1);
      } else {
        // Lub po prostu odśwież dane
        await loadData();
      }
      
    } catch (err) {
      // Przywróć stan w przypadku błędu
      await loadData();
      
      const errorMessage = err.response?.status === 403 
        ? "Brak uprawnień do usunięcia produktu. Skontaktuj się z administratorem."
        : err.response?.status === 401 
        ? "Sesja wygasła. Zaloguj się ponownie."
        : "Błąd usuwania produktu: " + (err.response?.data?.message || err.message);
      
      setError(errorMessage);
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
      setProductToDelete(null);
    }
  };

  // Nawigacja
  const handleBackToAdmin = () => navigate("/account");
  const handleAddProduct = () => navigate("/admin/products/add");
  const handleEditProduct = (productId) => navigate(`/admin/products/${productId}/edit`);
  const handleViewProduct = (productId) => navigate(`/admin/products/${productId}`); // Poprawiony link

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pl-PL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

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
        {/* Nagłówek z paddingiem na górze */}
        <div className="mb-8 pt-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Zarządzanie produktami</h1>
              <p className="text-gray-600 mt-2">
                Zarządzaj katalogiem produktów, dodawaj nowe i edytuj istniejące
              </p>
              {!canManageProducts && (
                <p className="text-sm text-orange-600 mt-1">
                  Tryb podglądu - brak uprawnień do edycji i usuwania
                </p>
              )}
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={handleBackToAdmin}
                className="flex items-center space-x-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Powrót do panelu</span>
              </button>
              {canManageProducts && (
                <button 
                  onClick={handleAddProduct}
                  className="flex items-center space-x-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Dodaj produkt</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Komunikat o błędzie */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
            <button 
              onClick={loadData}
              className="ml-4 text-sm underline hover:no-underline"
            >
              Spróbuj ponownie
            </button>
          </div>
        )}

        {/* Filtry i wyszukiwanie */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Szukaj produktów
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Szukaj po nazwie..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kategoria
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              >
                <option value="all">Wszystkie kategorie</option>
                {flatCategories.map(category => (
                  <option key={category.id} value={category.name}>
                    {category.displayName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Statystyki */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {totalProducts}
                </p>
                <p className="text-sm text-gray-600">Wszystkie produkty</p>
              </div>
              <Package className="h-8 w-8 text-gray-400" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {flatCategories.length}
                </p>
                <p className="text-sm text-gray-600">Kategorie</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Package className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabela produktów */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader className="h-6 w-6 animate-spin text-gray-600" />
              <span className="ml-2 text-gray-600">Ładowanie...</span>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Produkt
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kategoria
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cena
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Akcje
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                          <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                          <p className="text-lg font-medium">Brak produktów</p>
                          <p className="mt-2">
                            {searchTerm || selectedCategory !== "all" 
                              ? "Spróbuj zmienić kryteria wyszukiwania" 
                              : "Dodaj pierwszy produkt do sklepu"}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0 bg-gray-200 rounded-lg flex items-center justify-center">
                                {product.thumbnailUrl ? (
                                  <img
                                    className="h-10 w-10 rounded-lg object-cover"
                                    src={product.thumbnailUrl}
                                    alt={product.name}
                                  />
                                ) : (
                                  <Package className="h-5 w-5 text-gray-400" />
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {product.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {product.shortDescription}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {product.categoryName || 'Brak kategorii'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {formatPrice(product.price)} zł
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => handleViewProduct(product.id)}
                                className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                                title="Podgląd"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              {canManageProducts && (
                                <>
                                  <button
                                    onClick={() => handleEditProduct(product.id)}
                                    className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50 transition-colors"
                                    title="Edytuj"
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteClick(product)}
                                    className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                                    title="Usuń"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Paginacja */}
              {totalPages > 1 && (
                <div className="bg-white px-6 py-3 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Pokazano {Math.min(currentPage * itemsPerPage + 1, totalProducts)}-
                      {Math.min((currentPage + 1) * itemsPerPage, totalProducts)} 
                      z {totalProducts} produktów
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 0))}
                        disabled={currentPage === 0}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      
                      {Array.from({ length: totalPages }, (_, i) => i).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1 border text-sm font-medium rounded-md ${
                            currentPage === page
                              ? 'bg-black text-white border-black'
                              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {page + 1}
                        </button>
                      ))}
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages - 1))}
                        disabled={currentPage === totalPages - 1}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal potwierdzenia usunięcia */}
        {showDeleteModal && productToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Potwierdzenie usunięcia</h3>
                <button
                  onClick={cancelDelete}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={deleteLoading}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <p className="text-gray-600 mb-4">
                Czy na pewno chcesz usunąć produkt <strong>"{productToDelete.name}"</strong>?
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Tej operacji nie można cofnąć.
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  disabled={deleteLoading}
                >
                  Anuluj
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  disabled={deleteLoading}
                >
                  {deleteLoading && <Loader className="h-4 w-4 animate-spin" />}
                  <span>{deleteLoading ? 'Usuwanie...' : 'Usuń produkt'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}