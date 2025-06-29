import React, { useState, useRef, useContext } from 'react';
import { AppContext } from '../contexts/AppContext';
import { TaskType } from '../types';
import { UZBEK_STRINGS } from '../constants';

interface WakeUpRecorderProps {
  onClose: () => void;
}

const WakeUpRecorder: React.FC<WakeUpRecorderProps> = ({ onClose }) => {
  const context = useContext(AppContext);
  const [isRecording, setIsRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  if (!context) return null;

  const { addFeedItem } = context;

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' }, 
        audio: true 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        setVideoBlob(blob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Kameraga ruxsat berilmadi yoki xatolik yuz berdi.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const retakeVideo = () => {
    setVideoBlob(null);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleSubmit = async () => {
    if (!videoBlob) return;

    setIsSubmitting(true);

    try {
      addFeedItem({
        type: TaskType.WAKE_UP,
        videoBlob,
        description: description.trim(),
        pointsAwarded: 15
      });
      
      onClose();
    } catch (error) {
      console.error('Error submitting wake up record:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Clean up streams
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-900 text-white">
        <button
          onClick={handleClose}
          className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-800 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h1 className="text-lg font-bold">{UZBEK_STRINGS.startWakeUpConfirmation}</h1>
        <div className="w-10"></div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 space-y-6">
        {!videoBlob ? (
          <>
            {/* Camera View */}
            <div className="relative w-full max-w-sm aspect-video bg-gray-800 rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              {!isRecording && !streamRef.current && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-white text-center px-4">
                    {UZBEK_STRINGS.wakeUpPrompt}
                  </p>
                </div>
              )}
            </div>

            {/* Recording Controls */}
            <div className="text-center">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-full text-lg font-bold transition-colors"
                >
                  {UZBEK_STRINGS.startRecording}
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-4 rounded-full text-lg font-bold transition-colors animate-pulse"
                >
                  {UZBEK_STRINGS.stopRecording}
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Video Preview */}
            <div className="w-full max-w-sm aspect-video bg-gray-800 rounded-lg overflow-hidden">
              <video
                controls
                className="w-full h-full object-cover"
                src={URL.createObjectURL(videoBlob)}
              />
            </div>

            {/* Description Input */}
            <div className="w-full max-w-sm">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={UZBEK_STRINGS.wakeUpDescriptionPlaceholder}
                rows={3}
                className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={retakeVideo}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                Qayta olish
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {isSubmitting ? UZBEK_STRINGS.uploading : UZBEK_STRINGS.submit}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WakeUpRecorder;