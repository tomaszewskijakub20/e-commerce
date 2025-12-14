import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
    Loader, Folder, ArrowLeft
} from "lucide-react";
import api from "../services/api";

export default function CategoryCatalog() {
    // Stan: Przechowuje całe drzewo kategorii
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Funkcja pomocnicza do spłaszczania kategorii i sortowania alfabetycznego
    const flattenCategories = (categoriesList, level = 0) => {
        let result = [];
        if (!Array.isArray(categoriesList)) return result;

        // Sortowanie alfabetyczne na danym poziomie
        const sortedList = categoriesList.sort((a, b) => a.name.localeCompare(b.name, 'pl'));

        sortedList.forEach(category => {
            result.push({
                ...category,
                link: `/category/${category.id}`,
                level: level,
                // Wcięcie dla wizualizacji hierarchii
                displayName: '— '.repeat(level) + category.name
            });
            if (category.children && category.children.length > 0) {
                // Rekurencyjne wywołanie, by spłaszczyć dzieci
                result = result.concat(flattenCategories(category.children, level + 1));
            }
        });
        return result;
    };

    // Lista spłaszczonych kategorii dla wyświetlania
    const flatCategories = useMemo(() =>
        flattenCategories(categories), [categories]
    );

    // Ładowanie aktywnych kategorii (drzewo)
    useEffect(() => {
        const loadAllCategories = async () => {
            setLoading(true);
            setError(null);
            try {
                // Lista aktywnych kategorii (drzewo)
                const response = await api.get('/categories/active');
                setCategories(response.data || []);
            } catch (err) {
                console.error('Błąd ładowania kategorii:', err.response || err);
                setError("Nie udało się załadować drzewa kategorii.");
            } finally {
                setLoading(false);
            }
        };
        loadAllCategories();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader className="h-8 w-8 animate-spin mx-auto text-gray-600" />
                    <p className="mt-4 text-gray-600">Ładowanie drzewa kategorii...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center">
                <Folder className="h-16 w-16 text-red-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Błąd wczytywania katalogu</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <Link to="/" className="text-blue-600 hover:text-blue-800 flex items-center mt-4">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Wróć do strony głównej
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Nagłówek */}
                <div className="mb-8 pt-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Przeglądaj kategorie
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Struktura kategorii jest wyświetlona poniżej.
                    </p>
                </div>

                {/* Drzewo Kategorii (spłaszczone) */}
                <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Struktura katalogu</h3>

                    {flatCategories.length > 0 ? (
                        <ul className="space-y-1">
                            {flatCategories.map(category => (
                                <li key={category.id}>
                                    <div
                                        className={`flex items-center space-x-2 py-2 px-3 rounded-lg transition-colors cursor-default
                                            ${category.level === 0 ? 'font-bold text-gray-900 hover:bg-gray-100' : 'text-gray-700 hover:bg-gray-50'}`
                                        }
                                        style={{ marginLeft: `${category.level * 20}px` }} // Wcięcie wizualizujące poziom
                                    >
                                        <Folder className={`h-4 w-4 ${category.level === 0 ? 'text-blue-600' : 'text-gray-400'}`} />
                                        <span>{category.displayName}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            Brak aktywnych kategorii do wyświetlenia.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}