import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Loader, Save, ArrowLeft, XCircle } from 'lucide-react';
import api from '../../../services/api';

export default function CategoryAdd() {
  const navigate = useNavigate();
  const location = useLocation();

  // Sprawdź, czy przekazano parentId (dla podkategorii)
  const parentId = location.state?.parentId || null;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    seoSlug: '',
    parentId: parentId,
    isActive: true
  });
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [parentCategoryName, setParentCategoryName] = useState('');

  // Jeśli dodajemy podkategorię, pobierz nazwę rodzica do wyświetlenia
  useEffect(() => {
    if (parentId) {
      api.get(`/categories/${parentId}`)
        .then(response => {
          setParentCategoryName(response.data.name);
        })
        .catch(err => {
          console.error("Błąd ładowania kategorii nadrzędnej:", err);
          setError("Nie udało się załadować kategorii nadrzędnej.");
        });
    }
  }, [parentId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'name') {
      // Automatyczne generowanie seoSlug na podstawie nazwy
      const slug = value
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')     // Zamień spacje na myślniki
        .replace(/[^a-z0-9-]/g, ''); // Usuń znaki specjalne
      setFormData(prev => ({
        ...prev,
        name: value,
        seoSlug: slug
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };
  
  const handleSlugChange = (e) => {
     setFormData(prev => ({
        ...prev,
        seoSlug: e.target.value
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

    // Upewnij się, że parentId to null, jeśli jest puste (API może wymagać null)
    const dataToSend = {
      ...formData,
      parentId: formData.parentId ? formData.parentId : null
    };

    try {
      // Endpoint: POST /api/categories
      await api.post('/categories', dataToSend);
      
      setSaving(false);
      // Wróć do listy kategorii lub widoku rodzica
      if (parentId) {
        navigate(`/admin/categories/${parentId}`);
      } else {
        navigate('/admin/categories');
      }

    } catch (err) {
      console.error("Błąd zapisu kategorii:", err.response);
      
      let detailedError = "Wystąpił błąd podczas zapisu.";
      if (err.response?.data?.details) {
        detailedError = err.response.data.details
          .map(d => `${d.field}: ${d.message}`)
          .join(', ');
      } else if (err.response?.data?.message) {
        detailedError = err.response.data.message;
      }
      
      // Specyficzny błąd dla duplikatu seoSlug
      if (err.response?.status === 400 && detailedError.toLowerCase().includes('duplicate') && detailedError.toLowerCase().includes('slug')) {
         setError("Błąd: Ten SEO Slug już istnieje. Wybierz inny.");
      } else {
         setError(detailedError);
      }
      
      setSaving(false);
    }
  };
  
  const getReturnPath = () => {
    return parentId ? `/admin/categories/${parentId}` : '/admin/categories';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-8 pt-8">
          <div className="mb-4">
            <Link 
              to={getReturnPath()}
              className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>
                {parentId ? `Powrót do kategorii "${parentCategoryName}"` : 'Powrót do listy kategorii'}
              </span>
            </Link>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900">
            {parentId ? 'Dodaj nową podkategorię' : 'Dodaj nową kategorię główną'}
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
              placeholder="Np. Rzeźby, Obrazy, Szkło"
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
              onChange={handleSlugChange} // Użyj dedykowanego handlera
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-mono"
              placeholder="np. rzezby, obrazy, szklo"
            />
            <p className="mt-1 text-xs text-gray-500">Generowany automatycznie z nazwy, ale możesz poprawić.</p>
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
              placeholder="Krótki opis kategorii"
            />
          </div>

          {/* parentId jest ukryte, ponieważ jest ustawiane automatycznie */}
          <input type="hidden" name="parentId" value={formData.parentId || ''} />

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
              to={getReturnPath()}
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
              <span>{saving ? 'Zapisywanie...' : 'Utwórz kategorię'}</span>
              {!saving && <Save className="h-4 w-4" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}