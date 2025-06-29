
import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import L from 'leaflet';
import { AppContext } from '../contexts/AppContext';
import { TaskType, Point as AppPoint, CreatableRunningFeedItem } from '../types'; 
import { UZBEK_STRINGS, TASK_POINTS, RECENTER_DISTANCE_THRESHOLD_METERS, DEFAULT_MAP_ZOOM, DEFAULT_MAP_CENTER } from '../constants';
import { LockClosedIcon } from './icons/LockClosedIcon';
import { LockOpenIcon } from './icons/LockOpenIcon';
import { TargetIcon } from './icons/TargetIcon';
import { XIcon } from './icons/XIcon';


interface RunningTrackerProps {
  onClose: () => void;
}

const formatTimerMMSS = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const haversineDistance = (coords1: { lat: number; lng: number }, coords2: { lat: number; lng: number }): number => {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371; // Radius of the Earth in km

  const dLat = toRad(coords2.lat - coords1.lat);
  const dLng = toRad(coords2.lng - coords1.lng);
  const lat1 = toRad(coords1.lat);
  const lat2 = toRad(coords2.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance; // in km
};

const MIN_ACCURACY_METERS_FOR_DISPLAY_WARNING = 35;
const PATH_POINT_MIN_DISTANCE_METERS = 0.1; 

const blueDotIcon = L.divIcon({
    html: `<svg viewBox="0 0 24 24" width="24px" height="24px" fill="rgba(0,123,255,0.9)" stroke="#fff" stroke-width="2"><circle cx="12" cy="12" r="8"/></svg>`,
    className: '', 
    iconSize: [24, 24],
    iconAnchor: [12, 12]
});

const startFlagIcon = L.divIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#16a34a" width="28px" height="28px"><path d="M6 3v18h2v-7l5-1 4 1.5V6.5L13 5l-7-2z"/></svg>`,
    className: '',
    iconSize: [28,28],
    iconAnchor: [2, 26] 
});

const trailDotIcon = L.divIcon({
    html: `<div style="width: 7px; height: 7px; background-color: #0ea5e9; border-radius: 50%; border: 1px solid white; box-shadow: 0 0 3px rgba(0,0,0,0.5);"></div>`, // sky-500
    className: '',
    iconSize: [7, 7],
    iconAnchor: [3, 3]
});


