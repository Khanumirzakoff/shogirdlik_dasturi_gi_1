import React, { useContext, useState } from 'react';
import { AppContext } from '../contexts/AppContext';
import { UZBEK_STRINGS } from '../constants';

interface ProfileModalProps {
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ onClose }) => {
  const context = useContext(AppContext);
  
  if (!context) return null;

  const { currentUser, updateUserProfile } = context;
  
  const [name, setName] = useState(currentUser?.name || '');
  const [surname, setSurname] = useState(currentUser?.surname || '');
  const [profilePictureUrl, setProfilePictureUrl] = useState(currentUser?.profilePictureUrl || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfilePictureUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !surname.trim()) {
      alert('Ism va familiyani kiriting');
      return;
    }

    setIsSubmitting(true);

    try {
      await updateUserProfile(name.trim(), surname.trim(), profilePictureUrl);
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {UZBEK_STRINGS.editProfile}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Profile Picture */}
          <div className="text-center">
            {profilePictureUrl ? (
              <img 
                src={profilePictureUrl} 
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover mx-auto mb-2"
              />
            ) : (
              <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-gray-600 text-xl font-semibold">
                  {name.charAt(0).toUpperCase() || '?'}
                </span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="text-sm text-gray-600"
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {UZBEK_STRINGS.name}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Surname */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {UZBEK_STRINGS.surname}
            </label>
            <input
              type="text"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              {UZBEK_STRINGS.cancel}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? UZBEK_STRINGS.saving : UZBEK_STRINGS.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileModal;