import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

export default function FAQ() {
  const [openItems, setOpenItems] = useState({});

  const toggleItem = (index) => {
    setOpenItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const faqItems = [
    {
      question: "Jak mogę śledzić moje zamówienie?",
      answer: "Po wysłaniu przesyłki otrzymasz email z numerem śledzenia. Możesz go użyć na stronie przewoźnika, aby śledzić status dostawy."
    },
    {
      question: "Jaki jest czas realizacji zamówienia?",
      answer: "Zamówienia złożone do godziny 14:00 wysyłamy tego samego dnia. Czas dostawy zależy od wybranej metody: kurier 1-2 dni, poczta 2-3 dni robocze."
    },
    {
      question: "Czy mogę zmienić adres dostawy po złożeniu zamówienia?",
      answer: "Tak, pod warunkiem że zamówienie nie zostało jeszcze wysłane. Skontaktuj się z nami jak najszybciej przez formularz kontaktowy lub telefonicznie."
    },
    {
      question: "Jakie formy płatności akceptujecie?",
      answer: "Akceptujemy przelewy bankowe, płatności kartą, BLIK oraz płatność przy odbiorze (tylko przy dostawie kurierem)."
    },
    {
      question: "Czy produkty mają gwarancję?",
      answer: "Tak, wszystkie produkty objęte są 24-miesięczną gwarancją producenta. Dokumenty gwarancyjne dołączone są do przesyłki."
    },
    {
      question: "Jak mogę zwrócić produkt?",
      answer: "Masz 30 dni na zwrot. Skontaktuj się z nami, wyślemy instrukcje i etykietę zwrotu. Produkt musi być nieużywany w oryginalnym opakowaniu."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Nagłówek */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Często zadawane pytania</h1>
            <p className="text-lg text-gray-600">
              Znajdź odpowiedzi na najczęściej zadawane pytania
            </p>
          </div>

          {/* FAQ Items */}
          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full flex justify-between items-center p-4 text-left hover:bg-gray-50 rounded-lg"
                >
                  <span className="font-medium text-gray-900">{item.question}</span>
                  {openItems[index] ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </button>
                {openItems[index] && (
                  <div className="px-4 pb-4">
                    <p className="text-gray-600">{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Additional Help */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg text-center">
            <p className="text-blue-800">
              Nie znalazłeś odpowiedzi?{" "}
              <a href="/contact" className="font-semibold underline hover:text-blue-900">
                Skontaktuj się z nami
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}