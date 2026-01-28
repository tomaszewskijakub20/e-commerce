import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { settingsService } from '../../services/settingsService';
import {
    Save, ArrowLeft, Store, FileText,
    MapPin, Loader, CheckCircle, Upload,
    Plus, Trash2, Edit, HelpCircle, Share2, Globe,
    XCircle, ImageOff, AlertTriangle, Info, X,
    Truck, CreditCard, Mail, Users, Send
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:8080';

// Konfiguracja paska narzędzi edytora tekstu
const quillModules = {
    toolbar: [
        [{ 'header': [1, 2, 3, 4, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'align': [] }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        ['link', 'image', 'video'],
        ['clean']
    ],
};

const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'color', 'background',
    'align',
    'list',
    'indent',
    'link', 'image', 'video'
];

// Komponent modala potwierdzenia
const ConfirmationModal = ({ show, onClose, title, message, onConfirm, confirmText = 'Potwierdź', cancelText = 'Anuluj', type = 'danger', isProcessing = false }) => {
    if (!show) return null;

    const styles = {
        success: { Icon: CheckCircle, iconColor: 'text-green-600', confirmBg: 'bg-green-600 hover:bg-green-700' },
        danger: { Icon: AlertTriangle, iconColor: 'text-red-600', confirmBg: 'bg-red-600 hover:bg-red-700' },
        info: { Icon: Info, iconColor: 'text-blue-500', confirmBg: 'bg-blue-600 hover:bg-blue-700' },
    };
    const { Icon, iconColor, confirmBg } = styles[type] || styles.info;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[200] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl transform transition-all scale-100">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center">
                        <div className={`p-2 rounded-full bg-gray-100 mr-3`}>
                            <Icon className={`h-6 w-6 ${iconColor}`} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors" disabled={isProcessing}>
                        <X className="h-5 w-5" />
                    </button>
                </div>
                
                <p className="text-sm text-gray-600 mb-6 leading-relaxed">{message}</p>

                <div className="flex justify-end space-x-3">
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50" 
                        disabled={isProcessing}
                    >
                        {cancelText}
                    </button>
                    <button 
                        onClick={onConfirm} 
                        className={`px-4 py-2 text-white rounded-lg ${confirmBg} font-medium flex items-center transition-colors disabled:opacity-50 shadow-sm`} 
                        disabled={isProcessing}
                    >
                        {isProcessing && <Loader className="h-4 w-4 animate-spin mr-2" />}
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function Settings() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);

    // Stan danych
    const [settingsMap, setSettingsMap] = useState({});
    const [pages, setPages] = useState([]);
    const [socials, setSocials] = useState([]);
    const [faqs, setFaqs] = useState([]);
    const [subscribers, setSubscribers] = useState([]); // NOWE: Lista subskrybentów

    // Stan edycji
    const [editingPage, setEditingPage] = useState(null);
    const [editingSocial, setEditingSocial] = useState(null);
    const [editingFaq, setEditingFaq] = useState(null);
    
    // Stan formularza Newslettera
    const [newsletterForm, setNewsletterForm] = useState({ subject: '', content: '' });

    // Stan modala potwierdzenia
    const [confirmModal, setConfirmModal] = useState({
        show: false,
        actionType: null,
        itemId: null,
        title: '',
        message: '',
        confirmType: 'danger'
    });

    const getLogoSrc = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        return `${API_BASE_URL}${cleanPath}`;
    };

    const fetchData = useCallback(async () => {
        setDataLoading(true);
        setError(null);
        try {
            const results = await Promise.allSettled([
                settingsService.getSettingsMap(),
                settingsService.getAllPages(),
                settingsService.getSocialLinks(),
                settingsService.getFaqItems(),
                settingsService.getSubscribers() // NOWE: Pobieranie subskrybentów
            ]);

            if (results[0].status === 'fulfilled') setSettingsMap(results[0].value);
            if (results[1].status === 'fulfilled') setPages(results[1].value);
            if (results[2].status === 'fulfilled') setSocials(results[2].value); else setSocials([]); 
            if (results[3].status === 'fulfilled') setFaqs(results[3].value); else setFaqs([]);
            if (results[4].status === 'fulfilled') setSubscribers(results[4].value); else setSubscribers([]);

        } catch (err) {
            console.error("Krytyczny błąd:", err);
            setError("Wystąpił problem z połączeniem do serwera.");
        } finally {
            setDataLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleBackToAdmin = () => navigate("/account/admin");

    const closeConfirmModal = () => {
        if (!loading) setConfirmModal(prev => ({ ...prev, show: false }));
    };

    const handleExecuteAction = async () => {
        setLoading(true);
        const { actionType, itemId } = confirmModal;
        
        try {
            switch (actionType) {
                case 'DELETE_LOGO':
                    await settingsService.deleteLogo();
                    setSettingsMap(prev => ({ ...prev, logo_url: null }));
                    setSuccess("Logo zostało usunięte.");
                    break;
                
                case 'SAVE_GENERAL':
                    const keysToSave = [
                        'shop_name', 'shop_description', 'contact_email', 
                        'contact_phone', 'contact_address', 'footer_copyright', 
                        'nip', 'opening_hours'
                    ];
                    await Promise.all(keysToSave.map(key => settingsService.updateSettingByKey(key, settingsMap[key] || '')));
                    setSuccess("Ustawienia ogólne zapisane.");
                    break;

                case 'SAVE_METHODS':
                    const methodKeys = ['payment_info', 'delivery_info'];
                    await Promise.all(methodKeys.map(key => settingsService.updateSettingByKey(key, settingsMap[key] || '')));
                    setSuccess("Informacje o płatnościach i dostawie zapisane.");
                    break;

                case 'DELETE_PAGE':
                    await settingsService.deletePage(itemId);
                    await fetchData();
                    setSuccess("Strona została usunięta.");
                    break;

                case 'DELETE_SOCIAL':
                    await settingsService.deleteSocialLink(itemId);
                    await fetchData();
                    setSuccess("Link społecznościowy usunięty.");
                    break;

                case 'DELETE_FAQ':
                    await settingsService.deleteFaqItem(itemId);
                    await fetchData();
                    setSuccess("Pytanie FAQ usunięte.");
                    break;
                
                case 'SEND_NEWSLETTER': // NOWE
                    const response = await settingsService.sendNewsletter(newsletterForm);
                    setSuccess(response.message || `Wysłano do ${response.sentCount} odbiorców.`);
                    setNewsletterForm({ subject: '', content: '' }); // Reset formularza
                    break;

                default:
                    break;
            }
            closeConfirmModal();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Wystąpił błąd podczas wykonywania operacji.");
            closeConfirmModal();
        } finally {
            setLoading(false);
            setTimeout(() => setSuccess(null), 3000);
        }
    };

    // MODALE - Handlery
    const requestDeleteLogo = () => {
        setConfirmModal({
            show: true,
            actionType: 'DELETE_LOGO',
            title: 'Usuń logo',
            message: 'Czy na pewno chcesz usunąć logo sklepu? Tej operacji nie można cofnąć.',
            confirmType: 'danger'
        });
    };

    const requestSaveGeneral = () => {
        setConfirmModal({
            show: true,
            actionType: 'SAVE_GENERAL',
            title: 'Zapisz ustawienia',
            message: 'Czy chcesz zapisać zmiany w ustawieniach głównych sklepu?',
            confirmType: 'success',
            confirmText: 'Zapisz'
        });
    };

    const requestSaveMethods = () => {
        setConfirmModal({
            show: true,
            actionType: 'SAVE_METHODS',
            title: 'Zapisz metody',
            message: 'Czy chcesz zapisać informacje o płatnościach i dostawie?',
            confirmType: 'success',
            confirmText: 'Zapisz'
        });
    };

    const requestDeletePage = (id) => {
        setConfirmModal({
            show: true,
            actionType: 'DELETE_PAGE',
            itemId: id,
            title: 'Usuń stronę',
            message: 'Czy na pewno chcesz trwale usunąć tę stronę? Tej operacji nie można cofnąć.',
            confirmType: 'danger',
            confirmText: 'Usuń'
        });
    };

    const requestDeleteSocial = (id) => {
        setConfirmModal({
            show: true,
            actionType: 'DELETE_SOCIAL',
            itemId: id,
            title: 'Usuń link',
            message: 'Czy na pewno chcesz usunąć ten link do social media?',
            confirmType: 'danger',
            confirmText: 'Usuń'
        });
    };

    const requestDeleteFaq = (id) => {
        setConfirmModal({
            show: true,
            actionType: 'DELETE_FAQ',
            itemId: id,
            title: 'Usuń pytanie',
            message: 'Czy na pewno chcesz usunąć to pytanie z sekcji FAQ?',
            confirmType: 'danger',
            confirmText: 'Usuń'
        });
    };

    const requestSendNewsletter = (e) => { // NOWE
        e.preventDefault();
        if (!newsletterForm.subject || !newsletterForm.content) {
            setError("Temat i treść wiadomości są wymagane.");
            return;
        }
        setConfirmModal({
            show: true,
            actionType: 'SEND_NEWSLETTER',
            title: 'Wyślij Newsletter',
            message: `Czy na pewno chcesz wysłać tę wiadomość do ${subscribers.length} subskrybentów? Tej operacji nie można cofnąć.`,
            confirmType: 'info',
            confirmText: 'Wyślij'
        });
    };

    const handleSettingChange = (key, value) => {
        setSettingsMap(prev => ({ ...prev, [key]: value }));
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setLoading(true);
        try {
            const res = await settingsService.uploadLogo(file);
            const newUrlWithTimestamp = res.logoUrl.split('?')[0] + '?t=' + new Date().getTime();
            setSettingsMap(prev => ({ ...prev, logo_url: newUrlWithTimestamp }));
            setSuccess("Logo zaktualizowane.");
        } catch (err) {
            setError("Błąd wgrywania logo.");
        } finally {
            setLoading(false);
        }
    };

    const handleSavePage = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingPage.id) {
                await settingsService.updatePage(editingPage.id, editingPage);
                setSuccess("Strona zaktualizowana.");
            } else {
                await settingsService.createPage(editingPage);
                setSuccess("Strona utworzona.");
            }
            await fetchData();
            setEditingPage(null);
        } catch (err) {
            setError("Błąd zapisu strony: " + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSocial = async (e) => {
        e.preventDefault();
        try {
            if (editingSocial.id) await settingsService.updateSocialLink(editingSocial.id, editingSocial);
            else await settingsService.createSocialLink(editingSocial);
            await fetchData();
            setEditingSocial(null);
        } catch (err) { setError("Błąd zapisu linku."); }
    };

    const handleSaveFaq = async (e) => {
        e.preventDefault();
        try {
            if (editingFaq.id) await settingsService.updateFaqItem(editingFaq.id, editingFaq);
            else await settingsService.createFaqItem(editingFaq);
            await fetchData();
            setEditingFaq(null);
        } catch (err) { setError("Błąd zapisu FAQ."); }
    };

    const renderGeneralTab = () => {
        const logoSrc = getLogoSrc(settingsMap.logo_url);

        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa Sklepu</label>
                        <input 
                            type="text" 
                            value={settingsMap.shop_name || ''} 
                            onChange={(e) => handleSettingChange('shop_name', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-black outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
                        <div className="flex gap-4 items-center">
                            <div className="h-16 w-32 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden relative">
                                {logoSrc ? (
                                    <img 
                                        src={logoSrc} 
                                        alt="Logo sklepu" 
                                        className="max-h-full max-w-full object-contain"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.parentElement.classList.add('image-error');
                                        }}
                                    />
                                ) : null}
                                <div className={`absolute inset-0 flex items-center justify-center text-gray-400 ${logoSrc ? 'hidden image-error:flex' : ''}`}>
                                    <ImageOff className="h-6 w-6" />
                                </div>
                            </div>
                            
                            <div className="flex flex-col gap-2">
                                <label className="cursor-pointer px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 flex items-center transition-colors shadow-sm">
                                    <Upload className="h-4 w-4 mr-2" /> Zmień
                                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                </label>
                                
                                {settingsMap.logo_url && (
                                    <button 
                                        onClick={requestDeleteLogo} 
                                        className="px-4 py-2 border border-gray-300 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 flex items-center transition-colors shadow-sm"
                                        type="button"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" /> Usuń
                                    </button>
                                )}
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 ml-1">Formaty: PNG, JPG, WEBP. Max 5MB.</p>
                    </div>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Opis sklepu (do stopki)</label>
                    <textarea 
                        rows="3" 
                        value={settingsMap.shop_description || ''}
                        onChange={(e) => handleSettingChange('shop_description', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-black outline-none resize-none"
                    />
                </div>

                <div className="border-t pt-6">
                    <h4 className="font-bold mb-4 flex items-center text-gray-800"><MapPin className="h-4 w-4 mr-2"/> Dane Kontaktowe</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Email</label>
                            <input type="email" value={settingsMap.contact_email || ''} onChange={(e) => handleSettingChange('contact_email', e.target.value)} className="w-full border rounded px-3 py-2 focus:ring-1 focus:ring-black outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Telefon</label>
                            <input type="text" value={settingsMap.contact_phone || ''} onChange={(e) => handleSettingChange('contact_phone', e.target.value)} className="w-full border rounded px-3 py-2 focus:ring-1 focus:ring-black outline-none" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Adres</label>
                            <input type="text" value={settingsMap.contact_address || ''} onChange={(e) => handleSettingChange('contact_address', e.target.value)} className="w-full border rounded px-3 py-2 focus:ring-1 focus:ring-black outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">NIP</label>
                            <input type="text" value={settingsMap.nip || ''} onChange={(e) => handleSettingChange('nip', e.target.value)} className="w-full border rounded px-3 py-2 focus:ring-1 focus:ring-black outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Godziny otwarcia</label>
                            <input 
                                type="text" 
                                placeholder="np. Pon-Pt: 9:00-17:00"
                                value={settingsMap.opening_hours || ''} 
                                onChange={(e) => handleSettingChange('opening_hours', e.target.value)} 
                                className="w-full border rounded px-3 py-2 focus:ring-1 focus:ring-black outline-none" 
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Stopka (Copyright)</label>
                            <input type="text" value={settingsMap.footer_copyright || ''} onChange={(e) => handleSettingChange('footer_copyright', e.target.value)} className="w-full border rounded px-3 py-2 focus:ring-1 focus:ring-black outline-none" />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t mt-4">
                    <button 
                        onClick={requestSaveGeneral}
                        disabled={loading} 
                        className="flex items-center px-6 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 shadow-md transition-all active:scale-[0.98]"
                    >
                        {loading ? <Loader className="animate-spin h-4 w-4 mr-2"/> : <Save className="h-4 w-4 mr-2"/>} Zapisz ustawienia
                    </button>
                </div>
            </div>
        );
    };

    const renderMethodsTab = () => {
        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div>
                    <h4 className="font-bold text-lg mb-4 flex items-center text-gray-800">
                        <CreditCard className="h-5 w-5 mr-2"/> Metody Płatności
                    </h4>
                    <p className="text-sm text-gray-500 mb-2">Ten tekst pojawi się w zakładce "Dostawa i płatności" lub w stopce.</p>
                    <div className="bg-white border rounded-lg overflow-hidden">
                        <ReactQuill 
                            theme="snow" 
                            value={settingsMap.payment_info || ''} 
                            onChange={(content) => handleSettingChange('payment_info', content)}
                            modules={quillModules}
                            formats={quillFormats}
                            className="h-48 mb-12"
                            placeholder="Wpisz dostępne formy płatności..."
                        />
                    </div>
                </div>

                <div className="border-t pt-8">
                    <h4 className="font-bold text-lg mb-4 flex items-center text-gray-800">
                        <Truck className="h-5 w-5 mr-2"/> Metody Dostawy
                    </h4>
                    <p className="text-sm text-gray-500 mb-2">Opisz dostępne formy wysyłki i cennik.</p>
                    <div className="bg-white border rounded-lg overflow-hidden">
                        <ReactQuill 
                            theme="snow" 
                            value={settingsMap.delivery_info || ''} 
                            onChange={(content) => handleSettingChange('delivery_info', content)}
                            modules={quillModules}
                            formats={quillFormats}
                            className="h-48 mb-12"
                            placeholder="Wpisz formy dostawy i cennik..."
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t mt-4">
                    <button 
                        onClick={requestSaveMethods}
                        disabled={loading} 
                        className="flex items-center px-6 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 shadow-md transition-all active:scale-[0.98]"
                    >
                        {loading ? <Loader className="animate-spin h-4 w-4 mr-2"/> : <Save className="h-4 w-4 mr-2"/>} Zapisz metody
                    </button>
                </div>
            </div>
        );
    };

    const renderPagesTab = () => (
        <div className="space-y-6">
            {!editingPage ? (
                <>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg text-gray-800">Strony informacyjne</h3>
                        <button 
                            onClick={() => setEditingPage({ title: '', slug: '', content: '', isSystem: false, isActive: true })}
                            className="flex items-center px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
                        >
                            <Plus className="h-4 w-4 mr-2" /> Nowa strona
                        </button>
                    </div>
                    <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Tytuł</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Slug (URL)</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Akcje</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {pages.map(page => (
                                    <tr key={page.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {page.title} {page.isSystem && <span className="ml-2 text-[10px] bg-gray-100 text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full uppercase tracking-wide">Systemowa</span>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">/{page.slug}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${page.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {page.isActive ? 'Aktywna' : 'Ukryta'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => setEditingPage(page)} className="text-blue-600 hover:text-blue-900 mr-3 p-1 hover:bg-blue-50 rounded"><Edit className="h-4 w-4"/></button>
                                            {!page.isSystem && (
                                                <button onClick={() => requestDeletePage(page.id)} className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4"/></button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {pages.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-8 text-center text-sm text-gray-500">Brak stron do wyświetlenia.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                <div className="animate-in fade-in">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg text-gray-800">{editingPage.id ? 'Edytuj stronę' : 'Nowa strona'}</h3>
                        <button onClick={() => setEditingPage(null)} className="text-sm text-gray-500 hover:text-black transition-colors">Anuluj</button>
                    </div>
                    <form onSubmit={handleSavePage} className="space-y-6">
                        {/* Formularz strony */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Tytuł</label>
                                <input required type="text" value={editingPage.title} onChange={e => setEditingPage({...editingPage, title: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-black outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Slug (URL)</label>
                                <input required type="text" value={editingPage.slug} onChange={e => setEditingPage({...editingPage, slug: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-black outline-none" placeholder="np. o-nas" />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700">Treść strony</label>
                            <div className="bg-white border rounded-lg overflow-hidden">
                                <ReactQuill 
                                    theme="snow" 
                                    value={editingPage.content || ''} 
                                    onChange={(content) => setEditingPage({...editingPage, content})}
                                    modules={quillModules}
                                    formats={quillFormats}
                                    className="h-64 mb-12"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t">
                            <label className="flex items-center cursor-pointer">
                                <input type="checkbox" checked={editingPage.isActive} onChange={e => setEditingPage({...editingPage, isActive: e.target.checked})} className="mr-2 h-4 w-4 text-black focus:ring-black border-gray-300 rounded" />
                                <span className="text-sm text-gray-700">Strona widoczna dla klientów</span>
                            </label>
                            <button type="submit" className="px-6 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 shadow-md transition-all active:scale-[0.98]">
                                Zapisz stronę
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );

    const renderSocialsTab = () => (
        <div className="space-y-6">
            <h3 className="font-bold text-lg mb-4 flex items-center text-gray-800"><Share2 className="h-5 w-5 mr-2"/> Linki Społecznościowe</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {socials.map(social => (
                    <div key={social.id} className="border border-gray-200 p-4 rounded-lg flex justify-between items-center bg-white shadow-sm hover:shadow-md transition-shadow">
                        <div>
                            <div className="font-bold text-gray-900">{social.platformName}</div>
                            <div className="text-xs text-gray-500 truncate max-w-[200px]">{social.url}</div>
                        </div>
                        <div className="flex space-x-2">
                            <button onClick={() => setEditingSocial(social)} className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit className="h-4 w-4"/></button>
                            <button onClick={() => requestDeleteSocial(social.id)} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4"/></button>
                        </div>
                    </div>
                ))}
                
                <button onClick={() => setEditingSocial({ platformName: '', url: '', iconCode: '', sortOrder: 0, isActive: true })} className="border-2 border-dashed border-gray-300 p-4 rounded-lg flex items-center justify-center text-gray-500 hover:border-black hover:text-black transition-colors min-h-[80px]">
                    <Plus className="h-5 w-5 mr-2" /> Dodaj nowy link
                </button>
            </div>

            {editingSocial && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl">
                        <h3 className="font-bold mb-4 text-lg">{editingSocial.id ? 'Edytuj link' : 'Nowy link'}</h3>
                        <form onSubmit={handleSaveSocial} className="space-y-4">
                            {/* Formularz Socials */}
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Nazwa</label>
                                <input required placeholder="np. Facebook" value={editingSocial.platformName} onChange={e => setEditingSocial({...editingSocial, platformName: e.target.value})} className="w-full border p-2 rounded focus:ring-1 focus:ring-black outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Adres URL</label>
                                <input required placeholder="https://..." value={editingSocial.url} onChange={e => setEditingSocial({...editingSocial, url: e.target.value})} className="w-full border p-2 rounded focus:ring-1 focus:ring-black outline-none" />
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setEditingSocial(null)} className="px-4 py-2 border rounded hover:bg-gray-50">Anuluj</button>
                                <button type="submit" className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800">Zapisz</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );

    const renderFaqTab = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg flex items-center text-gray-800"><HelpCircle className="h-5 w-5 mr-2"/> Częste Pytania (FAQ)</h3>
                <button onClick={() => setEditingFaq({ question: '', answer: '', sortOrder: 0, isActive: true })} className="text-sm bg-black text-white px-4 py-2 rounded-lg flex items-center hover:bg-gray-800 transition-colors shadow-sm">
                    <Plus className="h-3 w-3 mr-1" /> Dodaj pytanie
                </button>
            </div>

            <div className="space-y-4">
                {faqs.map(faq => (
                    <div key={faq.id} className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm">
                        <div className="flex justify-between items-start">
                            <div className="font-bold text-gray-900 text-lg">{faq.question}</div>
                            <div className="flex space-x-2 ml-4">
                                <button onClick={() => setEditingFaq(faq)} className="text-gray-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50"><Edit className="h-4 w-4"/></button>
                                <button onClick={() => requestDeleteFaq(faq.id)} className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50"><Trash2 className="h-4 w-4"/></button>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-2 leading-relaxed">{faq.answer}</p>
                    </div>
                ))}
                {faqs.length === 0 && (
                    <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        Brak pytań FAQ.
                    </div>
                )}
            </div>

            {editingFaq && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-xl w-full max-w-lg shadow-2xl">
                        <h3 className="font-bold mb-4 text-lg">{editingFaq.id ? 'Edytuj pytanie' : 'Nowe pytanie'}</h3>
                        <form onSubmit={handleSaveFaq} className="space-y-4">
                            {/* Formularz FAQ */}
                            <div>
                                <label className="block text-sm font-bold mb-1">Pytanie</label>
                                <input required value={editingFaq.question} onChange={e => setEditingFaq({...editingFaq, question: e.target.value})} className="w-full border p-2 rounded focus:ring-1 focus:ring-black outline-none" placeholder="Np. Jak zwrócić towar?" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Odpowiedź</label>
                                <textarea required rows="4" value={editingFaq.answer} onChange={e => setEditingFaq({...editingFaq, answer: e.target.value})} className="w-full border p-2 rounded focus:ring-1 focus:ring-black outline-none resize-none" placeholder="Tutaj wpisz odpowiedź..." />
                            </div>
                            <div className="flex items-center">
                                <input type="checkbox" checked={editingFaq.isActive} onChange={e => setEditingFaq({...editingFaq, isActive: e.target.checked})} className="mr-2 h-4 w-4 text-black focus:ring-black border-gray-300 rounded"/>
                                <label className="text-sm">Pytanie aktywne (widoczne na stronie)</label>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setEditingFaq(null)} className="px-4 py-2 border rounded hover:bg-gray-50">Anuluj</button>
                                <button type="submit" className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800">Zapisz</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );

    // Newsletter
    const renderNewsletterTab = () => (
        <div className="space-y-8 animate-in fade-in">
            {/* Sekcja Wysyłki */}
            <div className="bg-white border rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-lg mb-4 flex items-center text-gray-800">
                    <Send className="h-5 w-5 mr-2" /> Wyślij Newsletter
                </h3>
                <form onSubmit={requestSendNewsletter} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold mb-1">Temat wiadomości</label>
                        <input 
                            required 
                            type="text" 
                            value={newsletterForm.subject} 
                            onChange={(e) => setNewsletterForm({...newsletterForm, subject: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-black outline-none"
                            placeholder="Wpisz temat newslettera..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1">Treść wiadomości</label>
                        <div className="bg-white border rounded-lg overflow-hidden">
                            <ReactQuill 
                                theme="snow" 
                                value={newsletterForm.content} 
                                onChange={(content) => setNewsletterForm({...newsletterForm, content})}
                                modules={quillModules}
                                formats={quillFormats}
                                className="h-64 mb-12"
                                placeholder="Wpisz treść wiadomości..."
                            />
                        </div>
                    </div>
                    <div className="flex justify-end pt-4">
                        <button 
                            type="submit" 
                            disabled={subscribers.length === 0}
                            className="flex items-center px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md transition-all active:scale-[0.98] disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            <Send className="h-4 w-4 mr-2" /> Wyślij do {subscribers.length} subskrybentów
                        </button>
                    </div>
                </form>
            </div>

            {/* Lista Subskrybentów */}
            <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold flex items-center text-gray-800">
                        <Users className="h-5 w-5 mr-2" /> Lista Subskrybentów ({subscribers.length})
                    </h3>
                </div>
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Data zapisu</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">ID Użytkownika</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {subscribers.map((sub) => (
                                <tr key={sub.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sub.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(sub.subscribedAt).toLocaleString('pl-PL')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {sub.userId ? (
                                            <span className="bg-blue-100 text-blue-800 py-1 px-2 rounded-full text-xs font-bold">
                                                ID: {sub.userId}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 italic">Gość</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {subscribers.length === 0 && (
                                <tr>
                                    <td colSpan="3" className="px-6 py-8 text-center text-sm text-gray-500">Brak zapisanych subskrybentów.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    if (dataLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader className="h-8 w-8 animate-spin text-gray-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-12 py-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Header */}
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <button 
                            onClick={handleBackToAdmin}
                            className="flex items-center text-gray-500 hover:text-gray-900 mb-2 transition-colors group"
                        >
                            <ArrowLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" /> Wróć do panelu
                        </button>
                        <h1 className="text-3xl font-bold text-gray-900">Ustawienia Sklepu</h1>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-lg flex items-center border border-red-200 shadow-sm animate-in fade-in">
                        <XCircle className="h-5 w-5 mr-2 flex-shrink-0" /> 
                        <span>{error}</span>
                        <button onClick={() => setError(null)} className="ml-auto text-sm underline hover:text-red-900">Zamknij</button>
                    </div>
                )}

                {success && (
                    <div className="mb-6 bg-green-50 text-green-700 p-4 rounded-lg flex items-center border border-green-200 shadow-sm animate-in fade-in slide-in-from-top-2">
                        <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                        {success}
                    </div>
                )}

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar / Tabs */}
                    <div className="w-full md:w-64 flex-shrink-0">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-24">
                            <nav className="flex flex-col">
                                <button onClick={() => setActiveTab('general')} className={`flex items-center px-6 py-4 text-sm font-medium transition-colors border-l-4 ${activeTab === 'general' ? 'border-black bg-gray-50 text-black font-bold' : 'border-transparent text-gray-600 hover:bg-gray-50'}`}>
                                    <Store className="h-5 w-5 mr-3" /> Ogólne
                                </button>
                                <button onClick={() => setActiveTab('methods')} className={`flex items-center px-6 py-4 text-sm font-medium transition-colors border-l-4 ${activeTab === 'methods' ? 'border-black bg-gray-50 text-black font-bold' : 'border-transparent text-gray-600 hover:bg-gray-50'}`}>
                                    <Truck className="h-5 w-5 mr-3" /> Płatność i Dostawa
                                </button>
                                <button onClick={() => setActiveTab('pages')} className={`flex items-center px-6 py-4 text-sm font-medium transition-colors border-l-4 ${activeTab === 'pages' ? 'border-black bg-gray-50 text-black font-bold' : 'border-transparent text-gray-600 hover:bg-gray-50'}`}>
                                    <FileText className="h-5 w-5 mr-3" /> Strony (CMS)
                                </button>
                                <button onClick={() => setActiveTab('socials')} className={`flex items-center px-6 py-4 text-sm font-medium transition-colors border-l-4 ${activeTab === 'socials' ? 'border-black bg-gray-50 text-black font-bold' : 'border-transparent text-gray-600 hover:bg-gray-50'}`}>
                                    <Globe className="h-5 w-5 mr-3" /> Social Media
                                </button>
                                <button onClick={() => setActiveTab('faq')} className={`flex items-center px-6 py-4 text-sm font-medium transition-colors border-l-4 ${activeTab === 'faq' ? 'border-black bg-gray-50 text-black font-bold' : 'border-transparent text-gray-600 hover:bg-gray-50'}`}>
                                    <HelpCircle className="h-5 w-5 mr-3" /> FAQ
                                </button>
                                <button onClick={() => setActiveTab('newsletter')} className={`flex items-center px-6 py-4 text-sm font-medium transition-colors border-l-4 ${activeTab === 'newsletter' ? 'border-black bg-gray-50 text-black font-bold' : 'border-transparent text-gray-600 hover:bg-gray-50'}`}>
                                    <Mail className="h-5 w-5 mr-3" /> Newsletter
                                </button>
                            </nav>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[600px]">
                            {activeTab === 'general' && renderGeneralTab()}
                            {activeTab === 'methods' && renderMethodsTab()}
                            {activeTab === 'pages' && renderPagesTab()}
                            {activeTab === 'socials' && renderSocialsTab()}
                            {activeTab === 'faq' && renderFaqTab()}
                            {activeTab === 'newsletter' && renderNewsletterTab()}
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL POTWIERDZENIA */}
            <ConfirmationModal 
                show={confirmModal.show}
                onClose={closeConfirmModal}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={handleExecuteAction}
                type={confirmModal.confirmType}
                confirmText={confirmModal.confirmText}
                isProcessing={loading}
            />
        </div>
    );
}