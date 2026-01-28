import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { statisticsService } from '../../services/statisticsService';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
    ArrowLeft, Calendar, TrendingUp, ShoppingBag, DollarSign, Package, Loader, RefreshCw
} from 'lucide-react';

export default function Stats() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Zakres dat
    const [dateRange, setDateRange] = useState('30days');

    // Dane ze stanem
    const [salesStats, setSalesStats] = useState(null);
    const [monthlySales, setMonthlySales] = useState([]);
    const [topProductsQty, setTopProductsQty] = useState([]);
    const [topProductsRev, setTopProductsRev] = useState([]);

    // Helpery do dat
    const getDateParams = (range) => {
        const end = new Date();
        const start = new Date();

        switch (range) {
            case '30days':
                start.setDate(end.getDate() - 30);
                break;
            case '90days':
                start.setDate(end.getDate() - 90);
                break;
            case 'year':
                start.setMonth(end.getMonth() - 12);
                break;
            default: // 30 dni
                start.setDate(end.getDate() - 30);
        }
        return { start, end };
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { start, end } = getDateParams(dateRange);

            // Dla wykresu miesięcznego zawsze pobieramy szerszy zakres (np. rok), 
            // chyba że użytkownik wybrał inaczej, ale backend domyślnie daje 12 m-cy.
            // Tutaj pobieramy spójne dane dla wybranego okresu.

            const [statsData, monthlyData, topQtyData, topRevData] = await Promise.all([
                statisticsService.getSalesStatistics(start, end),
                // Dla wykresu chcemy widzieć trend, więc jeśli wybrano 30 dni, 
                // to i tak pobierzemy ostatni rok dla kontekstu na wykresie
                statisticsService.getMonthlySales(null, null),
                statisticsService.getTopProductsByQuantity(start, end, 5),
                statisticsService.getTopProductsByRevenue(start, end, 5)
            ]);

            setSalesStats(statsData);

            // Formatowanie danych dla Recharts (odwracamy kolejność, żeby styczeń był pierwszy)
            setMonthlySales([...monthlyData].reverse());

            setTopProductsQty(topQtyData);
            setTopProductsRev(topRevData);

        } catch (err) {
            console.error(err);
            setError("Nie udało się pobrać danych statystycznych.");
        } finally {
            setLoading(false);
        }
    }, [dateRange]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const formatCurrency = (val) => new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 }).format(val);
    const formatNumber = (val) => new Intl.NumberFormat('pl-PL').format(val);

    const handleBackToAdmin = () => navigate("/account/admin");

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader className="h-8 w-8 animate-spin mx-auto text-gray-600" />
                    <p className="mt-4 text-gray-600">Analizowanie danych sprzedażowych...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-8">
                    <div>
                        <button onClick={handleBackToAdmin} className="flex items-center text-gray-500 hover:text-gray-900 mb-2 transition-colors">
                            <ArrowLeft className="h-4 w-4 mr-1" /> Wróć do panelu
                        </button>
                        <h1 className="text-3xl font-bold text-gray-900">Raporty i Statystyki</h1>
                        <p className="text-gray-600">Przegląd wyników sprzedaży Twojego sklepu.</p>
                    </div>

                    {/* Filtry */}
                    <div className="flex bg-white rounded-lg shadow-sm p-1 border border-gray-200">
                        <button
                            onClick={() => setDateRange('30days')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${dateRange === '30days' ? 'bg-black text-white shadow' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            Ostatnie 30 dni
                        </button>
                        <button
                            onClick={() => setDateRange('90days')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${dateRange === '90days' ? 'bg-black text-white shadow' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            Ostatnie 90 dni
                        </button>
                        <button
                            onClick={() => setDateRange('year')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${dateRange === 'year' ? 'bg-black text-white shadow' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            Ostatni Rok
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 flex items-center justify-between">
                        <span>{error}</span>
                        <button onClick={fetchData} className="flex items-center underline hover:no-underline"><RefreshCw className="h-4 w-4 mr-1" /> Spróbuj ponownie</button>
                    </div>
                )}

                {/* Karty KPI */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Całkowity Przychód"
                        value={formatCurrency(salesStats?.totalRevenue || 0)}
                        icon={DollarSign}
                        color="bg-green-100 text-green-600"
                    />
                    <StatCard
                        title="Liczba Zamówień"
                        value={formatNumber(salesStats?.totalOrders || 0)}
                        icon={ShoppingBag}
                        color="bg-blue-100 text-blue-600"
                    />
                    <StatCard
                        title="Sprzedane Produkty"
                        value={formatNumber(salesStats?.totalProductsSold || 0)}
                        icon={Package}
                        color="bg-purple-100 text-purple-600"
                    />
                    <StatCard
                        title="Średnia Wartość Zamówienia"
                        value={formatCurrency(salesStats?.averageOrderValue || 0)}
                        icon={TrendingUp}
                        color="bg-orange-100 text-orange-600"
                    />
                </div>

                {/* Wykres Główny */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-900">Sprzedaż w ciągu ostatnich 12 miesięcy</h3>
                        <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-4 w-4 mr-2" />
                            Dane miesięczne
                        </div>
                    </div>
                    <div className="h-80 w-full min-h-[320px]">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <BarChart data={monthlySales} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="monthName" />
                                <YAxis />
                                <Tooltip
                                    formatter={(value) => formatCurrency(value)}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend />
                                <Bar dataKey="totalRevenue" name="Przychód" fill="#000000" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Sekcja Top Produktów */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Top wg Ilości */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            <Package className="h-5 w-5 mr-2 text-purple-600" />
                            Bestsellery (Ilość)
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 rounded-l-lg">Produkt</th>
                                        <th className="px-4 py-3 text-right">Sprzedano</th>
                                        <th className="px-4 py-3 rounded-r-lg text-right">Przychód</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topProductsQty.map((product, idx) => (
                                        <tr key={idx} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-gray-900">
                                                {product.productName}
                                                <div className="text-xs text-gray-500 font-mono">{product.productSku}</div>
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold">{product.totalQuantitySold} szt.</td>
                                            <td className="px-4 py-3 text-right text-gray-500">{formatCurrency(product.totalRevenue)}</td>
                                        </tr>
                                    ))}
                                    {topProductsQty.length === 0 && (
                                        <tr><td colSpan="3" className="text-center py-4 text-gray-500">Brak danych</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Top wg Przychodu */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                            Bestsellery (Przychód)
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 rounded-l-lg">Produkt</th>
                                        <th className="px-4 py-3 text-right">Przychód</th>
                                        <th className="px-4 py-3 rounded-r-lg text-right">Zamówień</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topProductsRev.map((product, idx) => (
                                        <tr key={idx} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-gray-900">
                                                {product.productName}
                                                <div className="text-xs text-gray-500 font-mono">{product.productSku}</div>
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-green-700">{formatCurrency(product.totalRevenue)}</td>
                                            <td className="px-4 py-3 text-right text-gray-500">{product.orderCount}</td>
                                        </tr>
                                    ))}
                                    {topProductsRev.length === 0 && (
                                        <tr><td colSpan="3" className="text-center py-4 text-gray-500">Brak danych</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

// Komponent karty KPI
function StatCard({ title, value, icon: Icon, color }) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-start justify-between hover:shadow-md transition-shadow">
            <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                <h4 className="text-2xl font-bold text-gray-900">{value}</h4>
            </div>
            <div className={`p-3 rounded-lg ${color}`}>
                <Icon className="h-6 w-6" />
            </div>
        </div>
    );
}