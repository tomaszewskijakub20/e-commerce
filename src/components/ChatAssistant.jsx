import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, X, Send } from 'lucide-react';

export default function ChatAssistant() {
    // Pobieramy stan użytkownika, aby upewnić się, że komponent jest używany poprawnie
    const { user, isAuthenticated } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    // Używamy mockowej historii, aby symulować interakcję
    const [history, setHistory] = useState([
        { type: 'system', text: 'Witaj! Jestem Twoim wirtualnym asystentem. Jak mogę Ci pomóc?' }
    ]);

    if (!isAuthenticated || !user) {
        return null;
    }

    const userName = user.firstName || user.email;

    const handleSend = (e) => {
        e.preventDefault();
        if (message.trim() === '') return;

        const newMessage = message.trim();

        // Dodaj wiadomość użytkownika do historii
        setHistory(prev => [...prev, { type: 'user', text: newMessage }]);
        setMessage('');

        // Mockowa odpowiedź asystenta
        setTimeout(() => {
            setHistory(prev => [
                ...prev,
                {
                    type: 'system',
                    text: `Dziękuję za wiadomość: "${newMessage}". Niestety, jestem jeszcze tylko wirtualny, ale nasz zespół zajmie się Twoim zapytaniem.`
                }
            ]);
        }, 1000);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* Pływający przycisk (zawsze widoczny dla zalogowanych) */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-black text-white p-4 rounded-full shadow-lg hover:bg-gray-800 transition-colors focus:outline-none focus:ring-4 focus:ring-black/50"
                title="Wirtualny Asystent"
            >
                {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
            </button>

            {/* Okno czatu (warunkowo renderowane) */}
            {isOpen && (
                <div className="absolute bottom-20 right-0 w-80 h-96 bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col overflow-hidden">
                    {/* Nagłówek czatu */}
                    <div className="bg-black text-white p-3 flex justify-between items-center">
                        <h3 className="font-semibold flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" /> Asystent E-Shop
                        </h3>
                        <button onClick={() => setIsOpen(false)} className="text-gray-300 hover:text-white transition-colors p-1">
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Historia wiadomości */}
                    <div className="flex-1 p-3 space-y-3 overflow-y-auto bg-gray-50">
                        {history.map((msg, index) => (
                            <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${msg.type === 'user'
                                        ? 'bg-black text-white rounded-br-none'
                                        : 'bg-gray-200 text-gray-800 rounded-tl-none'
                                    }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pole wprowadzania */}
                    <form onSubmit={handleSend} className="p-3 border-t border-gray-200">
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder={`Wpisz wiadomość, ${userName}...`}
                                className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                            />
                            <button type="submit" className="bg-black text-white p-3 rounded-full hover:bg-gray-800 disabled:opacity-50" disabled={!message.trim()}>
                                <Send className="h-4 w-4" />
                            </button>
                        </div>
                    </form></div>
            )}
        </div>
    );
}