import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../contexts/AppContext';
import { TaskType, Point } from '../types';
import { UZBEK_STRINGS } from '../constants';

interface RunningTrackerProps {
  onClose: () => void;
}

const RunningTracker: React.FC<RunningTrackerProps> = ({ onClose }) => {
  const context = useContext(AppContext);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [distance, setDistance] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [pathPoints, setPathPoints] = useState<Point[]>([]);
  const [gpsStatus, setGpsStatus] = useState<'searching' | 'ready' | 'active' | 'error'>('searching');
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  if (!context) return null;

  const { addFeedItem } = context;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && !isPaused) {
      interval = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, isPaused]);

  useEffect(() => {
    // Simulate GPS tracking
    if (isRunning && !isPaused) {
      const interval = setInterval(() => {
        // Simulate movement
        const newPoint: Point = {
          lat: 41.2995 + (Math.random() - 0.5) * 0.001,
          lng: 69.2401 + (Math.random() - 0.5) * 0.001,
          speed: Math.random() * 15 + 5 // 5-20 km/h
        };
        
        setPathPoints(prev => [...prev, newPoint]);
        setCurrentSpeed(newPoint.speed);
        setDistance(prev => prev + 0.01); // Simulate distance increment
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [isRunning, isPaused]);

  const handleStart = () => {
    setIsRunning(true);
    setIsPaused(false);
    setGpsStatus('active');
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleFinish = () => {
    if (distance > 0) {
      const pace = duration > 0 ? `${Math.floor(duration / 60 / distance)}:${Math.floor((duration / distance) % 60).toString().padStart(2, '0')}` : '0:00';
      
      addFeedItem({
        type: TaskType.RUNNING,
        distance,
        duration,
        pace,
        pathPoints,
        pointsAwarded: 10 + Math.round(distance)
      });
    }
    onClose();
  };

  const handleExit = () => {
    if (isRunning && distance > 0) {
      setShowExitConfirm(true);
    } else {
      onClose();
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-900">
        <button
          onClick={handleExit}
          className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-800 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h1 className="text-lg font-bold">{UZBEK_STRINGS.startRunning}</h1>
        <div className="w-10"></div>
      </div>

      {/* Stats */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 space-y-8">
        {/* Time */}
        <div className="text-center">
          <p className="text-6xl font-bold font-mono">{formatTime(duration)}</p>
          <p className="text-gray-400 text-lg">{UZBEK_STRINGS.elapsedTime}</p>
        </div>

        {/* Distance & Speed */}
        <div className="grid grid-cols-2 gap-8 w-full max-w-md">
          <div className="text-center">
            <p className="text-3xl font-bold">{distance.toFixed(2)}</p>
            <p className="text-gray-400">{UZBEK_STRINGS.km}</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">{currentSpeed.toFixed(1)}</p>
            <p className="text-gray-400">km/h</p>
          </div>
        </div>

        {/* GPS Status */}
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            gpsStatus === 'active' ? 'bg-green-500' :
            gpsStatus === 'ready' ? 'bg-yellow-500' :
            gpsStatus === 'error' ? 'bg-red-500' :
            'bg-gray-500'
          }`} />
          <span className="text-sm text-gray-400">
            {gpsStatus === 'active' ? UZBEK_STRINGS.gpsActive :
             gpsStatus === 'ready' ? UZBEK_STRINGS.gpsReady :
             gpsStatus === 'error' ? UZBEK_STRINGS.gpsError :
             UZBEK_STRINGS.gpsSearching}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="p-6 bg-gray-900">
        {!isRunning ? (
          <button
            onClick={handleStart}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-lg text-xl font-bold transition-colors"
          >
            {UZBEK_STRINGS.start}
          </button>
        ) : (
          <div className="flex space-x-4">
            <button
              onClick={handlePause}
              className={`flex-1 py-4 rounded-lg text-xl font-bold transition-colors ${
                isPaused 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-yellow-600 hover:bg-yellow-700 text-white'
              }`}
            >
              {isPaused ? UZBEK_STRINGS.resume : UZBEK_STRINGS.pause}
            </button>
            <button
              onClick={handleFinish}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-4 rounded-lg text-xl font-bold transition-colors"
            >
              {UZBEK_STRINGS.finish}
            </button>
          </div>
        )}
      </div>

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-60 p-4">
          <div className="bg-white text-black rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-2">
              {UZBEK_STRINGS.confirmExitRunningTitle}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {UZBEK_STRINGS.confirmExitRunningMessage}
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {UZBEK_STRINGS.dialogCancel}
              </button>
              <button
                onClick={() => {
                  handleFinish();
                  setShowExitConfirm(false);
                }}
                className="flex-1 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
              >
                {UZBEK_STRINGS.saveRunAndExit}
              </button>
              <button
                onClick={() => {
                  setShowExitConfirm(false);
                  onClose();
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
              >
                {UZBEK_STRINGS.discardRunAndExit}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RunningTracker;