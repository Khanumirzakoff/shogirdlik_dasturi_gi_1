

import React, { useState, useRef, useContext, useEffect, useCallback } from 'react';
import { AppContext } from '../contexts/AppContext';
import { TaskType, CreatableWakeUpFeedItem } from '../types'; 
import { UZBEK_STRINGS, TASK_POINTS } from '../constants'; 
import { XIcon } from './icons/XIcon';
import { VideoCameraIcon } from './icons/VideoCameraIcon';
import { StopCircleIcon } from './icons/StopCircleIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';


interface WakeUpRecorderProps {
  onClose: () => void;
}

const WakeUpRecorder: React.FC<WakeUpRecorderProps> = ({ onClose }) => {
  const context = useContext(AppContext);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const currentStreamRef = useRef<MediaStream | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const addFeedItem = context?.addFeedItem;
  const showToast = context?.showToast;

  useEffect(() => {
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
  }, []);

  const stopMediaStream = useCallback(() => {
    if (currentStreamRef.current) {
      if (videoRef.current && videoRef.current.srcObject === currentStreamRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      }
      currentStreamRef.current.getTracks().forEach(track => track.stop());
      currentStreamRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
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

  const handleCloseCallback = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      stopMediaStream();
      cleanupMediaRecorder();
      setVideoBlob(null); // This will trigger the useEffect to revoke the URL
      onClose();
    }, 300);
  }, [onClose, stopMediaStream, cleanupMediaRecorder]);

  // Effect to manage temporary URL for video preview
  useEffect(() => {
    if (videoBlob) {
      const url = URL.createObjectURL(videoBlob);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [videoBlob]);

  const startRecording = useCallback(async () => {
    setError(null);
    setVideoBlob(null); // Clear previous recording
    recordedChunksRef.current = [];

    stopMediaStream();
    cleanupMediaRecorder();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Media qurilmalari (kamera/mikrofon) ushbu brauzerda qo'llab-quvvatlanmaydi.");
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: true });
      if (!mediaStream.active) {
        setError("Kamera oqimi faol emas. Qurilmangizni tekshiring.");
        stopMediaStream();
        return;
      }
      currentStreamRef.current = mediaStream;

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(e => console.warn("Video play() for live preview failed:", e));
      }

      const mimeTypesToCheck = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];
      const chosenMimeType = mimeTypesToCheck.find(type => MediaRecorder.isTypeSupported(type)) || '';
      
      const recorder = new MediaRecorder(mediaStream, { mimeType: chosenMimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordedChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        if (recordedChunksRef.current.length > 0) {
          const blob = new Blob(recordedChunksRef.current, { type: recorder.mimeType || 'video/webm' });
          setVideoBlob(blob);
        }
        stopMediaStream();
        setIsRecording(false);
      };
      recorder.onerror = (event: Event) => {
        const err = (event as any).error as DOMException | undefined;
        setError(`Video yozishda xatolik: ${err?.message || 'Noma\'lum xato'}`);
        setIsRecording(false);
        stopMediaStream();
        cleanupMediaRecorder();
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      let userErrorMessage = UZBEK_STRINGS.audioRecordingError;
      if (err instanceof DOMException) {
          switch (err.name) {
              case "NotFoundError": case "DevicesNotFoundError": userErrorMessage += " Kamera yoki mikrofon topilmadi."; break;
              case "NotAllowedError": case "PermissionDeniedError": userErrorMessage = UZBEK_STRINGS.audioAccessDenied; break;
              case "NotReadableError": userErrorMessage = "Kamera yoki mikrofon o'qib bo'lmadi. Boshqa dastur ishlatayotgan bo'lishi mumkin."; break;
              default: userErrorMessage = `Kamera/mikrofonga kirishda xatolik (${err.name}). Ruxsatlarni tekshiring.`;
          }
      }
      setError(userErrorMessage);
      setIsRecording(false);
      stopMediaStream();
    }
  }, [stopMediaStream, cleanupMediaRecorder]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    } else {
      setIsRecording(false);
      stopMediaStream();
    }
  }, [stopMediaStream]);

  const handleSubmit = () => {
    if (!videoBlob || !addFeedItem || !context) return;
    
    let submissionBlocked = false;
    const feedItemData: CreatableWakeUpFeedItem = {
      type: TaskType.WAKE_UP,
      videoBlob: videoBlob,
      description: description.trim() || undefined,
      pointsAwarded: TASK_POINTS[TaskType.WAKE_UP],
    };

    context.addFeedItem(feedItemData, {
      showExistsError: (msg) => {
        setError(msg);
        submissionBlocked = true;
      }
    });

    if (!submissionBlocked) {
      if (showToast) showToast(UZBEK_STRINGS.taskSuccessfullyAdded, 2000);
      handleCloseCallback();
    }
  };

  return (
    <div className={`fixed inset-0 bg-white text-black flex flex-col items-center p-4 z-50
                     transition-all duration-300 ease-in-out rounded-none
                     ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
      <header className="w-full flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-black uppercase">{TaskType.WAKE_UP}</h2>
        <button onClick={handleCloseCallback} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
          <XIcon className="w-7 h-7" />
        </button>
      </header>

      <div className="w-full aspect-[4/3] bg-black rounded-none shadow-lg overflow-hidden mb-4 relative">
        <video
          ref={videoRef}
          playsInline
          autoPlay
          muted={!previewUrl} // Live stream must be muted for autoplay
          controls={!!previewUrl} // Show controls only for the recorded video
          className="w-full h-full object-cover rounded-none"
          key={previewUrl || 'live'} // Force re-render on src change
          src={previewUrl || undefined}
        />
        {isRecording && (
            <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-sm animate-pulse z-10">
            REC
            </div>
        )}
        {!isRecording && !previewUrl && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50">
                <VideoCameraIcon className="w-16 h-16 text-gray-400 mb-2"/>
                <p className="text-gray-300 text-center px-4">{UZBEK_STRINGS.wakeUpPrompt}</p>
            </div>
        )}
         {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 p-4 z-20">
                <p className="text-rose-400 text-center text-sm bg-black/30 p-3 rounded-sm">{error}</p>
            </div>
        )}
      </div>

      {!previewUrl ? (
        <div className="w-full flex justify-center my-4">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="flex items-center space-x-2 bg-rose-600 hover:bg-rose-700 text-white font-bold py-4 px-8 rounded-full shadow-2xl transform transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-opacity-50 disabled:bg-gray-400 active:scale-95"
            >
              <VideoCameraIcon className="w-7 h-7" />
              <span>{UZBEK_STRINGS.startRecording}</span>
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 px-8 rounded-full shadow-2xl transform transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 active:scale-95"
            >
              <StopCircleIcon className="w-7 h-7" />
              <span>{UZBEK_STRINGS.stopRecording}</span>
            </button>
          )}
        </div>
      ) : (
        <>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={UZBEK_STRINGS.wakeUpDescriptionPlaceholder}
            rows={2}
            className="w-full bg-gray-50 border border-gray-300 text-black rounded-sm p-3 mb-4 focus:ring-1 focus:ring-black focus:border-black shadow-sm placeholder-gray-400"
          />
          <button
            onClick={handleSubmit}
            className="flex items-center justify-center space-x-2 w-full max-w-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-8 rounded-full shadow-2xl transform transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-50 active:scale-95"
          >
            <CheckCircleIcon className="w-7 h-7"/>
            <span>{UZBEK_STRINGS.confirm}</span>
          </button>
        </>
      )}
    </div>
  );
};

export default WakeUpRecorder;