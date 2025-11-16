export default function Cookies() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Nagłówek */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Polityka cookies</h1>
            <p className="text-sm text-gray-500">Ostatnia aktualizacja: {new Date().toLocaleDateString('pl-PL')}</p>
          </div>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Czym są pliki cookies?</h2>
              <p className="text-gray-600">
                Pliki cookies to małe pliki tekstowe zapisywane na urządzeniu użytkownika podczas przeglądania strony internetowej.
                Służą one do poprawy funkcjonalności strony i lepszego dopasowania treści do potrzeb użytkownika.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Rodzaje używanych cookies</h2>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">🍪 Niezbędne cookies</h3>
                <p className="text-gray-600 text-sm">
                  Umożliwiają podstawowe funkcjonowanie strony (logowanie, koszyk). Nie można ich wyłączyć.
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">📊 Analityczne cookies</h3>
                <p className="text-gray-600 text-sm">
                  Pozwalają zbierać anonimowe informacje o sposobie korzystania ze strony w celu jej ulepszania.
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">🎯 Marketingowe cookies</h3>
                <p className="text-gray-600 text-sm">
                  Używane do wyświetlania spersonalizowanych reklam i ofert dopasowanych do zainteresowań użytkownika.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Zarządzanie cookies</h2>
              <p className="text-gray-600 mb-4">
                Użytkownik może w każdej chwili zarządzać ustawieniami plików cookies poprzez zmianę ustawień przeglądarki.
              </p>
              <p className="text-gray-600">
                Pamiętaj, że wyłączenie niektórych plików cookies może wpłynąć na funkcjonalność strony.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Pliki cookies stron trzecich</h2>
              <p className="text-gray-600">
                W sklepie mogą być używane pliki cookies firm zewnętrznych takich jak Google Analytics, 
                Facebook Pixel w celach analitycznych i marketingowych.
              </p>
            </section>

            <div className="bg-gray-50 p-4 rounded-lg mt-8">
              <p className="text-sm text-gray-600 text-center">
                W przypadku pytań dotyczących polityki cookies prosimy o kontakt: cookies@eshop.pl
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}