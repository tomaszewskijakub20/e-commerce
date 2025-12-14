import { useState, useMemo } from "react";
import { Edit3 } from "lucide-react";
import { useOutletContext } from "react-router-dom";

export default function ProfileDetails() {
    const { userData } = useOutletContext();
    const [isEditing, setIsEditing] = useState(false);

    // Lokalny stan formularza do edycji
    const [formData, setFormData] = useState({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email
    });

    // Przełączanie trybu edycji i obsługa zapisu
    const handleEditToggle = () => {
        if (isEditing) {
            console.log('Zapisz zmiany:', formData);
            // Logika do wysyłania PUT /api/user/profile powinna znaleźć się tutaj
        }
        setIsEditing(!isEditing);
    };

    // Anulowanie edycji i resetowanie formularza
    const handleCancelEdit = () => {
        setIsEditing(false);
        setFormData({
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email
        });
    };

    // Obsługa zmian w polach formularza
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    if (isEditing) {
        // Tryb edycji
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-900">Edytuj profil</h3>
                    <div className="flex space-x-2">
                        <button
                            onClick={handleEditToggle}
                            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                        >
                            <span>Zapisz zmiany</span>
                        </button>
                        <button
                            onClick={handleCancelEdit}
                            className="flex items-center space-x-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <span>Anuluj</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Imię *</label>
                        <input type="text" name="firstName" value={formData.firstName} onChange={handleFormChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Wpisz imię" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nazwisko *</label>
                        <input type="text" name="lastName" value={formData.lastName} onChange={handleFormChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Wpisz nazwisko" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                        <input type="email" name="email" value={formData.email} onChange={handleFormChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Wpisz email" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        // Tryb widoku (tylko do odczytu)
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">Mój profil</h3>
                <button
                    onClick={handleEditToggle}
                    className="flex items-center space-x-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                    <Edit3 className="h-4 w-4" />
                    <span>Edytuj dane</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Imię
                    </label>
                    <p className="text-gray-900">{userData.firstName}</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nazwisko
                    </label>
                    <p className="text-gray-900">{userData.lastName}</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                    </label>
                    <p className="text-gray-900">{userData.email}</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data dołączenia
                    </label>
                    <p className="text-gray-900">
                        {new Date(userData.joinDate).toLocaleDateString('pl-PL')}
                    </p>
                </div>
            </div>
        </div>
    );
}