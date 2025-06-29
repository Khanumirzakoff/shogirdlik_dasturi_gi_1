

import React, { useContext, useState, useEffect, useRef } from 'react';
import { AppContext } from '../contexts/AppContext';
import { UZBEK_STRINGS } from '../constants';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { XIcon } from './icons/XIcon';
import { PencilIcon } from './icons/PencilIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ArrowRightOnRectangleIcon } from './icons/ArrowRightOnRectangleIcon';
import { UploadIcon } from './icons/UploadIcon';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onLogoutRequest: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onLogoutRequest }) => {
    const context = useContext(AppContext);
    
    if (!context) return null;
    
    const { currentUser, setCurrentView, setViewingUserProfileId, updateUserProfile, showToast } = context;

    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(currentUser?.name || '');
    const [surname, setSurname] = useState(currentUser?.surname || '');
    const [isSaving, setIsSaving] = useState(false);
    
    const [profilePicPreview, setProfilePicPreview] = useState<string | undefined>(currentUser?.profilePictureUrl);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);


    useEffect(() => {
        if (currentUser) {
            setName(currentUser.name);
            setSurname(currentUser.surname);
            setProfilePicPreview(currentUser.profilePictureUrl);
            setSelectedFile(null); // Clear selected file when user changes or editing is cancelled
        }
    }, [currentUser, isEditing]); // Re-run when editing is cancelled to reset state

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
          if (!file.type.startsWith('image/')) {
            showToast("Faqat rasm fayllarini yuklang.", 3000);
            return;
          }
          if (file.size > 2 * 1024 * 1024) { // 2MB limit
            showToast("Rasm hajmi 2MB dan oshmasligi kerak.", 3000);
            return;
          }
    
          setSelectedFile(file);
          const reader = new FileReader();
          reader.onloadend = () => {
            setProfilePicPreview(reader.result as string);
          };
          reader.readAsDataURL(file);
        }
      };


    const handleSave = async () => {
        if (!currentUser || !name.trim() || !surname.trim()) {
            showToast("Ism va familiya bo'sh bo'lishi mumkin emas.", 3000);
            return;
        }
        setIsSaving(true);
        try {
            const newProfilePicUrl = selectedFile ? profilePicPreview : currentUser.profilePictureUrl;
            await updateUserProfile(name, surname, newProfilePicUrl);
            showToast("Profil muvaffaqiyatli yangilandi!", 2000);
            setIsEditing(false);
        } catch (error) {
            showToast("Profilni yangilashda xatolik.", 3000);
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        // The useEffect will handle resetting the state
    };

    const handleMyResultsClick = () => {
        if (currentUser) {
            setViewingUserProfileId(currentUser.id);
            setCurrentView('profilePage');
            onClose();
        }
    };

    const handleLogout = () => {
        onLogoutRequest();
    };

    if (!currentUser) {
        return null; // Don't show sidebar if not logged in
    }

    const commonNavItemClass = "flex items-center space-x-4 p-3 rounded-none w-full text-left text-gray-700 hover:bg-gray-100 transition-colors duration-150";

    return (
        <>
            <div
                className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
                aria-hidden="true"
            />
            <aside
                className={`fixed top-0 left-0 h-full w-72 md:w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="sidebar-title"
            >
                <header className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
                    <h2 id="sidebar-title" className="text-lg font-semibold text-black">{UZBEK_STRINGS.profile}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-black p-1 rounded-full">
                        <XIcon className="w-6 h-6" />
                    </button>
                </header>

                <div className="flex-grow p-4 space-y-4 overflow-y-auto no-scrollbar">
                    <div className="flex items-center space-x-3 pb-4 border-b border-gray-100">
                        <div className="relative group">
                            <img
                                src={profilePicPreview || `https://picsum.photos/seed/${currentUser.id}/100/100`}
                                alt={currentUser.name}
                                className="w-16 h-16 rounded-full object-cover border-2 border-gray-300"
                            />
                             {isEditing && (
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                    aria-label={UZBEK_STRINGS.uploadImage}
                                >
                                    <UploadIcon className="w-7 h-7"/>
                                </button>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            {!isEditing ? (
                                <>
                                    <h3 className="text-lg font-bold text-black truncate">{currentUser.name} {currentUser.surname}</h3>
                                    <button onClick={() => setIsEditing(true)} className="flex items-center text-xs text-sky-600 hover:text-sky-800">
                                        <PencilIcon className="w-3 h-3 mr-1"/> Tahrirlash
                                    </button>
                                </>
                            ) : (
                                <div className="space-y-2">
                                    <input 
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        className="hidden"
                                        accept="image/*"
                                        disabled={isSaving}
                                    />
                                    <input 
                                        type="text" 
                                        value={name} 
                                        onChange={(e) => setName(e.target.value)} 
                                        className="w-full text-sm p-1.5 border border-gray-300 rounded-sm focus:ring-1 focus:ring-black bg-white text-black" 
                                        placeholder={UZBEK_STRINGS.name}
                                        disabled={isSaving}
                                    />
                                    <input 
                                        type="text" 
                                        value={surname} 
                                        onChange={(e) => setSurname(e.target.value)} 
                                        className="w-full text-sm p-1.5 border border-gray-300 rounded-sm focus:ring-1 focus:ring-black bg-white text-black"
                                        placeholder={UZBEK_STRINGS.surname}
                                        disabled={isSaving}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {isEditing && (
                        <div className="flex justify-end space-x-2">
                            <button onClick={handleCancelEdit} className="text-xs px-3 py-1.5 bg-gray-200 rounded-sm hover:bg-gray-300">
                                {UZBEK_STRINGS.cancel}
                            </button>
                            <button onClick={handleSave} disabled={isSaving} className="text-xs px-3 py-1.5 bg-black text-white rounded-sm hover:bg-gray-800 disabled:bg-gray-400 flex items-center">
                                {isSaving ? <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg> : <CheckCircleIcon className="w-4 h-4 mr-1"/>}
                                 {isSaving ? UZBEK_STRINGS.saving : UZBEK_STRINGS.save}
                            </button>
                        </div>
                    )}
                    
                    <nav className="flex-1">
                        <button onClick={handleMyResultsClick} className={commonNavItemClass}>
                            <ChartBarIcon className="w-6 h-6 text-gray-500" />
                            <span className="font-medium">{UZBEK_STRINGS.myProgress}</span>
                        </button>
                    </nav>
                </div>
                
                <footer className="p-2 mt-auto border-t border-gray-200 flex-shrink-0 flex flex-col space-y-2">
                     <div className="text-xs text-gray-600 p-3 bg-gray-50 rounded-sm border border-gray-200 space-y-1">
                         <p className="font-semibold text-gray-800 mb-1">Dasturchi haqida</p>
                         <p><strong>Ism:</strong> Abdulbosit Umirzoqov</p>
                         <p><strong>Taxallus:</strong> Khan Umirzakoff</p>
                         <p>
                             <strong>Telegram:</strong>{' '}
                             <a href="https://t.me/Khan_Umirzakoff" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">
                                 @Khan_Umirzakoff
                             </a>
                         </p>
                     </div>
                    <button onClick={handleLogout} className={`${commonNavItemClass} text-rose-600 hover:bg-rose-50`}>
                        <ArrowRightOnRectangleIcon className="w-6 h-6" />
                        <span className="font-medium">{UZBEK_STRINGS.logoutButton}</span>
                    </button>
                </footer>
            </aside>
        </>
    );
};

export default Sidebar;