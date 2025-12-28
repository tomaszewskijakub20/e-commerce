import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, X, Send, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function ChatAssistant() {
    const { user, isAuthenticated } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [history, setHistory] = useState([
        { type: 'system', text: 'Witaj! Jestem Twoim asystentem AI. Pomogę Ci znaleźć idealny produkt w naszym sklepie. O co chcesz zapytać?' }
    ]);

    const messagesEndRef = useRef(null);

    // Automatyczne przewijanie widoku do najnowszej wiadomości
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [history, isOpen]);

    // Asystent widoczny tylko dla zalogowanych użytkowników
    if (!isAuthenticated || !user) return null;

    const handleSend = async (e) => {
        e.preventDefault();
        const trimmedMsg = message.trim();
        if (!trimmedMsg || isLoading) return;

        setHistory(prev => [...prev, { type: 'user', text: trimmedMsg }]);
        setMessage('');
        setIsLoading(true);

        try {
            const token = localStorage.getItem('token');

            // Komunikacja z kontrolerem Spring AI
            const response = await fetch('http://localhost:8080/api/ai/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    message: trimmedMsg,
                    conversationId: user.id.toString() // Mapowanie na ChatRequest.conversationId
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Błąd serwera AI');
            }

            // Odbiór odpowiedzi jako surowy tekst (String)
            const botReply = await response.text();

            setHistory(prev => [...prev, { type: 'system', text: botReply }]);
        } catch (error) {
            console.error("AI Error:", error);
            setHistory(prev => [...prev, {
                type: 'system',
                text: "Przepraszam, mam problem z połączeniem. Upewnij się, że usługa AI jest aktywna lub spróbuj później."
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* Przycisk otwierający czat */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-black text-white p-4 rounded-full shadow-lg hover:bg-gray-800 transition-all active:scale-95"
            >
                {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
            </button>

            {isOpen && (
                <div className="absolute bottom-20 right-0 w-85 h-[550px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
                    {/* Nagłówek okna */}
                    <div className="bg-black text-white p-4 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <div>
                                <h3 className="font-bold text-sm">Asystent E-Shop</h3>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)}><X className="h-5 w-5" /></button>
                    </div>

                    {/* Obszar wiadomości */}
                    <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-gray-50 text-gray-800">
                        {history.map((msg, index) => (
                            <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[90%] px-4 py-2 rounded-2xl text-sm shadow-sm ${msg.type === 'user'
                                        ? 'bg-black text-white rounded-tr-none'
                                        : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
                                    }`}>
                                    <div className="prose prose-sm max-w-none text-inherit leading-relaxed">
                                        <ReactMarkdown
                                            components={{
                                                // Stylowanie linków do produktów jako przyciski
                                                a: ({ node, ...props }) => (
                                                    <a {...props} className="inline-block bg-gray-100 border border-gray-300 text-black px-2 py-0.5 rounded-md font-semibold hover:bg-gray-200 transition-colors no-underline my-1" />
                                                ),
                                                ul: ({ node, ...props }) => <ul {...props} className="list-disc ml-4 space-y-1" />,
                                                li: ({ node, ...props }) => <li {...props} className="text-sm" />
                                            }}
                                        >
                                            {msg.text}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex gap-2 items-center">
                                    <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                                    <span className="text-xs text-gray-500 font-medium">Asystent analizuje dane...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Formularz wysyłania */}
                    <form onSubmit={handleSend} className="p-4 border-t bg-white">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder={`Zadaj pytanie, ${user.firstName}...`}
                                className="flex-1 border border-gray-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-black outline-none"
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                className="bg-black text-white p-2.5 rounded-xl disabled:bg-gray-300 transition-colors"
                                disabled={!message.trim() || isLoading}
                            >
                                <Send className="h-5 w-5" />
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}