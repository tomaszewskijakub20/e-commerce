import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Package, Loader } from "lucide-react";
import api from "../services/api";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await api.get('/categories');
        setCategories(response.data);
      } catch (error) {
        console.error('Błąd ładowania kategorii:', error);
        setError("Nie udało się załadować kategorii");
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  // Komponent kafelka kategorii
  const CategoryCard = ({ category, level = 0 }) => (
    <div className="mb-4">
      <Link
        to={`/category/${category.id}`}
        className="block p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow hover:border-gray-300"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {category.name}
            </h3>
            {category.description && (
              <p className="text-gray-600 text-sm">
                {category.description}
              </p>
            )}
          </div>
          <Package className="h-6 w-6 text-gray-400 flex-shrink-0 ml-4" />
        </div>
      </Link>
      
      {/* Kategorie dzieci - rekurencyjnie */}
      {category.children && category.children.length > 0 && (
        <div className="ml-8 mt-2 border-l-2 border-gray-200 pl-4">
          {category.children.map(child => (
            <CategoryCard key={child.id} category={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin mx-auto text-gray-600" />
          <p className="mt-4 text-gray-600">Ładowanie kategorii...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Błąd ładowania</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Spróbuj ponownie
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Nagłówek */}
        <div className="mb-8 pt-8">
          <h1 className="text-3xl font-bold text-gray-900">Kategorie produktów</h1>
          <p className="text-gray-600 mt-2">
            Przeglądaj nasze produkty według kategorii
          </p>
        </div>

        {/* Lista kategorii */}
        <div className="space-y-4">
          {categories.map(category => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>

        {/* Fallback jeśli brak kategorii */}
        {categories.length === 0 && !loading && (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Brak kategorii</h3>
            <p className="text-gray-600">Skontaktuj się z administratorem</p>
          </div>
        )}
      </div>
    </div>
  );
}