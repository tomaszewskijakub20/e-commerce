import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Folder, Plus, Search, Edit3, Trash2, ChevronLeft, ChevronRight,
  ArrowLeft, Loader, X, Eye,
  CheckCircle, AlertTriangle, XCircle, Info
} from "lucide-react";
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// Komponent uniwersalnego modalu potwierdzenia
const ConfirmationModal = ({
  show, onClose, title, message, onConfirm,
  confirmText = 'Potwierdź', cancelText = 'Anuluj',
  type = 'info', isProcessing = false
}) => {
  if (!show) return null;

  const styles = {
    success: { Icon: CheckCircle, iconColor: 'text-green-600', confirmBg: 'bg-green-600 hover:bg-green-700' },
    danger: { Icon: XCircle, iconColor: 'text-red-600', confirmBg: 'bg-red-600 hover:bg-red-700' },
    warning: { Icon: AlertTriangle, iconColor: 'text-yellow-500', confirmBg: 'bg-yellow-600 hover:bg-yellow-700' },
    info: { Icon: Info, iconColor: 'text-blue-500', confirmBg: 'bg-blue-600 hover:bg-blue-700' },
  };

  const { Icon, iconColor, confirmBg } = styles[type] || styles.info;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[1000] p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center">
            <Icon className={`h-6 w-6 mr-3 ${iconColor}`} />
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-4" disabled={isProcessing}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-6">{message}</p>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            disabled={isProcessing}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-white rounded-lg ${confirmBg} disabled:opacity-50 flex items-center`}
            disabled={isProcessing}
          >
            {isProcessing ? <Loader className="h-4 w-4 animate-spin mr-2" /> : null}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};


export default function Categories() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [allCategories, setAllCategories] = useState([]);
  const [activeCategories, setActiveCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [stats, setStats] = useState({
    activeCategories: 0,
    mainCategories: 0
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage] = useState(50);

  // Stan modala usuwania
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Ładowanie wszystkich danych (kategorie, statystyki)
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const categoriesResponse = await api.get('/categories');
      const allCategoriesData = categoriesResponse.data;

      setAllCategories(allCategoriesData);

      const activeCategoriesData = filterActiveCategories(allCategoriesData);
      setActiveCategories(activeCategoriesData);

      // Obliczanie statystyk
      const totalActive = flattenCategories(activeCategoriesData).length;
      const totalMain = activeCategoriesData.filter(c => c.parentId === null).length;

      setStats({
        activeCategories: totalActive,
        mainCategories: totalMain
      });

    } catch (err) {
      setError("Błąd ładowania danych: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Rekurencyjne filtrowanie tylko aktywnych kategorii
  const filterActiveCategories = (categoriesList) => {
    let result = [];
    categoriesList.forEach(category => {
      if (category.isActive) {
        const activeCategory = { ...category };
        if (category.children && category.children.length > 0) {
          activeCategory.children = filterActiveCategories(category.children);
        } else {
          activeCategory.children = [];
        }
        result.push(activeCategory);
      }
    });
    return result;
  };

  // Spłaszczanie kategorii z zachowaniem hierarchii dla widoku listy
  const flattenCategories = (categoriesList, level = 0) => {
    let result = [];
    categoriesList.forEach(category => {
      result.push({
        ...category,
        level: level,
        displayName: '  '.repeat(level) + category.name
      });
      if (category.children && category.children.length > 0) {
        result = result.concat(flattenCategories(category.children, level + 1));
      }
    });
    return result;
  };

  const flatActiveCategories = useMemo(() => {
    return flattenCategories(activeCategories);
  }, [activeCategories]);

  // Filtrowanie kategorii po wyszukiwaniu (Client-side)
  const filteredCategories = useMemo(() => {
    // Jeśli nie ma wyszukiwania, paginujemy
    if (!searchTerm) {
      const startIndex = currentPage * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      return flatActiveCategories.slice(startIndex, endIndex);
    }

    // Jeśli jest wyszukiwanie, ignorujemy paginację i filtrujemy wszystkie aktywne
    return flatActiveCategories.filter(category =>
      category.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.seoSlug?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [flatActiveCategories, searchTerm, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(flatActiveCategories.length / itemsPerPage);
  const canManageCategories = user?.role === 'owner';

  // Obsługa usuwania kategorii (otwarcie modala)
  const handleDeleteClick = (category) => {
    if (!canManageCategories) {
      setError("Nie masz uprawnień do usuwania kategorii");
      return;
    }
    setCategoryToDelete(category);
    setShowDeleteModal(true);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setCategoryToDelete(null);
  };

  // Potwierdzenie i wykonanie usuwania (soft delete)
  const confirmDelete = async () => {
    if (!categoryToDelete) return;

    try {
      setDeleteLoading(true);
      // Wywołanie API do "miękkiego" usuwania (ustawienia isActive na false)
      await api.delete(`/categories/${categoryToDelete.id}`);
      await loadData(); // Odświeżenie danych
    } catch (err) {
      const errorMessage = "Błąd usuwania kategorii: " + (err.response?.data?.message || err.message);
      setError(errorMessage);
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
      setCategoryToDelete(null);
    }
  };

  // Nawigacja
  const handleBackToAdmin = () => navigate("/account/admin");
  const handleAddCategory = () => navigate("/admin/categories/add");
  const handleEditCategory = (categoryId) => navigate(`/admin/categories/${categoryId}/edit`);
  const handleViewCategory = (categoryId) => navigate(`/admin/categories/${categoryId}`);

  // Renderowanie wizualnej hierarchii
  const renderCategoryLevel = (level) => {
    return (
      <div className="flex items-center">
        {Array.from({ length: level }).map((_, i) => (
          <div key={i} className="w-4 h-0.5 bg-gray-300 mx-1"></div>
        ))}
      </div>
    );
  };

  if (loading && allCategories.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin mx-auto text-gray-600" />
          <p className="mt-4 text-gray-600">Ładowanie kategorii...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Zarządzanie kategoriami</h1>
              <p className="text-gray-600 mt-2">
                Zarządzaj hierarchią kategorii produktów (wyświetlane tylko aktywne)
              </p>
              {!canManageCategories && (
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
              {canManageCategories && (
                <button
                  onClick={handleAddCategory}
                  className="flex items-center space-x-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Dodaj kategorię</span>
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

        {/* Wyszukiwanie */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Szukaj kategorii
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Szukaj po nazwie, opisie lub linku..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              />
            </div>
          </div>
        </div>

        {/* Statystyki */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.activeCategories}
                </p>
                <p className="text-sm text-gray-600">Aktywne kategorie</p>
              </div>
              <Folder className="h-8 w-8 text-gray-400" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.mainCategories}
                </p>
                <p className="text-sm text-gray-600">Kategorie główne</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Folder className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabela kategorii */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading && filteredCategories.length === 0 ? (
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
                        Kategoria
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Link (Slug)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data utworzenia
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Akcje
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCategories.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                          <Folder className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                          <p className="text-lg font-medium">
                            {searchTerm ? 'Brak pasujących kategorii' : 'Brak aktywnych kategorii'}
                          </p>
                          <p className="mt-2">
                            {searchTerm
                              ? "Spróbuj zmienić kryteria wyszukiwania"
                              : "Dodaj pierwszą kategorię"}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredCategories.map((category) => (
                        <tr key={category.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              {renderCategoryLevel(category.level)}
                              <div className="ml-2">
                                <button
                                  onClick={() => handleViewCategory(category.id)}
                                  className="text-sm font-medium text-gray-900 text-left hover:text-blue-600 transition-colors"
                                >
                                  {category.name}
                                </button>
                                {category.description && (
                                  <div className="text-sm text-gray-500">
                                    {category.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 font-mono">
                              {category.seoSlug}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {new Date(category.createdAt).toLocaleDateString('pl-PL')}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => handleViewCategory(category.id)}
                                className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                                title="Podgląd"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              {canManageCategories && (
                                <>
                                  <button
                                    onClick={() => handleEditCategory(category.id)}
                                    className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50 transition-colors"
                                    title="Edytuj"
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteClick(category)}
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

              {/* Paginacja (tylko jeśli nie ma aktywnego wyszukiwania) */}
              {!searchTerm && totalPages > 1 && (
                <div className="bg-white px-6 py-3 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Pokazano {Math.min(currentPage * itemsPerPage + 1, flatActiveCategories.length)}-
                      {Math.min((currentPage + 1) * itemsPerPage, flatActiveCategories.length)}
                      z {flatActiveCategories.length} aktywnych kategorii
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 0))}
                        disabled={currentPage === 0}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>

                      <span className="px-3 py-1 text-sm">
                        Strona {currentPage + 1} z {totalPages}
                      </span>

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
        <ConfirmationModal
          show={showDeleteModal}
          onClose={cancelDelete}
          onConfirm={confirmDelete}
          title={`Potwierdź usunięcie kategorii: ${categoryToDelete?.name}`}
          message={(
            <>
              Czy na pewno chcesz usunąć kategorię"{categoryToDelete?.name}"?
              <br /><br />
              {categoryToDelete?.children && categoryToDelete.children.length > 0 && (
                <span className="font-semibold text-red-600 block mb-2">
                  ⚠️ UWAGA: Ta kategoria ma zagnieżdżone podkategorie. Akcja usunie również wszystkie podkategorie!
                </span>
              )}
              Tej operacji nie można cofnąć.
            </>
          )}
          confirmText="Usuń kategorię"
          cancelText="Anuluj"
          type="danger"
          isProcessing={deleteLoading}
        />

      </div>
    </div>
  );
}