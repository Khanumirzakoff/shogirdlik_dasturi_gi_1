


import React, { useState, useContext, useEffect, useRef, useCallback } from 'react';
import { AppContext } from '../contexts/AppContext';
import { TaskType, CreatableBookReadingFeedItem, BookReadingFeedItem } from '../types';
import { UZBEK_STRINGS, TASK_POINTS } from '../constants';
import { XIcon } from './icons/XIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { UploadIcon } from './icons/UploadIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon'; 
import { StopCircleIcon } from './icons/StopCircleIcon';
import { PlayIcon } from './icons/PlayIcon';
import { PauseIcon } from './icons/PauseIcon';
import { ArrowUturnLeftIcon } from './icons/ArrowUturnLeftIcon';


interface AddBookReadingModalProps {
  onClose: () => void;
}

const AddBookReadingModal: React.FC<AddBookReadingModalProps> = ({ onClose }) => {
  const context = useContext(AppContext);
  
  const isEditing = !!(context?.postToEdit && context.postToEdit.type === TaskType.BOOK_READING);
  const postToEdit = isEditing ? context.postToEdit as BookReadingFeedItem : null;

  const [bookTitle, setBookTitle] = useState('');
  const [pagesRead, setPagesRead] = useState('');
  const [review, setReview] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  const [bookImagePreview, setBookImagePreview] = useState<string | null>(null);
  const bookImageInputRef = useRef<HTMLInputElement>(null);

  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentAudioStreamRef = useRef<MediaStream | null>(null);


  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);
  
  useEffect(() => {
      if (isEditing && postToEdit) {
          setBookTitle(postToEdit.bookTitle);
          setPagesRead(String(postToEdit.pagesRead));
          setReview(postToEdit.review || '');
          setBookImagePreview(postToEdit.bookImageBase64 || null);
          setAudioBlob(postToEdit.audioSummaryBlob || null);
      }
  }, [isEditing, postToEdit]);

  if (!context) return null;
  const { addFeedItem, updateFeedItem, currentUser, showToast } = context;

  const stopCurrentAudioStream = useCallback(() => {
    if (currentAudioStreamRef.current) {
      currentAudioStreamRef.current.getTracks().forEach(track => track.stop());
      currentAudioStreamRef.current = null;
    }
  }, []);

  const cleanupMediaRecorder = useCallback(() => {
    if (mediaRecorderRef.current) {
      const recorder = mediaRecorderRef.current;
      mediaRecorderRef.current = null;
      recorder.onstop = null;
      recorder.ondataavailable = null;
      recorder.onerror = null;
      if (recorder.state === 'recording' || recorder.state === 'paused') {
        try { recorder.stop(); } catch (e) { /* ignore */ }
      }
    }
  }, []);


  const handleClose = useCallback(() => {
    setIsVisible(false);
    stopCurrentAudioStream();
    cleanupMediaRecorder();
    setAudioBlob(null); // Clear the blob state
    setAudioError(null);
    setIsRecordingAudio(false);
    setTimeout(onClose, 300);
  }, [onClose, stopCurrentAudioStream, cleanupMediaRecorder]);


  const handleBookImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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
      const reader = new FileReader();
      reader.onloadend = () => {
        setBookImagePreview(reader.result as string); 
      };
      reader.readAsDataURL(file);
    }
  };

  const startAudioRecording = async () => {
    setAudioError(null);
    setAudioBlob(null);
    audioChunksRef.current = [];

    stopCurrentAudioStream();
    cleanupMediaRecorder();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setAudioError(UZBEK_STRINGS.audioRecordingNotSupported);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      currentAudioStreamRef.current = stream;

      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/ogg;codecs=opus',
        'audio/mp4',
        'audio/webm',
      ];
      const supportedMimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type));
      
      if (!supportedMimeType) {
        setAudioError("Audio yozish uchun mos format topilmadi.");
        stopCurrentAudioStream();
        return;
      }

      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: supportedMimeType });
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      mediaRecorderRef.current.onstop = () => {
        if (audioChunksRef.current.length > 0) {
            const newAudioBlob = new Blob(audioChunksRef.current, { type: mediaRecorderRef.current?.mimeType || supportedMimeType });
            setAudioBlob(newAudioBlob);
        }
        stopCurrentAudioStream(); 
        setIsRecordingAudio(false);
      };
      mediaRecorderRef.current.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        const err = (event as any).error as DOMException | undefined;
        setAudioError(`${UZBEK_STRINGS.audioRecordingError}: ${err?.message || 'Noma\'lum xato'}`);
        setIsRecordingAudio(false);
        stopCurrentAudioStream();
      };

      mediaRecorderRef.current.start();
      setIsRecordingAudio(true);
    } catch (err) {
      console.error("Error starting audio recording:", err);
      let userErrorMessage = UZBEK_STRINGS.audioRecordingError;
      if (err instanceof DOMException) {
        switch (err.name) {
          case "NotFoundError": userErrorMessage = UZBEK_STRINGS.audioRecordingNotSupported + " Mikrofon topilmadi."; break;
          case "NotAllowedError": case "PermissionDeniedError": userErrorMessage = UZBEK_STRINGS.audioAccessDenied; break;
          case "NotReadableError": userErrorMessage = "Mikrofon o'qib bo'lmadi. U boshqa dastur tomonidan ishlatilayotgan bo'lishi mumkin."; break;
          default: userErrorMessage = `${UZBEK_STRINGS.audioRecordingError} (${err.name}). Ruxsatlarni tekshiring.`;
        }
      }
      setAudioError(userErrorMessage);
      setIsRecordingAudio(false);
      stopCurrentAudioStream();
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isAudioPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => setAudioError(UZBEK_STRINGS.audioSummaryPlaybackError));
    }
  };

  const handleDeleteAudio = () => {
    setAudioBlob(null);
    setAudioError(null);
    setIsAudioPlaying(false);
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
    }
  };

  // Effect to manage the temporary URL for the audio player in the modal
  useEffect(() => {
    if (audioBlob && audioRef.current) {
      const url = URL.createObjectURL(audioBlob);
      audioRef.current.src = url;
      return () => {
        URL.revokeObjectURL(url);
        if (audioRef.current) {
          audioRef.current.src = '';
        }
      };
    }
  }, [audioBlob]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!currentUser) {
      setErrorMessage("Foydalanuvchi topilmadi. Iltimos, qayta kiring.");
      return;
    }
    if (!bookTitle.trim()) {
      setErrorMessage("Asar sarlavhasini kiriting.");
      return;
    }
    const numPagesRead = parseInt(pagesRead);
    if (isNaN(numPagesRead) || numPagesRead <= 0) {
      setErrorMessage("O'qilgan sahifalar sonini to'g'ri kiriting.");
      return;
    }

    setIsSubmitting(true);

    try {
        if (isEditing && postToEdit) {
            const updatedItem: BookReadingFeedItem = {
                ...postToEdit,
                bookTitle: bookTitle.trim(),
                pagesRead: numPagesRead,
                review: review.trim() || undefined,
                bookImageBase64: bookImagePreview || undefined,
                audioSummaryBlob: audioBlob || undefined,
            };
            await updateFeedItem(updatedItem);
            showToast(UZBEK_STRINGS.updateSuccess, 2000);
        } else {
            const newItemData: CreatableBookReadingFeedItem = {
                type: TaskType.BOOK_READING,
                bookTitle: bookTitle.trim(),
                pagesRead: numPagesRead,
                review: review.trim() || undefined,
                pointsAwarded: TASK_POINTS[TaskType.BOOK_READING] + Math.floor(numPagesRead / 10),
                bookImageBase64: bookImagePreview || undefined, 
                audioSummaryBlob: audioBlob || undefined, 
            };
            addFeedItem(newItemData); 
            showToast(UZBEK_STRINGS.taskSuccessfullyAdded, 2000);
        }
        handleClose();
    } catch (error) {
        console.error("Error submitting book reading:", error);
        setErrorMessage("Saqlashda xatolik yuz berdi.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const commonInputClass = "w-full bg-gray-100 border-gray-300 text-black rounded-sm p-3 focus:ring-1 focus:ring-black focus:border-black placeholder-gray-500";
  const commonLabelClass = "block text-sm font-medium text-gray-700 mb-1";
  const buttonBaseClass = "px-5 py-2.5 text-sm font-medium rounded-sm shadow-sm transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1";

  return (
    <div 
      className={`fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="addBookReadingModalTitle"
    >
      <div className={`bg-white p-5 rounded-none shadow-xl w-full max-w-md lg:max-w-lg border border-gray-300 transform transition-all duration-300 ease-in-out flex flex-col max-h-[90vh] ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        <div className="flex justify-between items-center mb-5 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <BookOpenIcon className="w-6 h-6 text-black"/>
            <h2 id="addBookReadingModalTitle" className="text-xl font-semibold text-black">{isEditing ? UZBEK_STRINGS.editPost : UZBEK_STRINGS.addBookReadingTitle}</h2>
          </div>
          <button 
            onClick={handleClose} 
            className="text-gray-500 hover:text-black p-1 rounded-full"
            aria-label={UZBEK_STRINGS.cancel}
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 flex-grow overflow-y-auto no-scrollbar pr-1 pb-2">
          
          {/* Book Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="bookTitle" className={commonLabelClass}>
                {UZBEK_STRINGS.bookTitleLabel}
              </label>
              <input
                type="text"
                id="bookTitle"
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
                className={commonInputClass}
                placeholder={UZBEK_STRINGS.bookReadingPlaceholder}
                required
                autoFocus
              />
            </div>
            <div>
              <label htmlFor="pagesRead" className={commonLabelClass}>
                {UZBEK_STRINGS.pagesReadLabel}
              </label>
              <input
                type="number"
                id="pagesRead"
                value={pagesRead}
                onChange={(e) => setPagesRead(e.target.value)}
                className={commonInputClass}
                placeholder={UZBEK_STRINGS.pagesReadPlaceholder}
                min="1"
                required
              />
            </div>
          </div>
          
          {/* Cover and Review */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={commonLabelClass}>
                {UZBEK_STRINGS.uploadBookImage} (ixtiyoriy)
              </label>
              <div className="flex items-start space-x-3">
                 <input
                  type="file"
                  id="bookImage"
                  accept="image/*"
                  ref={bookImageInputRef}
                  onChange={handleBookImageChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => bookImageInputRef.current?.click()}
                  className="w-24 h-36 bg-gray-100 rounded-sm border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-black hover:text-black transition-colors flex-shrink-0"
                  aria-label={UZBEK_STRINGS.uploadBookImage}
                >
                  {bookImagePreview ? (
                     <img src={bookImagePreview} alt="Muqova" className="w-full h-full object-cover rounded-sm"/>
                  ) : (
                    <>
                      <UploadIcon className="w-8 h-8"/>
                      <span className="text-[10px] mt-1 text-center">Rasm Tanlash</span>
                    </>
                  )}
                </button>
                <div className="flex-1">
                   <p className="text-xs text-gray-500">Kitob muqovasini yuklash uni lentada chiroyli ko'rsatishga yordam beradi.</p>
                </div>
              </div>
            </div>
            <div>
              <label htmlFor="review" className={commonLabelClass}>
                {UZBEK_STRINGS.reviewLabel}
              </label>
              <textarea
                id="review"
                value={review}
                onChange={(e) => setReview(e.target.value)}
                className={`${commonInputClass} h-36`}
                placeholder={UZBEK_STRINGS.reviewPlaceholder}
              />
            </div>
          </div>

          {/* Audio Summary */}
          <div>
            <label className={commonLabelClass}>
              {UZBEK_STRINGS.recordAudioSummary} (ixtiyoriy)
            </label>
            <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-sm flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {!isRecordingAudio && !audioBlob && (
                  <>
                    <MicrophoneIcon className="w-6 h-6 text-gray-400"/>
                    <span className="text-sm text-gray-600">Audio xulosa yozing</span>
                  </>
                )}
                {isRecordingAudio && (
                  <>
                    <StopCircleIcon className="w-6 h-6 text-rose-500 animate-pulse"/>
                    <span className="text-sm text-rose-600 font-medium">Yozilmoqda...</span>
                  </>
                )}
                {audioBlob && !isRecordingAudio && (
                   <div className="flex items-center space-x-2">
                      <button 
                          type="button" 
                          onClick={togglePlayPause}
                          className={`${buttonBaseClass} bg-black text-white hover:bg-gray-800 flex items-center space-x-1.5 text-xs px-3 py-1.5`}
                      >
                          {isAudioPlaying ? <PauseIcon className="w-4 h-4"/> : <PlayIcon className="w-4 h-4"/>}
                          <span>{isAudioPlaying ? UZBEK_STRINGS.pause : UZBEK_STRINGS.playAudioSummary}</span>
                      </button>
                      <button 
                          type="button" 
                          onClick={handleDeleteAudio}
                          title={UZBEK_STRINGS.redoAudioSummary}
                          className={`${buttonBaseClass} bg-gray-200 text-gray-700 hover:bg-gray-300 p-0 w-7 h-7 flex items-center justify-center text-xs`}
                      >
                          <ArrowUturnLeftIcon className="w-4 h-4"/>
                      </button>
                   </div>
                )}
              </div>
              <div>
                {!audioBlob && !isRecordingAudio && (
                  <button 
                    type="button" 
                    onClick={startAudioRecording}
                    className="p-2 bg-black rounded-full text-white hover:bg-gray-800 transition-colors"
                  >
                    <MicrophoneIcon className="w-5 h-5"/> 
                  </button>
                )}
                {isRecordingAudio && (
                   <button 
                      type="button" 
                      onClick={stopAudioRecording}
                      className="p-2 bg-rose-500 rounded-full text-white hover:bg-rose-600 transition-colors"
                    >
                     <StopCircleIcon className="w-5 h-5"/>
                   </button>
                )}
              </div>
            </div>
             <audio
                ref={audioRef}
                onPlay={() => setIsAudioPlaying(true)}
                onPause={() => setIsAudioPlaying(false)}
                onEnded={() => setIsAudioPlaying(false)}
                className="hidden"
                preload="auto"
            />
            {audioError && <p className="text-xs text-red-500 mt-1">{audioError}</p>}
          </div>

          {errorMessage && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-sm border border-red-300 mt-2" role="alert">{errorMessage}</p>
          )}
        </form>
        
        <div className="mt-auto pt-4 flex-shrink-0">
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className={`${buttonBaseClass} bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400`}
            >
              {UZBEK_STRINGS.cancel}
            </button>
            <button
              type="submit"
              onClick={handleSubmit} 
              disabled={isSubmitting || isRecordingAudio}
              className={`${buttonBaseClass} bg-black text-white hover:bg-gray-800 focus:ring-black disabled:bg-gray-400 disabled:cursor-not-allowed`}
            >
              {isSubmitting ? UZBEK_STRINGS.saving : (isEditing ? UZBEK_STRINGS.saveChanges : UZBEK_STRINGS.save)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddBookReadingModal;