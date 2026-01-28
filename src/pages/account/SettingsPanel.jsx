import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../../services/api';
import { Loader, Check, AlertCircle } from 'lucide-react';

export default function SettingsPanel() {
    const { userData } = useOutletContext();
    
    // Stany dla Newslettera
    const [newsletterLoading, setNewsletterLoading] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false); 
    
    // Stan dla komunikatów
    const [message, setMessage] = useState(null);

    const handleNewsletterToggle = async (e) => {
        const wantToSubscribe = e.target.checked;
        setNewsletterLoading(true);
        setMessage(null);

        try {
            if (wantToSubscribe) {
                // Próba zapisu
                await api.post('/newsletter/subscribe', { email: userData.email });
                setMessage({ type: 'success', text: 'Zapisano do newslettera!' });
            } else {
                // Próba wypisu
                await api.post('/newsletter/unsubscribe', { email: userData.email });
                setMessage({ type: 'success', text: 'Wypisano z newslettera.' });
            }
            setIsSubscribed(wantToSubscribe);
        } catch (err) {
            // Obsługa specyficznego błędu: Email już istnieje (409 Conflict)
            if (wantToSubscribe && err.response && err.response.status === 409) {
                setIsSubscribed(true);
                setMessage({ type: 'success', text: 'Jesteś już zapisany na nasz newsletter.' });
            } 
            // Obsługa błędu: Brak subskrypcji przy próbie wypisu (404 Not Found)
            else if (!wantToSubscribe && err.response && err.response.status === 404) {
                setIsSubscribed(false);
                setMessage({ type: 'success', text: 'Nie byłeś zapisany do newslettera.' });
            }
            else {
                // Inne błędy (np. serwer padł)
                console.error("Błąd newslettera:", err);
                setMessage({ type: 'error', text: 'Wystąpił błąd. Spróbuj ponownie.' });
                // Cofamy zmianę w UI, bo akcja się nie powiodła
                e.target.checked = !wantToSubscribe; 
            }
        } finally {
            setNewsletterLoading(false);
            // Ukryj komunikat po 3 sekundach
            setTimeout(() => setMessage(null), 4000);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">Ustawienia konta</h3>
            </div>

            {/* Komunikaty globalne dla panelu */}
            {message && (
                <div className={`p-4 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
                    message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                    {message.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
                    <p className="text-sm font-medium">{message.text}</p>
                </div>
            )}

            <div className="space-y-4">
                {/* Powiadomienia email */}
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white opacity-60 cursor-not-allowed" title="Ta funkcja jest w przygotowaniu">
                    <div>
                        <p className="font-medium text-gray-900">Powiadomienia systemowe</p>
                        <p className="text-sm text-gray-500">Powiadomienia o statusie zamówień</p>
                    </div>
                    <label className="relative inline-flex items-center">
                        <input type="checkbox" className="sr-only peer" checked disabled />
                        <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                    </label>
                </div>

                {/* Newsletter */}
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white transition-shadow hover:shadow-sm">
                    <div>
                        <p className="font-medium text-gray-900">Newsletter</p>
                        <p className="text-sm text-gray-500">Otrzymuj informacje o nowościach i promocjach na: <span className="font-semibold">{userData?.email}</span></p>
                    </div>
                    <div className="flex items-center">
                        {newsletterLoading && <Loader className="animate-spin h-5 w-5 text-gray-400 mr-3" />}
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={isSubscribed}
                                onChange={handleNewsletterToggle}
                                disabled={newsletterLoading}
                            />
                            <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${newsletterLoading ? 'opacity-50' : ''} peer-checked:bg-black`}></div>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
}