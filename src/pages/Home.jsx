import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Star, ArrowRight, Truck, Shield, Headphones, Award, Loader } from "lucide-react";
import api from "../services/api";
import { useCart } from "../context/CartContext";

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  // Pobieranie danych z API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const [featuredResponse, categoriesResponse] = await Promise.allSettled([
          api.get('/products/featured'), // Pobierz polecane produkty
          api.get('/categories/active') // Pobierz tylko aktywne kategorie
        ]);

        // Przetwarzanie produktów polecanych
        if (featuredResponse.status === 'fulfilled') {
          // Używamy product.content, ponieważ API zwraca Page<ProductSummaryDTO>
          setFeatured(featuredResponse.value.data.content || []);
        } else {
          console.error('Błąd ładowania produktów polecanych:', featuredResponse.reason);
          setFeatured([]);
        }

        // Przetwarzanie kategorii
        if (categoriesResponse.status === 'fulfilled') {
          setCategories(categoriesResponse.value.data || []);
        } else {
          console.error('Błąd ładowania kategorii:', categoriesResponse.reason);
          setCategories([]);
        }

      } catch (error) {
        console.error('Błąd ładowania danych:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []); // Uruchom tylko raz

  // Lista głównych cech/zalet sklepu
  const features = [
    {
      icon: <Truck className="h-8 w-8" />,
      title: "Szybka dostawa",
      description: "Darmowa dostawa od 300 zł, wysyłka w 24h"
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Gwarancja",
      description: "24 miesiące gwarancji na wszystkie produkty"
    },
    {
      icon: <Headphones className="h-8 w-8" />,
      title: "Wsparcie 24/7",
      description: "Nasz zespół pomoże Ci o każdej porze"
    },
    {
      icon: <Award className="h-8 w-8" />,
      title: "Najlepsza jakość",
      description: "Tylko sprawdzone marki i produkty"
    }
  ];

  // Funkcja do renderowania gwiazdek (oceny)
  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
              }`}
          />
        ))}
      </div>
    );
  };

  // Funkcja do wybierania kategorii końcowych (liści)
  const getLeafCategories = (categoriesList) => {
    const leafCategories = [];

    const findLeaves = (categoryList) => {
      categoryList.forEach(category => {
        // Jeśli kategoria ma dzieci, przechodź dalej
        if (category.children && category.children.length > 0) {
          findLeaves(category.children);
        } else {
          // Jeśli nie ma dzieci, jest liściem
          leafCategories.push(category);
        }
      });
    };

    findLeaves(categoriesList);
    return leafCategories.slice(0, 4); // Pokaż tylko 4
  };

  const popularCategories = getLeafCategories(categories);

  // Komponent karty produktu
  const ProductCard = ({ product }) => (
    <Link
      to={`/product/${product.seoSlug}`}
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
    >
      <div className="aspect-square overflow-hidden bg-gray-100">
        <img
          src={product.thumbnailUrl || "/api/placeholder/300/300"}
          alt={product.name}
          className="w-full h-full object-cover hover:scale-105 transition-transform"
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>

        <p className="text-gray-600 text-sm mb-2 line-clamp-2">
          {product.shortDescription}
        </p>

        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg font-bold text-gray-900">
            {typeof product.price === 'number' ? product.price.toFixed(2) : '0.00'} zł
          </span>
        </div>

        <button
          onClick={(e) => {
            e.preventDefault(); // Zapobiegaj przejściu do Linku
            addToCart(product);
          }}
          className="w-full bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors"
        >
          Dodaj do koszyka
        </button>
      </div>
    </Link>
  );

  // Ekran ładowania
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin mx-auto text-gray-600" />
          <p className="mt-4 text-gray-600">Ładowanie strony głównej...</p>
        </div>
      </div>
    );
  }

  // Główny komponent
  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-black to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Sztuka <span className="text-blue-400">Rękodzieła</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-300 max-w-2xl mx-auto">
              Odkryj unikalne rzeźby, obrazy i wyroby artystyczne.
              Każdy produkt to dzieło stworzone z pasją i dbałością o detal.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/products"
                className="bg-white text-black px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-lg"
              >
                Odkryj kolekcję
              </Link>
              <Link
                to="/categories"
                className="border border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-black transition-colors text-lg"
              >
                Przeglądaj kategorie
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bestsellery */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Bestsellery</h2>
              <p className="text-gray-600 mt-2">Najchętniej wybierane przez naszych klientów</p>
            </div>
            <Link
              to="/products"
              className="flex items-center gap-2 text-black font-semibold hover:gap-3 transition-all"
            >
              Zobacz wszystkie <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {featured.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.slice(0, 3).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Brak produktów w bestsellerach</p>
            </div>
          )}
        </div>
      </section>

      {/* Polecane produkty */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Polecane produkty</h2>
              <p className="text-gray-600 mt-2">Wybrane specjalnie dla Ciebie</p>
            </div>
            <Link
              to="/products"
              className="flex items-center gap-2 text-black font-semibold hover:gap-3 transition-all"
            >
              Wszystkie polecane <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {featured.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.slice(0, 3).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Brak polecanych produktów</p>
            </div>
          )}
        </div>
      </section>

      {/* Kategorie */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Popularne kategorie</h2>

          {popularCategories.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {popularCategories.map((category) => (
                <Link
                  key={category.id}
                  to={`/category/${category.id}`}
                  className="group relative overflow-hidden rounded-lg aspect-square bg-gray-100"
                >
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-end p-4">
                    <div className="text-white">
                      <h3 className="font-semibold text-lg">{category.name}</h3>
                      <p className="text-gray-200 text-sm">{category.description}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Brak kategorii do wyświetlenia</p>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Bądź na bieżąco</h2>
          <p className="text-gray-300 mb-8">
            Zapisz się do newslettera i otrzymuj informacje o nowościach, ekskluzywnych ofertach i promocjach
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Twój adres email"
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors">
              Zapisz się
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}