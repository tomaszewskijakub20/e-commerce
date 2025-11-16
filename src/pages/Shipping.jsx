import { Truck, Package, RefreshCw, Shield } from "lucide-react";

export default function Shipping() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Nagłówek */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Dostawa i zwroty</h1>
            <p className="text-lg text-gray-600">
              Informacje o dostawie, kosztach przesyłki oraz zasadach zwrotów
            </p>
          </div>

          <div className="space-y-8">
            {/* Dostawa */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Truck className="h-6 w-6 text-black" />
                <h2 className="text-2xl font-bold text-gray-900">Dostawa</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">📦 Kurier DPD</h3>
                  <p className="text-gray-600 text-sm">
                    <strong>Koszt:</strong> 15 zł<br/>
                    <strong>Czas dostawy:</strong> 1-2 dni robocze<br/>
                    <strong>Płatność:</strong> Przelew/przy odbiorze
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">📮 Poczta Polska</h3>
                  <p className="text-gray-600 text-sm">
                    <strong>Koszt:</strong> 12 zł<br/>
                    <strong>Czas dostawy:</strong> 2-3 dni robocze<br/>
                    <strong>Płatność:</strong> Tylko przelew
                  </p>
                </div>
              </div>
              
              <div className="mt-4 text-sm text-gray-600">
                <p>🚚 <strong>Darmowa dostawa</strong> dla zamówień powyżej 300 zł</p>
                <p>⏰ Zamówienia złożone do <strong>14:00</strong> wysyłamy tego samego dnia</p>
              </div>
            </section>

            {/* Zwroty */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <RefreshCw className="h-6 w-6 text-black" />
                <h2 className="text-2xl font-bold text-gray-900">Zwroty i reklamacje</h2>
              </div>
              
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-2">🔄 Zwrot towaru</h3>
                  <p className="text-green-800 text-sm">
                    Masz <strong>30 dni</strong> na zwrot zakupionego towaru. Produkt musi być nieużywany, 
                    w oryginalnym opakowaniu z metkami.
                  </p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">📝 Procedura zwrotu</h3>
                  <ol className="text-blue-800 text-sm list-decimal list-inside space-y-1">
                    <li>Skontaktuj się z naszym działem obsługi klienta</li>
                    <li>Otrzymasz etykietę zwrotu</li>
                    <li>Wyślij paczkę na nasz adres</li>
                    <li>Zwrot środków w ciągu 3 dni od otrzymania przesyłki</li>
                  </ol>
                </div>
              </div>
            </section>

            {/* Gwarancja */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Shield className="h-6 w-6 text-black" />
                <h2 className="text-2xl font-bold text-gray-900">Gwarancja</h2>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-yellow-800 text-sm">
                  Wszystkie produkty objęte są <strong>24-miesięczną gwarancją producenta</strong>. 
                  W przypadku problemów z produktem skontaktuj się z naszym działem obsługi klienta.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}