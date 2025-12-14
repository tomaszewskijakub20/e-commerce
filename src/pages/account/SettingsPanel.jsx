import React from 'react';
import { useOutletContext } from 'react-router-dom';

export default function SettingsPanel() {
    const { userData } = useOutletContext();

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900">Ustawienia konta</h3>
            <div className="space-y-4">
                {/* Opcja: Powiadomienia email */}
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                        <p className="font-medium">Powiadomienia email</p>
                        <p className="text-sm text-gray-500">Otrzymuj powiadomienia o promocjach</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                    </label>
                </div>

                {/* Opcja: Newsletter */}
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                        <p className="font-medium">Newsletter</p>
                        <p className="text-sm text-gray-500">Otrzymuj najnowsze informacje</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                    </label>
                </div>
            </div>
        </div>
    );
}