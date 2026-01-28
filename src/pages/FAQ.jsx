import { useState, useEffect } from "react";
import { settingsService } from "../services/settingsService";
import { Loader, ChevronDown, ChevronUp, HelpCircle } from "lucide-react";

export default function FAQ() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const data = await settingsService.getFaqItems();
        const activeFaqs = data.filter(f => f.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
        setFaqs(activeFaqs);
      } catch (err) {
        console.error("Błąd pobierania FAQ:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFaqs();
  }, []);

  const toggleFaq = (id) => {
    setOpenId(openId === id ? null : id);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader className="animate-spin" /></div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <HelpCircle className="mx-auto h-12 w-12 text-blue-600 mb-4" />
        <h1 className="text-3xl font-bold text-gray-900">Często zadawane pytania</h1>
        <p className="text-gray-500 mt-2">Znajdź odpowiedzi na nurtujące Cię pytania dotyczące naszego sklepu.</p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq) => (
          <div key={faq.id} className="border border-gray-200 rounded-lg bg-white overflow-hidden">
            <button
              onClick={() => toggleFaq(faq.id)}
              className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors focus:outline-none"
            >
              <span className="font-medium text-gray-900">{faq.question}</span>
              {openId === faq.id ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
            </button>
            
            {openId === faq.id && (
              <div className="px-6 pb-4 text-gray-600 animate-in slide-in-from-top-2">
                {faq.answer}
              </div>
            )}
          </div>
        ))}

        {faqs.length === 0 && (
          <p className="text-center text-gray-500">Brak pytań w bazie danych.</p>
        )}
      </div>
    </div>
  );
}