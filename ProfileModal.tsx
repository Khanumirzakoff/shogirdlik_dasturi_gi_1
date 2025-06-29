

import React, { useState, useContext, useRef, useEffect } from 'react';
import { AppContext } from '../contexts/AppContext';
import { UZBEK_STRINGS } from '../constants';
import { XIcon } from './icons/XIcon';
import { UploadIcon } from './icons/UploadIcon';

interface ProfileModalProps {
  onClose: () => void;
  onLogout?: () => void; // Prop remains for potential other uses, but won't be used by default
}

const ProfileModal: React.FC<ProfileModalProps> = ({ onClose, onLogout }) => {
  const context = useContext(AppContext);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false); 

  useEffect(() => {
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
  }, []);
  

  if (!context || !context.currentUser) {
    return (
      <div 
        className={`fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="profileModalLoadingTitle"
      >
        <div className={`bg-white p-6 rounded-none shadow-xl w-full max-w-md lg:max-w-lg border border-gray-300 text-slate-900 transform transition-all duration-300 ease-in-out ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
          <h2 id="profileModalLoadingTitle" className="sr-only">Yuklanmoqda</h2>
          Yuklanmoqda...
        </div>
      </div>
    );
  }
  
  const { currentUser, updateUserProfile, showToast } = context;
  const [name, setName] = useState(currentUser.name);
  const [surname, setSurname] = useState(currentUser.surname);
  const [profilePicPreview, setProfilePicPreview] = useState<string | undefined>(currentUser.profilePictureUrl);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); 
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const newProfilePicUrl = selectedFile ? profilePicPreview : currentUser.profilePictureUrl;
    
    try {
        await updateUserProfile(name, surname, newProfilePicUrl);
        showToast("Profil muvaffaqiyatli yangilandi!", 2000);
        handleClose();
    } catch (error) {
        console.error("Error updating profile:", error);
        showToast("Profilni yangilashda xatolik.", 3000);
    } finally {
        setIsSaving(false);
    }
  };

  const inputClass = "w-full bg-gray-100 border-gray-300 text-black rounded-sm p-3 focus:ring-1 focus:ring-black focus:border-black placeholder-gray-500";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const buttonBaseClass = "px-5 py-2.5 text-sm font-medium rounded-sm shadow-sm transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1";

  return (
    <div 
      className={`fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="profileModalTitle"
    >
      <div className={`bg-white p-6 rounded-none shadow-xl w-full max-w-md lg:max-w-lg border border-gray-300 transform transition-all duration-300 ease-in-out ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        <div className="flex justify-between items-center mb-6">
          <h2 id="profileModalTitle" className="text-xl font-semibold text-black">{UZBEK_STRINGS.editProfile}</h2>
          <button 
            onClick={handleClose} 
            className="text-gray-500 hover:text-black p-1 rounded-full"
            aria-label={UZBEK_STRINGS.cancel}
            disabled={isSaving}
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center space-y-3">
            <img
              src={profilePicPreview || `https://picsum.photos/seed/${currentUser.id}/120/120`}
              alt="Profil rasmi"
              className="w-28 h-28 rounded-full object-cover border-2 border-black"
            />
            <input
              type="file"
              id="profilePictureInput"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              aria-label={UZBEK_STRINGS.uploadImage}
              disabled={isSaving}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-black px-4 py-2 rounded-sm text-sm transition-colors disabled:opacity-50"
              disabled={isSaving}
            >
              <UploadIcon className="w-5 h-5" />
              <span>{UZBEK_STRINGS.uploadImage}</span>
            </button>
          </div>

          <div>
            <label htmlFor="name" className={labelClass}>
              {UZBEK_STRINGS.name}
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`${inputClass} disabled:opacity-70`}
              required
              autoFocus
              disabled={isSaving}
            />
          </div>

          <div>
            <label htmlFor="surname" className={labelClass}>
              {UZBEK_STRINGS.surname}
            </label>
            <input
              type="text"
              id="surname"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              className={`${inputClass} disabled:opacity-70`}
              required
              disabled={isSaving}
            />
          </div>
          
          <div className="flex justify-end items-center pt-2 space-x-3">
              <button
                type="button"
                onClick={handleClose}
                className={`${buttonBaseClass} bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400 disabled:opacity-50`}
                disabled={isSaving}
              >
                {UZBEK_STRINGS.cancel}
              </button>
              <button
                type="submit"
                className={`${buttonBaseClass} bg-black text-white hover:bg-gray-800 focus:ring-black disabled:bg-gray-400 disabled:cursor-not-allowed`}
                disabled={isSaving}
              >
                {isSaving ? UZBEK_STRINGS.saving : UZBEK_STRINGS.save}
              </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileModal;