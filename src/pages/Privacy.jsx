export default function Privacy() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Nagłówek */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Polityka prywatności</h1>
            <p className="text-sm text-gray-500">Ostatnia aktualizacja: {new Date().toLocaleDateString('pl-PL')}</p>
          </div>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Informacje ogólne</h2>
              <p className="text-gray-600">
                Niniejsza polityka prywatności określa zasady przetwarzania i ochrony danych osobowych
                przekazanych przez Użytkowników w związku z korzystaniem ze sklepu internetowego.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Administrator danych</h2>
              <p className="text-gray-600 mb-4">
                Administratorem danych osobowych jest [Nazwa Firmy] z siedzibą w [adres], NIP: [numer NIP].
              </p>
              <p className="text-gray-600">
                W sprawach związanych z ochroną danych osobowych można kontaktować się pod adresem email: dane@eshop.pl
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Cel przetwarzania danych</h2>
              <p className="text-gray-600 mb-4">
                Dane osobowe przetwarzane są w celu:
              </p>
              <ul className="text-gray-600 list-disc list-inside space-y-2">
                <li>Realizacji zamówień i dostaw</li>
                <li>Obsługi reklamacji i zwrotów</li>
                <li>Wysyłki newslettera (za zgodą)</li>
                <li>Realizacji obowiązków prawnych</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Prawa użytkownika</h2>
              <p className="text-gray-600 mb-4">
                Użytkownik ma prawo do:
              </p>
              <ul className="text-gray-600 list-disc list-inside space-y-2">
                <li>Dostępu do swoich danych</li>
                <li>Sprostowania danych</li>
                <li>Usunięcia danych</li>
                <li>Ograniczenia przetwarzania</li>
                <li>Przenoszenia danych</li>
                <li>Wniesienia sprzeciwu</li>
                <li>Wniesienia skargi do PUODO</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Okres przechowywania danych</h2>
              <p className="text-gray-600">
                Dane osobowe przechowywane są przez okres niezbędny do realizacji celów, 
                nie dłużej niż 5 lat od ostatniej transakcji, chyba że przepisy prawa stanowią inaczej.
              </p>
            </section>

            <div className="bg-gray-50 p-4 rounded-lg mt-8">
              <p className="text-sm text-gray-600 text-center">
                W przypadku pytań dotyczących ochrony danych prosimy o kontakt: dane@eshop.pl
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}