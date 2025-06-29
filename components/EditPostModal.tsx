import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../contexts/AppContext';
import { TaskType, RunningFeedItem, WakeUpFeedItem, DailyPlanFeedItem } from '../types';
import { UZBEK_STRINGS } from '../constants';

const EditPostModal: React.FC = () => {
  const context = useContext(AppContext);
  
  if (!context) return null;

  const { postToEdit, closePostEditor, updateFeedItem } = context;
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (postToEdit) {
      if (postToEdit.type === TaskType.RUNNING) {
        setDescription((postToEdit as RunningFeedItem).description || '');
      } else if (postToEdit.type === TaskType.WAKE_UP) {
        setDescription((postToEdit as WakeUpFeedItem).description || '');
      }
    }
  }, [postToEdit]);

  if (!postToEdit) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let updatedItem = { ...postToEdit };

      if (postToEdit.type === TaskType.RUNNING) {
        updatedItem = { ...updatedItem, description } as RunningFeedItem;
      } else if (postToEdit.type === TaskType.WAKE_UP) {
        updatedItem = { ...updatedItem, description } as WakeUpFeedItem;
      }

      await updateFeedItem(updatedItem);
      closePostEditor();
    } catch (error) {
      console.error('Error updating post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canEdit = postToEdit.type === TaskType.RUNNING || postToEdit.type === TaskType.WAKE_UP;

  if (!canEdit) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {UZBEK_STRINGS.editPostTitle}
          </h2>
          <p className="text-gray-600 mb-4">
            Bu turdagi xabarni tahrirlash mumkin emas.
          </p>
          <button
            onClick={closePostEditor}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            {UZBEK_STRINGS.cancel}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {UZBEK_STRINGS.editPostTitle}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {UZBEK_STRINGS.editPostDescriptionLabel}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Tavsif yozing..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={closePostEditor}
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
              {isSubmitting ? UZBEK_STRINGS.saving : UZBEK_STRINGS.saveChanges}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPostModal;