import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../contexts/AppContext';
import { TaskType, BookReadingFeedItem } from '../types';
import { UZBEK_STRINGS } from '../constants';

interface AddBookReadingModalProps {
  onClose: () => void;
}

const AddBookReadingModal: React.FC<AddBookReadingModalProps> = ({ onClose }) => {
  const context = useContext(AppContext);
  
  if (!context) return null;

  const { addFeedItem, postToEdit, updateFeedItem } = context;
  
  const [bookTitle, setBookTitle] = useState('');
  const [pagesRead, setPagesRead] = useState<number>(0);
  const [review, setReview] = useState('');
  const [bookImageBase64, setBookImageBase64] = useState<string>('');
  const [audioSummaryBlob, setAudioSummaryBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = postToEdit?.type === TaskType.BOOK_READING;

  useEffect(() => {
    if (isEditMode && postToEdit?.type === TaskType.BOOK_READING) {
      const bookItem = postToEdit as BookReadingFeedItem;
      setBookTitle(bookItem.bookTitle);
      setPagesRead(bookItem.pagesRead);
      setReview(bookItem.review || '');
      setBookImageBase64(bookItem.bookImageBase64 || '');
      setAudioSummaryBlob(bookItem.audioSummaryBlob || null);
    }
  }, [postToEdit, isEditMode]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBookImageBase64(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioSummaryBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting audio recording:', error);
      alert(UZBEK_STRINGS.audioAccessDenied);
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const deleteAudioSummary = () => {
    setAudioSummaryBlob(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bookTitle.trim() || pagesRead <= 0) {
      alert('Kitob nomi va sahifalar sonini kiriting');
      return;
    }

    setIsSubmitting(true);

    try {
      const bookData = {
        type: TaskType.BOOK_READING,
        bookTitle: bookTitle.trim(),
        pagesRead,
        review: review.trim(),
        bookImageBase64: bookImageBase64 || undefined,
        audioSummaryBlob: audioSummaryBlob || undefined,
        pointsAwarded: 8 + Math.floor(pagesRead / 10)
      };

      if (isEditMode && postToEdit) {
        const updatedItem: BookReadingFeedItem = {
          ...postToEdit as BookReadingFeedItem,
          ...bookData
        };
        await updateFeedItem(updatedItem);
      } else {
        addFeedItem(bookData);
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving book reading:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {isEditMode ? 'Mutolaani Tahrirlash' : UZBEK_STRINGS.addBookReadingTitle}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Book Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {UZBEK_STRINGS.bookTitleLabel}
            </label>
            <input
              type="text"
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
              placeholder={UZBEK_STRINGS.bookReadingPlaceholder}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Pages Read */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {UZBEK_STRINGS.pagesReadLabel}
            </label>
            <input
              type="number"
              value={pagesRead}
              onChange={(e) => setPagesRead(parseInt(e.target.value) || 0)}
              placeholder={UZBEK_STRINGS.pagesReadPlaceholder}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Review */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {UZBEK_STRINGS.reviewLabel}
            </label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder={UZBEK_STRINGS.reviewPlaceholder}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Book Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {UZBEK_STRINGS.uploadBookImage}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {bookImageBase64 && (
              <div className="mt-2">
                <img 
                  src={bookImageBase64} 
                  alt="Book cover preview"
                  className="w-20 h-24 object-cover rounded border"
                />
              </div>
            )}
          </div>

          {/* Audio Summary */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Audio Xulosa (ixtiyoriy)
            </label>
            <div className="space-y-2">
              {!audioSummaryBlob ? (
                <button
                  type="button"
                  onClick={isRecording ? stopAudioRecording : startAudioRecording}
                  className={`w-full px-4 py-2 rounded-lg text-white font-medium transition-colors ${
                    isRecording 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {isRecording ? UZBEK_STRINGS.stopAudioSummary : UZBEK_STRINGS.recordAudioSummary}
                </button>
              ) : (
                <div className="space-y-2">
                  <audio controls className="w-full">
                    <source src={URL.createObjectURL(audioSummaryBlob)} type="audio/webm" />
                  </audio>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={deleteAudioSummary}
                      className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                    >
                      {UZBEK_STRINGS.deleteAudioSummary}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        deleteAudioSummary();
                        startAudioRecording();
                      }}
                      className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                    >
                      {UZBEK_STRINGS.redoAudioSummary}
                    </button>
                  </div>
                </div>
              )}
            </div>
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
              {isSubmitting 
                ? UZBEK_STRINGS.saving 
                : isEditMode 
                  ? UZBEK_STRINGS.saveChanges 
                  : UZBEK_STRINGS.submit
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBookReadingModal;