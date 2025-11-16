import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Loader, Save, ArrowLeft, XCircle } from 'lucide-react';
import api from '../../../services/api';

export default function CategoryEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    seoSlug: '',
    parentId: null,
    isActive: true
  });
  const [allCategories, setAllCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Pobierz dane kategorii oraz listę wszystkich kategorii
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');

        const [categoryResponse, allCategoriesResponse] = await Promise.allSettled([
          api.get(`/categories/${id}`),
          api.get('/categories') // Pobierz wszystkie kategorie dla listy rodziców
        ]);

        if (categoryResponse.status === 'fulfilled') {
          const catData = categoryResponse.value.data;
          setFormData({
            name: catData.name,
            description: catData.description || '',
            seoSlug: catData.seoSlug,
            parentId: catData.parentId,
            isActive: catData.isActive
          });
        } else {
          throw new Error("Nie udało się załadować kategorii.");
        }

        if (allCategoriesResponse.status === 'fulfilled') {
          setAllCategories(allCategoriesResponse.value.data);
        } else {
          throw new Error("Nie udało się załadować listy kategorii.");
        }

      } catch (err) {
        console.error("Błąd ładowania danych:", err);
        setError(err.message || "Wystąpił błąd.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  // Spłaszcza kategorie do listy
  const flattenCategories = (categoriesList, level = 0) => {
    let result = [];
    categoriesList.forEach(category => {
      result.push({
        ...category,
        level: level,
        displayName: '— '.repeat(level) + category.name
      });
      if (category.children && category.children.length > 0) {
        result = result.concat(flattenCategories(category.children, level + 1));
      }
    });
    return result;
  };

  // Znajdź wszystkie ID dzieci tej kategorii (rekurencyjnie)
  const getCategoryAndChildrenIds = (categoriesList, categoryId) => {
    let ids = [parseInt(categoryId)]; // Dodaj samą siebie
    
    const findCategory = (list, id) => {
      for (const category of list) {
        if (category.id === id) return category;
        if (category.children) {
          const found = findCategory(category.children, id);
          if (found) return found;
        }
      }
      return null;
    };

    const collectChildrenIds = (category) => {
      if (category.children && category.children.length > 0) {
        category.children.forEach(child => {
          ids.push(child.id);
          collectChildrenIds(child);
        });
      }
    };

    const targetCategory = findCategory(categoriesList, parseInt(categoryId));
    if (targetCategory) {
      collectChildrenIds(targetCategory);
    }
    
    return ids;
  };

  const parentOptions = useMemo(() => {
    const flatList = flattenCategories(allCategories);
    const disabledIds = getCategoryAndChildrenIds(allCategories, id);

    return flatList.map(category => ({
      ...category,
      disabled: disabledIds.includes(category.id)
    }));
  }, [allCategories, id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.seoSlug) {
      setError("Nazwa i SEO Slug są wymagane.");
      return;
    }

    setSaving(true);
    setError('');

    // Upewnij się, że parentId to null, jeśli jest "null" lub ""
    const parentIdValue = formData.parentId === "null" || !formData.parentId 
      ? null 
      : parseInt(formData.parentId);

    const dataToSend = {
      ...formData,
      parentId: parentIdValue
    };

    try {
      // Endpoint: PUT /api/categories/{id}
      await api.put(`/categories/${id}`, dataToSend);
      
      setSaving(false);
      navigate('/admin/categories'); // Wróć do listy

    } catch (err) {
      console.error("Błąd zapisu kategorii:", err.response);
      let detailedError = "Wystąpił błąd podczas zapisu.";
      
      if (err.response?.status === 400) {
         detailedError = "Błąd walidacji. Sprawdź, czy SEO Slug jest unikalny i czy nie tworzysz pętli.";
      } else if (err.response?.data?.message) {
         detailedError = err.response.data.message;
      }
      
      setError(detailedError);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-8 pt-8">
          <div className="mb-4">
            <Link 
              to="/admin/categories"
              className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Powrót do listy kategorii</span>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Edytuj kategorię
          </h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 flex items-center justify-between">
            <div className="flex items-center">
              <XCircle className="h-5 w-5 mr-2" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError('')} className="text-red-700 font-bold">X</button>
          </div>
        )}

        {/* Formularz */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nazwa kategorii *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
            />
          </div>
          
          <div>
            <label htmlFor="seoSlug" className="block text-sm font-medium text-gray-700 mb-1">
              SEO Slug *
            </label>
            <input
              type="text"
              id="seoSlug"
              name="seoSlug"
              value={formData.seoSlug}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-mono"
            />
          </div>

          <div>
            <label htmlFor="parentId" className="block text-sm font-medium text-gray-700 mb-1">
              Kategoria nadrzędna
            </label>
            <select
              id="parentId"
              name="parentId"
              value={formData.parentId || "null"} // Użyj "null" jako string dla pustej opcji
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black bg-white"
            >
              <option value="null">— Brak (Kategoria główna) —</option>
              {parentOptions.map(category => (
                <option 
                  key={category.id} 
                  value={category.id} 
                  disabled={category.disabled}
                  className={category.disabled ? 'text-gray-400' : ''}
                >
                  {category.displayName}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">Kategoria nie może być swoim własnym rodzicem ani dzieckiem.</p>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Opis
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm font-medium text-gray-700">
              Kategoria jest aktywna
            </label>
          </div>

          <div className="flex justify-end space-x-3 border-t border-gray-200 pt-4">
            <Link
              to="/admin/categories"
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Anuluj
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {saving && <Loader className="h-4 w-4 animate-spin" />}
              <span>{saving ? 'Zapisywanie...' : 'Zapisz zmiany'}</span>
              {!saving && <Save className="h-4 w-4" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}