import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../contexts/AppContext';
import { FeedItem, RunningFeedItem, WakeUpFeedItem } from '../types';
import { UZBEK_STRINGS } from '../constants';
import { XIcon } from './icons/XIcon';

const EditPostModal: React.FC = () => {
    const context = useContext(AppContext);
    const [isVisible, setIsVisible] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [description, setDescription] = useState('');

    useEffect(() => {
        requestAnimationFrame(() => setIsVisible(true));
    }, []);

    if (!context || !context.postToEdit) return null;

    const { postToEdit, closePostEditor, updateFeedItem, showToast } = context;

    const typedPost = postToEdit as RunningFeedItem | WakeUpFeedItem;

    // Initialize state when the component mounts with the post to edit
    useEffect(() => {
        if (typedPost) {
            setDescription(typedPost.description || '');
        }
    }, [typedPost]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(closePostEditor, 300);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const updatedPost: FeedItem = {
                ...typedPost,
                description: description.trim() || undefined,
            };
            await updateFeedItem(updatedPost);
            showToast(UZBEK_STRINGS.updateSuccess, 2000);
            handleClose();
        } catch (error) {
            console.error("Error updating post:", error);
            showToast("Xabarni yangilashda xatolik.", 3000);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div
            className={`fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="editPostModalTitle"
        >
            <div className={`bg-white p-6 rounded-none shadow-xl w-full max-w-md border border-gray-300 transform transition-all duration-300 ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
                <div className="flex justify-between items-center mb-4">
                    <h2 id="editPostModalTitle" className="text-xl font-semibold text-black">
                        {UZBEK_STRINGS.editPostTitle}
                    </h2>
                    <button onClick={handleClose} className="p-1 text-gray-500 hover:text-black rounded-full transition-colors" disabled={isSaving}>
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label htmlFor="post-description" className="block text-sm font-medium text-gray-700 mb-1">
                            {UZBEK_STRINGS.editPostDescriptionLabel}
                        </label>
                        <textarea
                            id="post-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            className="w-full bg-gray-50 border-gray-300 text-black rounded-sm p-3 focus:ring-1 focus:ring-black focus:border-black placeholder-gray-400"
                            placeholder="Qo'shimcha izohlar..."
                            autoFocus
                            disabled={isSaving}
                        />
                    </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                    <button
                        onClick={handleClose}
                        disabled={isSaving}
                        className="px-5 py-2.5 text-sm font-medium rounded-sm shadow-sm transition-colors bg-gray-200 text-gray-800 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400"
                    >
                        {UZBEK_STRINGS.cancel}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-5 py-2.5 text-sm font-medium rounded-sm shadow-sm transition-colors bg-black text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-black disabled:bg-gray-400"
                    >
                        {isSaving ? UZBEK_STRINGS.saving : UZBEK_STRINGS.saveChanges}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditPostModal;
