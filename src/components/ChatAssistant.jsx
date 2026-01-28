import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { MessageSquare, X, Send, Loader2, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function ChatAssistant() {
    const { user, isAuthenticated } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const [history, setHistory] = useState([
        { 
            type: 'system', 
            text: 'Cześć! Jestem Twoim wirtualnym doradcą. Pomogę Ci znaleźć produkty, sprawdzić ich dostępność i parametry. W czym mogę pomóc?' 
        }
    ]);

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [history, isOpen]);

    if (!isAuthenticated || !user) return null;

    const handleSend = async (e) => {
        e.preventDefault();
        const trimmedMsg = message.trim();
        if (!trimmedMsg || isLoading) return;

        // Dodaj wiadomość użytkownika
        setHistory(prev => [...prev, { type: 'user', text: trimmedMsg }]);
        setMessage('');
        setIsLoading(true);

        try {
            const token = localStorage.getItem('token');
            const conversationId = user.id.toString();

            const response = await fetch('http://localhost:8080/api/ai/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    message: trimmedMsg,
                    conversationId: conversationId
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Błąd serwera AI');
            }

            const botReply = await response.text();

            setHistory(prev => [...prev, { type: 'system', text: botReply }]);
        } catch (error) {
            console.error("AI Error:", error);
            setHistory(prev => [...prev, {
                type: 'system',
                text: "Przepraszam, wystąpił błąd połączenia z asystentem. Spróbuj ponownie za chwilę."
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100]">
            {/* Przycisk otwierający */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-black text-white p-4 rounded-full shadow-2xl hover:bg-gray-800 transition-all active:scale-95 flex items-center justify-center"
            >
                {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
            </button>

            {isOpen && (
                <div className="absolute bottom-20 right-0 w-[350px] sm:w-[400px] h-[550px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300">
                    
                    {/* Header */}
                    <div className="bg-black text-white p-4 flex justify-between items-center shadow-md z-10">
                        <div className="flex items-center gap-3">
                            <div className="bg-gray-800 p-1.5 rounded-full">
                                <Bot className="h-5 w-5 text-green-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">Asystent AI</h3>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                    <span className="text-[10px] text-gray-300 uppercase tracking-wider">Online</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="hover:bg-gray-800 p-1 rounded transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-gray-50 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                        {history.map((msg, index) => (
                            <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[90%] px-4 py-3 rounded-2xl text-sm shadow-sm ${
                                    msg.type === 'user'
                                        ? 'bg-black text-white rounded-tr-none'
                                        : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                                }`}>
                                    {/* Markdown Renderer */}
                                    <div className="prose prose-sm max-w-none text-inherit leading-relaxed">
                                        <ReactMarkdown
                                            components={{
                                                a: ({ node, href, children, ...props }) => {
                                                    const isInternal = href && href.startsWith('/');
                                                    if (isInternal) {
                                                        return (
                                                            <Link 
                                                                to={href} 
                                                                className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold underline decoration-blue-300 hover:decoration-blue-800 transition-all mx-1"
                                                                {...props}
                                                            >
                                                                {children}
                                                            </Link>
                                                        );
                                                    }
                                                    return (
                                                        <a 
                                                            href={href} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer" 
                                                            className="text-blue-600 underline"
                                                            {...props}
                                                        >
                                                            {children}
                                                        </a>
                                                    );
                                                },
                                                p: ({ node, ...props }) => <p {...props} className="mb-1 last:mb-0" />,
                                                ul: ({ node, ...props }) => <ul {...props} className="list-disc ml-4 space-y-1 my-2" />,
                                                li: ({ node, ...props }) => <li {...props} className="text-sm" />,
                                                strong: ({ node, ...props }) => <strong {...props} className="font-bold" />
                                            }}
                                        >
                                            {msg.text}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        {isLoading && (
                            <div className="flex justify-start animate-in fade-in duration-300">
                                <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex gap-3 items-center">
                                    <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                                    <span className="text-xs text-gray-500 font-medium">Piszę odpowiedź...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSend} className="p-3 border-t bg-white">
                        <div className="relative flex items-center gap-2">
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Wpisz wiadomość..."
                                className="flex-1 bg-gray-100 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-black focus:bg-white transition-all outline-none pr-10"
                                disabled={isLoading}
                                autoFocus
                            />
                            <button
                                type="submit"
                                className="absolute right-2 p-1.5 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:hover:bg-black transition-all"
                                disabled={!message.trim() || isLoading}
                            >
                                <Send className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="text-[10px] text-gray-400 text-center mt-2">
                            AI może popełniać błędy. Sprawdź szczegóły produktu.
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}