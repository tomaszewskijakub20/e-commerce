import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Loader, Save, ArrowLeft, XCircle } from 'lucide-react';
import api from '../../../services/api';

export default function AttributeAdd() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'TEXT',
    isActive: true
  });
  const [loading, setLoading] = useState(false); // Tylko do pobrania nazwy kategorii
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [categoryName, setCategoryName] = useState('');

  const attributeTypes = [
    "TEXT", "NUMBER", "BOOLEAN", "DATE", "SELECT"
  ];

  // Pobieramy tylko nazwę kategorii dla nagłówka
  useEffect(() => {
    const loadCategoryName = async () => {
      setLoading(true);
      try {
        const catResponse = await api.get(`/categories/${categoryId}`);
        setCategoryName(catResponse.data.name);
      } catch (err) {
        console.error("Błąd ładowania kategorii:", err);
        setError("Nie można załadować danych kategorii.");
      } finally {
        setLoading(false);
      }
    };
    loadCategoryName();
  }, [categoryId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name) {
      setError("Nazwa atrybutu jest wymagana.");
      return;
    }

    setSaving(true);
    setError('');

    try {
      // Endpoint: POST /api/categories/{categoryId}/attributes
      await api.post(`/categories/${categoryId}/attributes`, formData);
      
      setSaving(false);
      navigate(`/admin/categories/${categoryId}`);

    } catch (err) {
      // --- Linia do debugowania ---
      console.log("Pełna odpowiedź błędu od API:", err.response.data); 
      // ----------------------------

      console.error("Błąd zapisu atrybutu:", err.response);
      
      let detailedError = "Wystąpił błąd podczas zapisu.";

      // Sprawdź, czy backend wysłał szczegóły walidacji (zgodnie z sekcją 7.2 dokumentacji)
      if (err.response?.data?.details) {
        // Formatuje błędy walidacji, np. "name: Nazwa jest wymagana"
        detailedError = err.response.data.details
          .map(d => `${d.field}: ${d.message}`)
          .join(', ');
      } else if (err.response?.data?.message) {
        // Jeśli nie ma 'details', użyj głównej wiadomości
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
        
        {/* Nagłówek */}
        <div className="mb-8 pt-8">
          <div className="mb-4">
            <Link 
              to={`/admin/categories/${categoryId}`}
              className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Powrót do kategorii "{categoryName}"</span>
            </Link>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900">
            Dodaj nowy atrybut
          </h1>
        </div>

        {/* Komunikat o błędzie */}
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
              Nazwa atrybutu *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              placeholder="Np. Kolor, Materiał, Waga"
            />
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Typ atrybutu *
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black bg-white"
            >
              {attributeTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">Określa rodzaj danych (np. tekst, liczba).</p>
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
              Atrybut jest aktywny
            </label>
          </div>

          {/* Przyciski */}
          <div className="flex justify-end space-x-3 border-t border-gray-200 pt-4">
            <Link
              to={`/admin/categories/${categoryId}`}
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
              <span>{saving ? 'Zapisywanie...' : 'Utwórz atrybut'}</span>
              {!saving && <Save className="h-4 w-4" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}