const RunningTracker: React.FC<RunningTrackerProps> = ({ onClose }) => {
  const context = useContext(AppContext);
  const [status, setStatus] = useState<'idle' | 'running' | 'paused'>('idle');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [distance, setDistance] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0); 
  const [pathPoints, setPathPoints] = useState<AppPoint[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [runStartTime, setRunStartTime] = useState<Date | null>(null);

  const [gpsRuntimeError, setGpsRuntimeError] = useState<string | null>(null);
  const [gpsInitialStatus, setGpsInitialStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [gpsInitialErrorMsg, setGpsInitialErrorMsg] = useState<string | null>(null);

  const [calories, setCalories] = useState(0); 
  const [avgPaceDisplay, setAvgPaceDisplay] = useState("--:--");
  const [isScreenLocked, setIsScreenLocked] = useState(false);
  const [triggerLockShakeAnimation, setTriggerLockShakeAnimation] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);


  const mainTimerRef = useRef<number | null>(null);
  const watchIdRef = useRef<number | null>(null);
  
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const pathPolylineRef = useRef<L.Polyline | null>(null);
  const currentPositionMarkerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const startMarkerRef = useRef<L.Marker | null>(null);
  const trailMarkersRef = useRef<L.Marker[]>([]); 
  
  const lastGoodPositionRef = useRef<AppPoint | null>(null);
  const autoCenterMap = useRef(true);
  const recenterTimeoutRef = useRef<number | null>(null);
  const mapInitializedRef = useRef(false);
  
  const addFeedItem = context?.addFeedItem;

  const resetState = useCallback(() => {
    setStatus('idle');
    setElapsedTime(0);
    setDistance(0);
    setCurrentSpeed(0);
    setPathPoints([]);
    setRunStartTime(null);
    setGpsRuntimeError(null);
    setCalories(0);
    setAvgPaceDisplay("--:--");
    setIsScreenLocked(false);
    autoCenterMap.current = true;
    lastGoodPositionRef.current = null;
    
    if (mainTimerRef.current) clearInterval(mainTimerRef.current);
    mainTimerRef.current = null;
    if (recenterTimeoutRef.current) clearTimeout(recenterTimeoutRef.current);
    recenterTimeoutRef.current = null;
    
    if (mapRef.current) {
        pathPolylineRef.current?.setLatLngs([]);
        startMarkerRef.current?.remove();
        startMarkerRef.current = null;
        currentPositionMarkerRef.current?.setLatLng(DEFAULT_MAP_CENTER as L.LatLngTuple); 
        accuracyCircleRef.current?.setRadius(0);
        
        trailMarkersRef.current.forEach(marker => marker.remove());
        trailMarkersRef.current = [];
    }
  }, []);


  useEffect(() => {
    setCalories(Math.round(distance * 60)); 

    if (distance > 0 && elapsedTime > 0) {
      const durationInSecondsTotal = Math.floor(elapsedTime / 1000);
      const paceInSecondsPerKm = durationInSecondsTotal / distance;
      if (isFinite(paceInSecondsPerKm) && paceInSecondsPerKm > 0) {
        const paceMinutes = Math.floor(paceInSecondsPerKm / 60);
        const paceSeconds = Math.floor(paceInSecondsPerKm % 60);
        setAvgPaceDisplay(`${paceMinutes.toString().padStart(1, '0')}'${paceSeconds.toString().padStart(2, '0')}"`);
      } else {
        setAvgPaceDisplay("--:--");
      }
    } else {
      setAvgPaceDisplay("--:--");
    }
  }, [distance, elapsedTime]);

  useEffect(() => {
    if (triggerLockShakeAnimation) {
      const timer = setTimeout(() => {
        setTriggerLockShakeAnimation(false);
      }, 400); // Duration of the shake animation
      return () => clearTimeout(timer);
    }
  }, [triggerLockShakeAnimation]);

  const handleInitialLocationSuccess = useCallback((position: GeolocationPosition) => {
    const { latitude, longitude, accuracy, speed: speedMPS } = position.coords;
    
    if (accuracy <= MIN_ACCURACY_METERS_FOR_DISPLAY_WARNING) {
        setGpsInitialStatus('success');
        setGpsInitialErrorMsg(null);
    } else {
        setGpsInitialStatus('success'); 
        setGpsInitialErrorMsg(`${UZBEK_STRINGS.gpsAccuracyLow} ${accuracy.toFixed(0)}m`);
    }
    const speedKmh = speedMPS !== null ? speedMPS * 3.6 : 0;
    lastGoodPositionRef.current = { lat: latitude, lng: longitude, speed: speedKmh };

    if (mapRef.current && mapInitializedRef.current) {
        const latLng = L.latLng(latitude, longitude);
        if(autoCenterMap.current) mapRef.current.setView(latLng, 16);
        currentPositionMarkerRef.current?.setLatLng(latLng);
        accuracyCircleRef.current?.setLatLng(latLng).setRadius(accuracy);
    }
  }, []);

  const handleInitialLocationError = useCallback((error: GeolocationPositionError) => {
    console.error(`Initial GPS Error (Code: ${error.code}): ${error.message}`, error);
    let displayMessage: string;
    if (error.code === error.PERMISSION_DENIED) {
        displayMessage = error.message.toLowerCase().includes('permissions policy') ? 
                         (UZBEK_STRINGS.errorPermissionPolicy || `${UZBEK_STRINGS.errorPermissionDenied}: ${error.message}`) : 
                         `${UZBEK_STRINGS.errorPermissionDenied}: ${error.message}`;
    } else if (error.code === error.POSITION_UNAVAILABLE) {
        displayMessage = `${UZBEK_STRINGS.errorPositionUnavailable}: ${error.message}`;
    } else if (error.code === error.TIMEOUT) {
        displayMessage = `${UZBEK_STRINGS.errorTimeout}: ${error.message}`;
    } else {
        displayMessage = `${UZBEK_STRINGS.gpsError} (Kod ${error.code}): ${error.message}`;
    }
    setGpsInitialErrorMsg(displayMessage);
    setGpsInitialStatus('error');
  }, []);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true)); 

    if (!lastGoodPositionRef.current && navigator.geolocation) {
        setGpsInitialStatus('pending'); 
        navigator.geolocation.getCurrentPosition(
            handleInitialLocationSuccess,
            handleInitialLocationError,
            { enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 }
        );
    }

    const mapDiv = document.getElementById('running-map-container');
    if (mapDiv && !mapRef.current && !mapInitializedRef.current) {
        if (mapDiv.clientHeight === 0 || mapDiv.clientWidth === 0) {
            const rAfId = requestAnimationFrame(() => {
                if (document.getElementById('running-map-container') && !mapRef.current && !mapInitializedRef.current) {
                    const currentCenter = lastGoodPositionRef.current 
                        ? [lastGoodPositionRef.current.lat, lastGoodPositionRef.current.lng] as L.LatLngTuple
                        : DEFAULT_MAP_CENTER;
                    const currentZoom = lastGoodPositionRef.current ? 16 : DEFAULT_MAP_ZOOM;
                    
                    mapRef.current = L.map(mapDiv, { center: currentCenter, zoom: currentZoom, zoomControl: true });
                    tileLayerRef.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    }).addTo(mapRef.current);
                    pathPolylineRef.current = L.polyline([], { color: '#3B82F6', weight: 4, opacity: 0.8 }).addTo(mapRef.current);
                    currentPositionMarkerRef.current = L.marker(currentCenter, { icon: blueDotIcon, pane: 'markerPane', zIndexOffset: 1000 }).addTo(mapRef.current);
                    accuracyCircleRef.current = L.circle(currentCenter, { radius: 0, color: 'rgba(0,123,255,0.4)', fillColor: 'rgba(0,123,255,0.15)', fillOpacity: 0.15, stroke: false, pane: 'overlayPane' }).addTo(mapRef.current);
                    mapRef.current.on('dragstart zoomstart mousedown', () => { 
                        if (recenterTimeoutRef.current) clearTimeout(recenterTimeoutRef.current);
                        autoCenterMap.current = false;
                    });
                    mapInitializedRef.current = true;
                    setTimeout(() => mapRef.current?.invalidateSize(), 150);
                }
            });
            return () => cancelAnimationFrame(rAfId);
        } else {
             const initialCenter = lastGoodPositionRef.current 
                ? [lastGoodPositionRef.current.lat, lastGoodPositionRef.current.lng] as L.LatLngTuple
                : DEFAULT_MAP_CENTER;
            const initialZoom = lastGoodPositionRef.current ? 16 : DEFAULT_MAP_ZOOM;

            mapRef.current = L.map(mapDiv, { center: initialCenter, zoom: initialZoom, zoomControl: true });
            tileLayerRef.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(mapRef.current);
            pathPolylineRef.current = L.polyline([], { color: '#3B82F6', weight: 4, opacity: 0.8 }).addTo(mapRef.current);
            currentPositionMarkerRef.current = L.marker(initialCenter, { icon: blueDotIcon, pane: 'markerPane', zIndexOffset: 1000 }).addTo(mapRef.current);
            accuracyCircleRef.current = L.circle(initialCenter, { radius: 0, color: 'rgba(0,123,255,0.4)', fillColor: 'rgba(0,123,255,0.15)', fillOpacity: 0.15, stroke: false, pane: 'overlayPane' }).addTo(mapRef.current);
            mapRef.current.on('dragstart zoomstart mousedown', () => { 
                if (recenterTimeoutRef.current) clearTimeout(recenterTimeoutRef.current);
                autoCenterMap.current = false;
            });
            mapInitializedRef.current = true;
            setTimeout(() => mapRef.current?.invalidateSize(), 100);
        }
    }
    
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      mapInitializedRef.current = false;
      tileLayerRef.current = null; 
      pathPolylineRef.current = null;
      currentPositionMarkerRef.current = null;
      accuracyCircleRef.current = null;
      startMarkerRef.current = null;
      trailMarkersRef.current.forEach(marker => marker.remove()); 
      trailMarkersRef.current = [];

      if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
      }
      if (mainTimerRef.current) clearInterval(mainTimerRef.current);
      mainTimerRef.current = null;
      if (recenterTimeoutRef.current) clearTimeout(recenterTimeoutRef.current);
      recenterTimeoutRef.current = null;
    };
  }, [handleInitialLocationSuccess, handleInitialLocationError]); 

  useEffect(() => {
    if (mapRef.current && mapInitializedRef.current && lastGoodPositionRef.current && autoCenterMap.current && gpsInitialStatus === 'success') {
        const latLng = L.latLng(lastGoodPositionRef.current.lat, lastGoodPositionRef.current.lng);
        mapRef.current.setView(latLng, 16); 
        if (currentPositionMarkerRef.current) {
            currentPositionMarkerRef.current.setLatLng(latLng);
        }
    }
  }, [gpsInitialStatus]);

  const actualCloseSequence = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
        resetState();
        onClose();
    }, 300);
  }, [onClose, resetState]);

  const requestClose = useCallback(() => {
    if ((status === 'running' || status === 'paused') && distance > 0) {
      setShowExitConfirmation(true);
    } else {
      actualCloseSequence();
    }
  }, [status, distance, actualCloseSequence, setShowExitConfirmation]);


  useEffect(() => {
      if (mapRef.current && mapInitializedRef.current) {
          const map = mapRef.current;
          
          requestAnimationFrame(() => { 
              if(!mapRef.current || !pathPolylineRef.current) return; 

              if (tileLayerRef.current && !map.hasLayer(tileLayerRef.current)) {
                  tileLayerRef.current.addTo(map);
              }

              const latLngs = pathPoints.map(p => L.latLng(p.lat, p.lng));
              pathPolylineRef.current.setLatLngs(latLngs);
              
              if (!autoCenterMap.current && pathPoints && pathPoints.length > 1) { 
                  try {
                      map.fitBounds(L.polyline(latLngs).getBounds(), { padding: [30, 30], maxZoom: 17, animate: true });
                  } catch (e) {
                      if (lastGoodPositionRef.current) { 
                         map.setView([lastGoodPositionRef.current.lat, lastGoodPositionRef.current.lng], map.getZoom() || 16, { animate: true });
                      }
                  }
              }
          });
      }
  }, [pathPoints]); 


  const handleRuntimeLocationSuccessInternal = useCallback((position: GeolocationPosition) => {
    const { latitude, longitude, speed: speedMPS, accuracy } = position.coords;
    const currentSpeedKmh = speedMPS !== null ? speedMPS * 3.6 : 0;
    setCurrentSpeed(currentSpeedKmh);
    
    if (accuracy > MIN_ACCURACY_METERS_FOR_DISPLAY_WARNING) {
        setGpsRuntimeError(`${UZBEK_STRINGS.gpsAccuracyLow} ${accuracy.toFixed(0)}m`);
    } else {
        setGpsRuntimeError(null);
    }
        
    const newPoint: AppPoint = { lat: latitude, lng: longitude, speed: currentSpeedKmh };
    lastGoodPositionRef.current = newPoint;

    if (mapRef.current && mapInitializedRef.current) {
        const latLng = L.latLng(latitude, longitude);
        currentPositionMarkerRef.current?.setLatLng(latLng);
        accuracyCircleRef.current?.setLatLng(latLng).setRadius(accuracy);

        if (autoCenterMap.current) {
            const currentMapView = mapRef.current.getBounds();
            const mapCenter = mapRef.current.getCenter();
            const distanceToCenter = mapCenter.distanceTo(latLng);

            if (currentMapView.contains(latLng) && distanceToCenter < RECENTER_DISTANCE_THRESHOLD_METERS) {
                mapRef.current.panTo(latLng, { animate: true, duration: 0.5 });
            } else {
                mapRef.current.flyTo(latLng, mapRef.current.getZoom() || 16, { animate: true, duration: 0.5 });
            }
        }
    }

    if (status === 'running') {
        setPathPoints(prevPathPoints => {
            const latestPointInCurrentPath = prevPathPoints.length > 0 ? prevPathPoints[prevPathPoints.length - 1] : null;
            
            if (!latestPointInCurrentPath || (newPoint.lat !== latestPointInCurrentPath.lat || newPoint.lng !== latestPointInCurrentPath.lng)) {
                const distanceIncrementKm = latestPointInCurrentPath ? haversineDistance(latestPointInCurrentPath, newPoint) : 0;
                
                if (!latestPointInCurrentPath || distanceIncrementKm * 1000 >= PATH_POINT_MIN_DISTANCE_METERS) {
                    setDistance(prevDist => prevDist + distanceIncrementKm);
                    
                    if (mapRef.current && mapInitializedRef.current) {
                        const trailMarker = L.marker([newPoint.lat, newPoint.lng], { icon: trailDotIcon, pane: 'shadowPane' }).addTo(mapRef.current);
                        trailMarkersRef.current.push(trailMarker);
                    }
                    return [...prevPathPoints, newPoint];
                }
            }
            return prevPathPoints;
        });
    }
  }, [status]); 

  const handleRuntimeLocationErrorInternal = useCallback((error: GeolocationPositionError) => {
    console.error(`Runtime GPS Error (Code: ${error.code}): ${error.message}`, error);
    let displayMessage: string;
    if (error.code === error.PERMISSION_DENIED) {
        displayMessage = error.message.toLowerCase().includes('permissions policy') ? 
                         (UZBEK_STRINGS.errorPermissionPolicy || `${UZBEK_STRINGS.errorPermissionDenied}: ${error.message}`) : 
                         `${UZBEK_STRINGS.errorPermissionDenied}: ${error.message}`;
    } else if (error.code === error.POSITION_UNAVAILABLE) {
        displayMessage = `${UZBEK_STRINGS.errorPositionUnavailable}: ${error.message}`;
    } else if (error.code === error.TIMEOUT) {
        displayMessage = `${UZBEK_STRINGS.errorTimeout}: ${error.message}`;
    } else {
        displayMessage = `${UZBEK_STRINGS.gpsError} (Kod ${error.code}): ${error.message}`;
    }
    setGpsRuntimeError(displayMessage);
  }, []);

  const startTracking = () => {
    setElapsedTime(0);
    setDistance(0);
    setCurrentSpeed(0);
    setRunStartTime(new Date());
    setGpsRuntimeError(null);
    setCalories(0);
    setAvgPaceDisplay("--:--");
    autoCenterMap.current = true;
    
    trailMarkersRef.current.forEach(marker => marker.remove());
    trailMarkersRef.current = [];
    
    const initialRunPoints: AppPoint[] = [];
    if (lastGoodPositionRef.current) {
        initialRunPoints.push(lastGoodPositionRef.current);
        if (mapRef.current && mapInitializedRef.current) {
            const firstTrailMarker = L.marker(
                [lastGoodPositionRef.current.lat, lastGoodPositionRef.current.lng], 
                { icon: trailDotIcon, pane: 'shadowPane' }
            ).addTo(mapRef.current);
            trailMarkersRef.current.push(firstTrailMarker);
        }
    }
    setPathPoints(initialRunPoints); 

    if (mapRef.current && mapInitializedRef.current) {
        pathPolylineRef.current?.setLatLngs([]); 
        if (lastGoodPositionRef.current) {
            const startLatLng = L.latLng(lastGoodPositionRef.current.lat, lastGoodPositionRef.current.lng);
            startMarkerRef.current?.remove(); 
            startMarkerRef.current = L.marker(startLatLng, { icon: startFlagIcon }).addTo(mapRef.current);
            mapRef.current.setView(startLatLng, 17); 
        }
    }
    
    setStatus('running'); 
    setIsScreenLocked(true); 

    if (!navigator.geolocation) {
      setGpsRuntimeError(UZBEK_STRINGS.errorBrowserNoGeo);
      setStatus('idle'); 
      return;
    }

    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleRuntimeLocationSuccessInternal,
      handleRuntimeLocationErrorInternal,
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 } 
    );

    if (mainTimerRef.current) clearInterval(mainTimerRef.current);
    mainTimerRef.current = window.setInterval(() => {
      setElapsedTime(prev => prev + 1000);
    }, 1000);
  };

  const pauseTracking = () => {
    setStatus('paused'); 
    if (mainTimerRef.current) clearInterval(mainTimerRef.current);
    mainTimerRef.current = null;
  };

  const resumeTracking = () => {
    setStatus('running'); 
    autoCenterMap.current = true; 
    if (mapRef.current && mapInitializedRef.current && lastGoodPositionRef.current) {
        mapRef.current.setView(L.latLng(lastGoodPositionRef.current.lat, lastGoodPositionRef.current.lng), mapRef.current.getZoom() || 16, { animate: true });
    }
    if (mainTimerRef.current) clearInterval(mainTimerRef.current); 
    mainTimerRef.current = window.setInterval(() => {
      setElapsedTime(prev => prev + 1000);
    }, 1000);
  };

  const finishTrackingAndPrepareSummary = useCallback(async () => {
    if (mainTimerRef.current) clearInterval(mainTimerRef.current);
    mainTimerRef.current = null;
    if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
    }
    
    const currentStatus = status; 
    setStatus('idle'); 

    if (currentStatus !== 'running' && currentStatus !== 'paused') {
        actualCloseSequence(); 
        return;
    }

    if (runStartTime && distance > 0) { 
      const durationInSeconds = Math.floor(elapsedTime / 1000);

      let title = "";
      const hour = runStartTime.getHours();
      if (hour < 12) title = "Tonggi Yugurish";
      else if (hour < 17) title = "Kunduzgi Yugurish";
      else title = "Kechki Yugurish";
      const dayOfWeek = runStartTime.toLocaleDateString('uz-UZ', { weekday: 'long' });
      title = `${dayOfWeek} ${title}`;

      const points = TASK_POINTS[TaskType.RUNNING] + Math.round(distance);

      let calculatedPaceString: string | undefined = undefined;
      if (distance > 0 && durationInSeconds > 0) {
        const paceInSecondsPerKm = durationInSeconds / distance;
        const paceMinutes = Math.floor(paceInSecondsPerKm / 60);
        const paceSeconds = Math.floor(paceInSecondsPerKm % 60);
        calculatedPaceString = `${paceMinutes.toString()}'${paceSeconds.toString().padStart(2, '0')}''`;
      } else if (durationInSeconds > 0 && distance <=0){ 
        calculatedPaceString = "0'00''";
      }

      const runDataToSummarize: CreatableRunningFeedItem = {
        type: TaskType.RUNNING,
        title: title,
        eventTimestamp: runStartTime,
        distance: parseFloat(distance.toFixed(2)), 
        duration: durationInSeconds,
        pace: calculatedPaceString, 
        calories: calories > 0 ? calories : undefined, 
        pathPoints: pathPoints.length > 1 ? pathPoints : undefined, 
        pointsAwarded: points,
      };
      
      if (addFeedItem) {
          addFeedItem(runDataToSummarize);
      }
    }
    actualCloseSequence();
  }, [status, distance, elapsedTime, pathPoints, runStartTime, calories, addFeedItem, actualCloseSequence]);

  const handleConfirmSaveAndExit = useCallback(async () => {
    setShowExitConfirmation(false);
    await finishTrackingAndPrepareSummary();
  }, [setShowExitConfirmation, finishTrackingAndPrepareSummary]);

  const handleConfirmDiscardAndExit = useCallback(() => {
    setShowExitConfirmation(false);
    resetState();
    actualCloseSequence();
  }, [setShowExitConfirmation, resetState, actualCloseSequence]);

  const handleCancelExitConfirmation = useCallback(() => {
    setShowExitConfirmation(false);
  }, [setShowExitConfirmation]);


  const currentPaceForDisplay = avgPaceDisplay === "--:--" || avgPaceDisplay === "NaN'NaN\"" || avgPaceDisplay === "Infinity'NaN\"" ? "0'00\"" : avgPaceDisplay.replace("''",'"');

  const gpsDisplay = (() => {
    if (status === 'running' || status === 'paused') { 
        const accuracyWarning = (gpsRuntimeError && gpsRuntimeError.includes(UZBEK_STRINGS.gpsAccuracyLow.slice(0,-1))) ? gpsRuntimeError.substring(0,25) : null;
        if (accuracyWarning) return { text: accuracyWarning, color: "text-amber-500", signalColor: "text-amber-500" };
        if (gpsRuntimeError) return { text: gpsRuntimeError.substring(0,20), color: "text-red-500", signalColor: "text-red-500" };
        return { text: UZBEK_STRINGS.gpsActive, color: "text-green-500", signalColor: "text-green-500" };
    }
    if (gpsInitialStatus === 'pending') return { text: UZBEK_STRINGS.gpsSearching, color: "text-yellow-500", signalColor: "text-yellow-500" };
    if (gpsInitialStatus === 'error') return { text: gpsInitialErrorMsg || UZBEK_STRINGS.gpsError, color: "text-red-500", signalColor: "text-red-500" };
    if (gpsInitialStatus === 'success') {
        const accuracyWarning = (gpsInitialErrorMsg && gpsInitialErrorMsg.includes(UZBEK_STRINGS.gpsAccuracyLow.slice(0,-1))) ? gpsInitialErrorMsg.substring(0,25) : null;
        if(accuracyWarning) return { text: accuracyWarning, color: "text-amber-500", signalColor: "text-amber-500" };
        return { text: UZBEK_STRINGS.gpsReady, color: "text-green-500", signalColor: "text-green-500" };
    }
    return { text: UZBEK_STRINGS.gpsLabel, color: "text-gray-400", signalColor: "text-gray-400" };
  })();

  const canStartRun = gpsInitialStatus === 'success' && !!lastGoodPositionRef.current;

  const getStartPauseResumeButtonClass = () => {
    const baseClass = "text-sm font-semibold py-3 min-w-[100px] text-center rounded-full transition-colors active:scale-95";
    if (isScreenLocked && (status === 'running' || status === 'paused')) {
      return `${baseClass} bg-gray-300 text-gray-500 cursor-not-allowed`;
    }
    if (status === 'idle') { 
      return `${baseClass} ${canStartRun ? 'bg-black text-white hover:bg-gray-800' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`;
    }
    if (status === 'running') {
      return `${baseClass} bg-amber-500 text-black hover:bg-amber-600`;
    }
    if (status === 'paused') {
      return `${baseClass} bg-emerald-500 text-white hover:bg-emerald-600`;
    }
    return `${baseClass} bg-gray-200 text-gray-400 cursor-not-allowed`;
  };

  const getFinishButtonClass = () => {
    const baseClass = "text-sm font-semibold py-3 min-w-[100px] text-center rounded-full transition-colors active:scale-95";
    const isEffectivelyEnabled = (status === 'running' || status === 'paused') && distance > 0;

    if (isScreenLocked && isEffectivelyEnabled) {
      return `${baseClass} bg-gray-300 text-gray-500 cursor-not-allowed`;
    }

    if (isEffectivelyEnabled) {
      return `${baseClass} bg-rose-500 text-white hover:bg-rose-600`;
    }
    return `${baseClass} bg-gray-200 text-gray-400 cursor-not-allowed`;
  };
  
  const handleMainActionButtonClick = () => {
    if (isScreenLocked && (status === 'running' || status === 'paused')) {
      setTriggerLockShakeAnimation(true);
      return;
    }
    if (status === 'idle' && canStartRun) startTracking();
    else if (status === 'running') pauseTracking();
    else if (status === 'paused') resumeTracking();
  };

  const handleFinishButtonClick = () => {
    if (isScreenLocked && (status === 'running' || status === 'paused') && distance > 0) {
      setTriggerLockShakeAnimation(true);
      return;
    }
    finishTrackingAndPrepareSummary();
  };


  return (
    <div className={`fixed inset-0 bg-white text-black flex flex-col z-50 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'} rounded-none`}>
      <header className="w-full flex justify-between items-center px-4 pt-5 pb-3 shrink-0">
        <span className="text-xl font-semibold text-black uppercase flex-1 text-center">{TaskType.RUNNING}</span>
        <button 
            onClick={requestClose} 
            className="p-2 text-gray-500 hover:text-black rounded-full hover:bg-gray-100 transition-colors absolute right-3 top-4" // Positioned for clarity
            aria-label="Yopish"
        >
            <XIcon className="w-6 h-6" />
        </button>
      </header>

      <div className="w-full flex flex-col items-center px-4 py-1 shrink-0">
        <p className="text-6xl font-bold tracking-tight text-black">{distance.toFixed(2)}</p>
        <p className="text-xs text-gray-500 -mt-1">{`${UZBEK_STRINGS.distance} (${UZBEK_STRINGS.km.toLowerCase()})`}</p>

        <div className="grid grid-cols-2 gap-4 w-full text-center mt-4">
          <div>
            <p className="text-3xl font-bold text-black">{formatTimerMMSS(elapsedTime)}</p>
            <p className="text-xs text-gray-500">{UZBEK_STRINGS.duration}</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-black">{currentPaceForDisplay}</p>
            <p className="text-xs text-gray-500">{UZBEK_STRINGS.avgPaceMinKm}</p>
          </div>
        </div>
      </div>
      
      <div className="flex-grow w-full relative rounded-none bg-gray-100 overflow-hidden min-h-[200px] mt-3 border-t border-b border-gray-200">
        <div id="running-map-container" className="w-full h-full bg-gray-200 map-container"></div>
        
        {!autoCenterMap.current && mapRef.current && mapInitializedRef.current && (
          <button
            onClick={() => {
              autoCenterMap.current = true;
              if (lastGoodPositionRef.current && mapRef.current) {
                mapRef.current.setView(L.latLng(lastGoodPositionRef.current.lat, lastGoodPositionRef.current.lng), mapRef.current.getZoom() || 16, { animate: true });
              }
            }}
            className="absolute bottom-4 right-4 z-[1000] bg-white p-2 rounded-full shadow-md text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
            aria-label={UZBEK_STRINGS.recenterMap}
          >
            <TargetIcon className="w-6 h-6" />
          </button>
        )}
      </div>

      <footer className="w-full flex items-center justify-around p-3 bg-white shrink-0 rounded-none">
        <button
          onClick={handleMainActionButtonClick}
          disabled={ (status === 'idle' && !canStartRun) }
          className={getStartPauseResumeButtonClass()}
          aria-live="polite"
        >
          {status === 'running' ? UZBEK_STRINGS.pause.toUpperCase() : status === 'paused' ? UZBEK_STRINGS.resume.toUpperCase() : UZBEK_STRINGS.start.toUpperCase()}
        </button>

        <button
          onClick={() => setIsScreenLocked(!isScreenLocked)}
          className={`p-3.5 rounded-full transition-colors border
            ${isScreenLocked
              ? 'bg-black text-white border-black hover:bg-gray-800 active:bg-gray-700'
              : 'bg-white text-black border-gray-300 hover:bg-gray-100 active:bg-gray-200'}
            ${triggerLockShakeAnimation ? 'animate-shake' : ''}`
          }
          aria-label={isScreenLocked ? UZBEK_STRINGS.unlockScreen : UZBEK_STRINGS.lockScreenControls}
          aria-pressed={isScreenLocked}
        >
          {isScreenLocked ? <LockClosedIcon className="w-5 h-5" /> : <LockOpenIcon className="w-5 h-5" />}
        </button>

        <button
          onClick={handleFinishButtonClick}
          disabled={ (status !== 'running' && status !== 'paused') || distance === 0 }
          className={getFinishButtonClass()}
        >
          {UZBEK_STRINGS.finish.toUpperCase()}
        </button>
      </footer>
      
      {( (status === 'running' || status === 'paused') && gpsRuntimeError && !isScreenLocked ) && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-amber-600 text-white text-xs px-3 py-1 rounded-full shadow-lg z-20 pointer-events-none text-center max-w-[90%]">
            {gpsRuntimeError}
        </div>
      )}
      {(status === 'idle' && !isScreenLocked && (gpsDisplay.text !== UZBEK_STRINGS.gpsActive && gpsDisplay.text !== UZBEK_STRINGS.gpsReady && gpsDisplay.text !== UZBEK_STRINGS.gpsLabel ) ) && (
         <div className={`absolute bottom-20 left-1/2 transform -translate-x-1/2 text-white text-xs px-3 py-1 rounded-full shadow-lg z-20 pointer-events-none text-center max-w-[90%]
                        ${gpsDisplay.signalColor === 'text-red-500' ? 'bg-red-600' :
                          gpsDisplay.signalColor === 'text-amber-500' ? 'bg-amber-600' : 
                          gpsDisplay.signalColor === 'text-yellow-500' ? 'bg-yellow-600' : 'bg-gray-700' }`}>
            {gpsDisplay.text}
        </div>
      )}

      {showExitConfirmation && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="exitConfirmDialogTitle"
          onClick={handleCancelExitConfirmation} // Allow closing by clicking backdrop
        >
          <div className="bg-white p-5 md:p-6 rounded-none shadow-xl max-w-sm w-full border border-gray-300" onClick={(e) => e.stopPropagation()}>
            <h4 id="exitConfirmDialogTitle" className="text-lg font-semibold text-gray-900 mb-2">
              {UZBEK_STRINGS.confirmExitRunningTitle}
            </h4>
            <p className="text-sm text-gray-600 mb-5">
              {UZBEK_STRINGS.confirmExitRunningMessage}
            </p>
            <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 sm:justify-end">
              <button
                onClick={handleConfirmSaveAndExit}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-sm transition-colors w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1"
              >
                {UZBEK_STRINGS.saveRunAndExit}
              </button>
              <button
                onClick={handleConfirmDiscardAndExit}
                className="px-4 py-2 text-sm font-medium text-white bg-rose-500 hover:bg-rose-600 rounded-sm transition-colors w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-1"
              >
                {UZBEK_STRINGS.discardRunAndExit}
              </button>
              <button
                onClick={handleCancelExitConfirmation}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-sm transition-colors w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1"
              >
                {UZBEK_STRINGS.dialogCancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RunningTracker;