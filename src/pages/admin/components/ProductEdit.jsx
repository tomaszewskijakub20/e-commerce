import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  ArrowLeft, Loader, X, CheckCircle, XCircle, Tag, Paperclip, Image as ImageIcon,
  Plus, Edit3, Trash2, UploadCloud, Save
} from "lucide-react";
import api from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";

export default function ProductEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const fileInputRef = useRef(null);

  const [product, setProduct] = useState(null); 
  const [categories, setCategories] = useState([]);
  const [currentImages, setCurrentImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    seoSlug: "",
    sku: "",
    shortDescription: "",
    description: "",
    price: "",
    vatRate: "",
    shippingCost: "",
    estimatedDeliveryTime: "",
    isActive: true,
    isFeatured: false,
    categoryId: "",
    attributeValues: {},
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canManage = user?.role === 'owner';

  useEffect(() => {
    if (!canManage) {
      setError("Brak uprawnień do edycji produktów.");
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setError("");
        const [productRes, categoriesRes, imagesRes] = await Promise.allSettled([
          api.get(`/products/${id}`),
          api.get('/categories'),
          api.get(`/products/${id}/images`)
        ]);

        if (productRes.status === 'fulfilled') {
          const productData = productRes.value.data;
          setProduct(productData); 

          const attributeValueMap = productData.attributeValues.reduce((acc, attr) => {
            if (attr.categoryAttributeId) { // Sprawdzamy, czy klucz istnieje
              acc[attr.categoryAttributeId] = attr.value;
            } else {
              console.warn(`Brak categoryAttributeId dla atrybutu: ${attr.categoryAttributeName}`);
            }
            return acc;
          }, {});

          setFormData({
            name: productData.name,
            seoSlug: productData.seoSlug,
            sku: productData.sku,
            shortDescription: productData.shortDescription || "",
            description: productData.description || "",
            price: productData.price || "",
            vatRate: productData.vatRate || "",
            shippingCost: productData.shippingCost || "",
            estimatedDeliveryTime: productData.estimatedDeliveryTime || "",
            isActive: productData.isActive,
            isFeatured: productData.isFeatured,
            categoryId: productData.category.id,
            attributeValues: attributeValueMap,
          });

        } else {
          throw new Error("Nie udało się załadować danych produktu.");
        }

        if (categoriesRes.status === 'fulfilled') {
          setCategories(categoriesRes.value.data);
        }

        if (imagesRes.status === 'fulfilled') {
          setCurrentImages(imagesRes.value.data);
        }

      } catch (err) {
        setError(err.message || "Błąd ładowania danych.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, canManage]);

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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setSuccess("");
    setError("");
  };

  const handleAttributeChange = (attributeId, value) => {
    setFormData(prev => ({
      ...prev,
      attributeValues: {
        ...prev.attributeValues,
        [attributeId]: value
      }
    }));
    setSuccess("");
    setError("");
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setNewImages(prev => [...prev, ...files]);
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
    setSuccess("");
    setError("");
  };

  const removeNewImage = (index) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeCurrentImage = async (imageId) => {
    if (!canManage) return;
    try {
      setSubmitting(true);
      await api.delete(`/products/${id}/images/${imageId}`);
      setCurrentImages(prev => prev.filter(img => img.id !== imageId));
      setSuccess("Obrazek usunięty pomyślnie.");
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Sesja wygasła. Zaloguj się ponownie.");
        logout();
        navigate('/login');
      } else {
        setError("Błąd podczas usuwania obrazka.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const setThumbnail = async (imageId) => {
    if (!canManage) return;
    try {
      setSubmitting(true);
      await api.post(`/products/${id}/images/${imageId}/thumbnail`);
      setCurrentImages(prev => prev.map(img => ({
        ...img,
        isThumbnail: img.id === imageId
      })));
      setSuccess("Miniaturka zaktualizowana pomyślnie.");
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Sesja wygasła. Zaloguj się ponownie.");
        logout();
        navigate('/login');
      } else {
        setError("Błąd podczas ustawiania miniaturki.");
      }
    } finally {
      setSubmitting(false);
    }
  };
  
  const updateImageAltText = async (imageId, altText) => {
    console.log("Aktualizacja Alt Text (do implementacji API):", imageId, altText);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canManage) {
      setError("Brak uprawnień do edycji produktów.");
      return;
    }
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      // Przygotuj payload atrybutów
      const attributeValuesPayload = product.attributeValues.map(originalAttr => {
        // Sprawdź, czy backend wysłał categoryAttributeId
        if (!originalAttr.categoryAttributeId) {
          console.error("Krytyczny błąd: Brak categoryAttributeId w danych produktu.", originalAttr);
          throw new Error("Brak categoryAttributeId w danych produktu.");
        }
        
        const newValue = formData.attributeValues[originalAttr.categoryAttributeId];
        
        return {
          id: originalAttr.id, 
          categoryAttributeId: originalAttr.categoryAttributeId,
          value: newValue !== undefined ? newValue : originalAttr.value
        };
      });
      
      const productUpdatePayload = {
        name: formData.name,
        seoSlug: formData.seoSlug,
        sku: formData.sku,
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

      // Zaktualizuj dane produktu
      await api.put(`/products/${id}`, productUpdatePayload);

      // Upload nowych obrazków
      if (newImages.length > 0) {
        const imageFormData = new FormData();
        newImages.forEach(file => {
          imageFormData.append('file', file);
        });
        
        await api.post(`/products/${id}/images`, imageFormData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        setNewImages([]);
        setImagePreviews([]);
      }

      setSuccess("Produkt zaktualizowany pomyślnie!");
      
      // Odśwież wszystkie dane
      const [updatedProductRes, updatedImagesRes] = await Promise.all([
        api.get(`/products/${id}`),
        api.get(`/products/${id}/images`)
      ]);
      
      setProduct(updatedProductRes.data);
      setCurrentImages(updatedImagesRes.data);

    } catch (err) {
      console.error("Błąd zapisu:", err.response);
      
      if (err.response?.status === 401) {
          setError("Twoja sesja wygasła. Proszę, zaloguj się ponownie.");
          logout();
          navigate('/login');
          return;
      }
      
      const errorMessage = err.response?.data?.message || "Błąd podczas aktualizacji produktu.";
      setError(errorMessage);
    } finally {
      setSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-gray-600" />
        <span className="ml-2 text-gray-600">Ładowanie danych produktu...</span>
      </div>
    );
  }

  if (!canManage && error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-center">
        <div>
          <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Błąd dostępu</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link 
            to="/admin/products"
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Powrót do listy
          </Link>
        </div>
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
              <h1 className="text-3xl font-bold text-gray-900">Edytuj produkt: {product?.name}</h1>
              <p className="text-gray-600 mt-2">Dostosuj szczegóły, ceny, atrybuty i zdjęcia produktu.</p>
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
        {success && (
           <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6 flex items-center justify-between">
             <span>{success}</span>
             <X className="h-5 w-5 cursor-pointer" onClick={() => setSuccess("")} />
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
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nazwa produktu</label>
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
                  <label htmlFor="seoSlug" className="block text-sm font-medium text-gray-700 mb-1">SEO Slug</label>
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
                    required
                  />
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
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Cena netto (PLN)</label>
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
                  <label htmlFor="vatRate" className="block text-sm font-medium text-gray-700 mb-1">Stawka VAT (%)</label>
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
                  <label htmlFor="shippingCost" className="block text-sm font-medium text-gray-700 mb-1">Koszt wysyłki (PLN)</label>
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
                  <label htmlFor="estimatedDeliveryTime" className="block text-sm font-medium text-gray-700 mb-1">Szacowany czas dostawy</label>
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
                  <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">Kategoria</label>
                  <select
                    id="categoryId"
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black bg-gray-100 cursor-not-allowed"
                    required
                    disabled 
                  >
                    <option value="">Wybierz kategorię</option>
                    {flatCategories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.displayName}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">Zmiana kategorii jest zablokowana podczas edycji.</p>
                </div>
                
              </div>
            </div>

            {/* Atrybuty dynamiczne */}
            {product && product.attributeValues.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Atrybuty produktu</h2>
                <p className="text-sm text-gray-600 mb-4">Edytuj wartości atrybutów przypisanych do tego produktu.</p>
                <div className="space-y-4">
                  {product.attributeValues.map(attrValue => (
                    <div key={attrValue.id}>
                      <label 
                        htmlFor={`attribute-${attrValue.categoryAttributeId}`} 
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        {attrValue.categoryAttributeName}
                      </label>
                      <input
                        type="text"
                        id={`attribute-${attrValue.categoryAttributeId}`}
                        value={formData.attributeValues[attrValue.categoryAttributeId] || ''}
                        onChange={(e) => handleAttributeChange(attrValue.categoryAttributeId, e.target.value)}
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

            {/* Zarządzanie zdjęciami */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Zdjęcia produktu</h3>
              <p className="text-sm text-gray-600 mb-4">Dodaj, usuń lub edytuj istniejące zdjęcia.</p>

              {/* Istniejące zdjęcia */}
              {currentImages.length > 0 && (
                <div className="space-y-4 mb-6">
                  <h4 className="font-medium text-gray-800">Istniejące zdjęcia:</h4>
                  {currentImages.map(img => (
                    <div key={img.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg group">
                      <img 
                        src={img.url}
                        alt={img.altText || 'Zdjęcie produktu'} 
                        className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                      />
                      <div className="flex-1">
                        <input
                           type="text"
                           defaultValue={img.altText || ''}
                           onBlur={(e) => updateImageAltText(img.id, e.target.value)}
                           placeholder="Tekst alternatywny"
                           className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-black"
                        />
                        {img.isThumbnail && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full mt-1 inline-block">Miniaturka</span>
                        )}
                      </div>
                      <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!img.isThumbnail && (
                          <button
                            type="button"
                            onClick={() => setThumbnail(img.id)}
                            title="Ustaw jako miniaturkę"
                            className="p-1 rounded-md text-gray-500 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                            disabled={submitting}
                          >
                            <ImageIcon className="h-5 w-5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeCurrentImage(img.id)}
                          title="Usuń zdjęcie"
                          className="p-1 rounded-md text-red-500 hover:bg-red-100 transition-colors"
                          disabled={submitting}
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Nowe zdjęcia do dodania */}
              {newImages.length > 0 && (
                <div className="space-y-4 mb-6">
                  <h4 className="font-medium text-gray-800">Nowe zdjęcia do dodania:</h4>
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg group">
                      <img 
                        src={preview}
                        alt="Podgląd nowego zdjęcia" 
                        className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{newImages[index].name}</p>
                        <p className="text-xs text-gray-500">Rozmiar: {(newImages[index].size / 1024).toFixed(2)} KB</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeNewImage(index)}
                        title="Usuń to zdjęcie"
                        className="p-1 rounded-md text-red-500 hover:bg-red-100 transition-colors"
                        disabled={submitting}
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Przycisk dodawania zdjęć */}
              <div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  multiple 
                  accept="image/*" 
                  onChange={handleImageChange} 
                  className="hidden" 
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  className="w-full flex items-center justify-center space-x-2 border-2 border-dashed border-gray-300 text-gray-600 px-4 py-3 rounded-lg hover:border-black hover:text-black transition-colors"
                  disabled={submitting}
                >
                  <UploadCloud className="h-5 w-5" />
                  <span>Dodaj nowe zdjęcia</span>
                </button>
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
                disabled={submitting}
              >
                {submitting && <Loader className="h-4 w-4 animate-spin" />}
                <span>{submitting ? 'Zapisywanie...' : 'Zapisz zmiany'}</span>
                {!submitting && <Save className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}