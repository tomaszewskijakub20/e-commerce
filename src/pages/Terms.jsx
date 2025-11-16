export default function Terms() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Nagłówek */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Regulamin sklepu</h1>
            <p className="text-sm text-gray-500">Ostatnia aktualizacja: {new Date().toLocaleDateString('pl-PL')}</p>
          </div>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">§1 Postanowienia ogólne</h2>
              <p className="text-gray-600 mb-4">
                1.1. Niniejszy regulamin określa zasady dokonywania zakupów w sklepie internetowym prowadzonym przez [Nazwa Firmy].
              </p>
              <p className="text-gray-600">
                1.2. Sklep internetowy realizuje sprzedaż za pośrednictwem strony internetowej.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">§2 Zamówienia i płatności</h2>
              <p className="text-gray-600 mb-4">
                2.1. Złożenie zamówienia jest równoznaczne z zawarciem umowy sprzedaży.
              </p>
              <p className="text-gray-600 mb-4">
                2.2. Sklep akceptuje następujące formy płatności: przelew bankowy, karta płatnicza, BLIK.
              </p>
              <p className="text-gray-600">
                2.3. Czas realizacji zamówienia wynosi do 2 dni roboczych od momentu zaksięgowania płatności.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">§3 Dostawa</h2>
              <p className="text-gray-600 mb-4">
                3.1. Koszt dostawy zależny jest od wybranej metody przesyłki.
              </p>
              <p className="text-gray-600 mb-4">
                3.2. Darmowa dostawa przysługuje dla zamówień powyżej 300 zł.
              </p>
              <p className="text-gray-600">
                3.3. Sklep nie ponosi odpowiedzialności za opóźnienia spowodowane przez firmy kurierskie.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">§4 Zwroty i reklamacje</h2>
              <p className="text-gray-600 mb-4">
                4.1. Konsument ma prawo do odstąpienia od umowy w ciągu 14 dni bez podania przyczyny.
              </p>
              <p className="text-gray-600 mb-4">
                4.2. Zwracany towar musi być kompletny, nieużywany, w oryginalnym opakowaniu.
              </p>
              <p className="text-gray-600">
                4.3. Reklamacje rozpatrywane są w ciągu 14 dni od ich otrzymania.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">§5 Postanowienia końcowe</h2>
              <p className="text-gray-600 mb-4">
                5.1. W sprawach nieuregulowanych niniejszym regulaminem zastosowanie mają przepisy Kodeksu Cywilnego.
              </p>
              <p className="text-gray-600">
                5.2. Sklep zastrzega sobie prawo do zmian regulaminu. O zmianach Klienci zostaną powiadomieni.
              </p>
            </section>

            <div className="bg-gray-50 p-4 rounded-lg mt-8">
              <p className="text-sm text-gray-600 text-center">
                W przypadku pytań dotyczących regulaminu prosimy o kontakt: kontakt@eshop.pl
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}