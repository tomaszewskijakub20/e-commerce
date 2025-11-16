import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  Loader, Save, ArrowLeft, XCircle, Tag,
  Image as ImageIcon
} from "lucide-react";
import api from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";

export default function ProductAdd() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [categories, setCategories] = useState([]);
  const [categoryAttributes, setCategoryAttributes] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    seoSlug: "",
    sku: "",
    shortDescription: "",
    description: "",
    price: "",
    vatRate: "23.0",
    shippingCost: "0.00",
    estimatedDeliveryTime: "2-3 dni",
    isActive: true,
    isFeatured: false,
    categoryId: "",
    attributeValues: {},
  });

  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingAttributes, setLoadingAttributes] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  const canManage = user?.role === 'owner';

  // Pobierz wszystkie kategorie przy ładowaniu
  useEffect(() => {
    if (!canManage) {
      setError("Brak uprawnień do dodawania produktów.");
      setLoadingCategories(false);
      return;
    }

    const loadCategories = async () => {
      try {
        setLoadingCategories(true);
        const categoriesRes = await api.get('/categories');
        setCategories(categoriesRes.data);
      } catch (err) {
        setError("Nie udało się załadować listy kategorii.");
      } finally {
        setLoadingCategories(false);
      }
    };
    loadCategories();
  }, [canManage]);

  // Pobierz atrybuty, gdy zmieni się kategoria
  useEffect(() => {
    const fetchCategoryAttributes = async (categoryId) => {
      if (!categoryId) {
        setCategoryAttributes([]);
        return;
      }
      try {
        setLoadingAttributes(true);
        const response = await api.get(`/categories/${categoryId}/attributes`);
        setCategoryAttributes(response.data);
        // Wyczyść stare wartości atrybutów przy zmianie kategorii
        setFormData(prev => ({ ...prev, attributeValues: {} }));
      } catch (err) {
        console.error("Błąd ładowania atrybutów kategorii:", err);
        setCategoryAttributes([]);
      } finally {
        setLoadingAttributes(false);
      }
    };

    fetchCategoryAttributes(formData.categoryId);
  }, [formData.categoryId]);

  // Spłaszczanie kategorii dla listy <select>
  const flatCategories = useMemo(() => {
    const flatten = (categoriesList, level = 0) => {
      let result = [];
      categoriesList.forEach(category => {
        result.push({
          ...category,
          displayName: '  '.repeat(level) + category.name
        });
        if (category.children && category.children.length > 0) {
          result = result.concat(flatten(category.children, level + 1));
        }
      });
      return result;
    };
    return flatten(categories);
  }, [categories]);

  // Obsługa zmian w formularzu
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Automatyczne generowanie slug
    if (name === 'name') {
      const slug = value
        .toLowerCase()
        .trim()
        .replace(/ł/g, 'l')
        .replace(/ą/g, 'a')
        .replace(/ę/g, 'e')
        .replace(/ś/g, 's')
        .replace(/ć/g, 'c')
        .replace(/ż/g, 'z')
        .replace(/ź/g, 'z')
        .replace(/ń/g, 'n')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
      
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
    setError(""); // Usuń błąd przy zmianie
  };

  const handleAttributeChange = (attributeId, value) => {
    setFormData(prev => ({
      ...prev,
      attributeValues: {
        ...prev.attributeValues,
        [attributeId]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canManage) {
      setError("Brak uprawnień do dodawania produktów.");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      // Konwertuj mapę atrybutów na listę obiektów
      const attributeValuesPayload = Object.entries(formData.attributeValues)
        .map(([categoryAttributeId, value]) => ({
          categoryAttributeId: parseInt(categoryAttributeId),
          value: value
        }))
        .filter(attr => attr.value && attr.value.trim() !== '');

      const productCreatePayload = {
        name: formData.name,
        seoSlug: formData.seoSlug,
        sku: formData.sku || null,
        shortDescription: formData.shortDescription,
        description: formData.description,
        price: parseFloat(formData.price),
        vatRate: parseFloat(formData.vatRate),
        shippingCost: parseFloat(formData.shippingCost),
        estimatedDeliveryTime: formData.estimatedDeliveryTime,
        isActive: formData.isActive,
        isFeatured: formData.isFeatured,
        categoryId: formData.categoryId,
        attributeValues: attributeValuesPayload,
      };

      // Utwórz produkt
      const response = await api.post('/products', productCreatePayload);
      const newProductId = response.data.id;

      if (!newProductId) {
        throw new Error("API nie zwróciło ID nowego produktu.");
      }

      setSubmitting(false);
      
      // Przekieruj na stronę edycji, aby dodać zdjęcia
      navigate(`/admin/products/${newProductId}/edit`);

    } catch (err) {
      console.error("Błąd zapisu:", err.response);
      
      if (err.response?.status === 401) {
          setError("Twoja sesja wygasła. Proszę, zaloguj się ponownie.");
          logout();
          navigate('/login');
          return;
      }
      
      const errorMessage = err.response?.data?.message || "Błąd podczas tworzenia produktu.";
      setError(errorMessage);
      setSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loadingCategories) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Nagłówek */}
        <div className="mb-8 pt-8">
          <div className="mb-4">
            <Link 
              to="/admin/products"
              className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Powrót do listy produktów</span>
            </Link>
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dodaj nowy produkt</h1>
              <p className="text-gray-600 mt-2">Krok 1: Wprowadź podstawowe dane. Zdjęcia dodasz w następnym kroku.</p>
            </div>
          </div>
        </div>

        {/* Komunikaty */}
        {error && (
           <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 flex items-center justify-between">
             <span>{error}</span>
             <X className="h-5 w-5 cursor-pointer" onClick={() => setError("")} />
           </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Lewa kolumna formularza */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Informacje ogólne */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Informacje ogólne</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nazwa produktu *</label>
                  <input 
                    type="text" 
                    id="name" 
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="seoSlug" className="block text-sm font-medium text-gray-700 mb-1">SEO Slug *</label>
                  <input 
                    type="text" 
                    id="seoSlug" 
                    name="seoSlug"
                    value={formData.seoSlug}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-mono"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">SKU (kod produktu)</label>
                  <input 
                    type="text" 
                    id="sku" 
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                  />
                  <p className="mt-1 text-xs text-gray-500">Jeśli zostawisz puste, SKU zostanie wygenerowane automatycznie.</p>
                </div>
                <div>
                  <label htmlFor="shortDescription" className="block text-sm font-medium text-gray-700 mb-1">Krótki opis</label>
                  <textarea 
                    id="shortDescription" 
                    name="shortDescription"
                    value={formData.shortDescription}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    maxLength="255"
                  ></textarea>
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Pełny opis</label>
                  <textarea 
                    id="description" 
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="6"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Ceny i Kategoria */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Ceny i Klasyfikacja</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Cena netto (PLN) *</label>
                  <input 
                    type="number" 
                    id="price" 
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="vatRate" className="block text-sm font-medium text-gray-700 mb-1">Stawka VAT (%) *</label>
                  <input 
                    type="number" 
                    id="vatRate" 
                    name="vatRate"
                    value={formData.vatRate}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="shippingCost" className="block text-sm font-medium text-gray-700 mb-1">Koszt wysyłki (PLN) *</label>
                  <input 
                    type="number" 
                    id="shippingCost" 
                    name="shippingCost"
                    value={formData.shippingCost}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="estimatedDeliveryTime" className="block text-sm font-medium text-gray-700 mb-1">Szacowany czas dostawy *</label>
                  <input 
                    type="text" 
                    id="estimatedDeliveryTime" 
                    name="estimatedDeliveryTime"
                    value={formData.estimatedDeliveryTime}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">Kategoria *</label>
                  <select
                    id="categoryId"
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    required
                  >
                    <option value="">Wybierz kategorię</option>
                    {flatCategories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.displayName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Atrybuty dynamiczne */}
            {loadingAttributes ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex justify-center items-center">
                <Loader className="h-6 w-6 animate-spin text-gray-500" />
                <span className="ml-2 text-gray-500">Ładowanie atrybutów...</span>
              </div>
            ) : categoryAttributes.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Atrybuty kategorii</h2>
                <p className="text-sm text-gray-600 mb-4">Uzupełnij wartości atrybutów dla wybranej kategorii.</p>
                <div className="space-y-4">
                  {categoryAttributes.map(attr => (
                    <div key={attr.id}>
                      <label 
                        htmlFor={`attribute-${attr.id}`} 
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        {attr.name}
                      </label>
                      <input
                        type="text"
                        id={`attribute-${attr.id}`}
                        value={formData.attributeValues[attr.id] || ''}
                        onChange={(e) => handleAttributeChange(attr.id, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Prawa kolumna */}
          <div className="space-y-6">
            {/* Status */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label htmlFor="isActive" className="text-gray-600 cursor-pointer">Aktywny (widoczny w sklepie)</label>
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="h-5 w-5 text-black rounded focus:ring-black border-gray-300"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label htmlFor="isFeatured" className="text-gray-600 cursor-pointer">Polecany (na stronie głównej)</label>
                  <input
                    type="checkbox"
                    id="isFeatured"
                    name="isFeatured"
                    checked={formData.isFeatured}
                    onChange={handleChange}
                    className="h-5 w-5 text-black rounded focus:ring-black border-gray-300"
                  />
                </div>
              </div>
            </div>
            
            {/* Uwaga o zdjęciach */}
            <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-4">
              <div className="flex">
                <ImageIcon className="h-5 w-5 mr-3 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">Zdjęcia dodasz w następnym kroku</p>
                  <p>Po zapisaniu produktu zostaniesz przekierowany do edycji, gdzie będziesz mógł wgrać pliki.</p>
                </div>
              </div>
            </div>

            {/* Przyciski akcji */}
            <div className="lg:col-span-3 flex justify-end space-x-4 mt-8">
              <button
                type="button"
                onClick={() => navigate("/admin/products")}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={submitting}
              >
                Anuluj
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2"
                disabled={submitting || loadingAttributes}
              >
                {submitting && <Loader className="h-4 w-4 animate-spin" />}
                <span>{submitting ? 'Zapisywanie...' : 'Utwórz i przejdź do zdjęć'}</span>
                {!submitting && <Save className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}