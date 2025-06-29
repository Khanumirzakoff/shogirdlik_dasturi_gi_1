

import React, { useEffect, useRef, useId } from 'react';
import L from 'leaflet';
import { Point } from '../types';

interface RunPathMapProps {
  pathPoints: Point[];
}

const DEFAULT_MAP_CENTER_STATIC: L.LatLngTuple = [41.2995, 69.2401]; // Tashkent
const DEFAULT_MAP_ZOOM_STATIC = 13;

const RunPathMap: React.FC<RunPathMapProps> = ({ pathPoints }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const pathPolylineRef = useRef<L.Polyline | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const mapGeneratedId = useId(); 

  // Effect for map creation (runs once on mount)
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return; 

    const leafletMap = L.map(mapContainerRef.current, {
        center: DEFAULT_MAP_CENTER_STATIC, // Map is initialized with a center and zoom
        zoom: DEFAULT_MAP_ZOOM_STATIC,
        zoomControl: false, 
        dragging: false,    
        scrollWheelZoom: false, 
        doubleClickZoom: false, 
        boxZoom: false, 
        keyboard: false,
        // attributionControl: false, // Removed for compliance, Leaflet default is true
    });
    mapRef.current = leafletMap;

    tileLayerRef.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' // Explicitly ensure attribution string is standard
    }).addTo(leafletMap);
    pathPolylineRef.current = L.polyline([], { color: '#3B82F6', weight: 3 }).addTo(leafletMap);
    
    // The useEffect for pathPoints will handle drawing and fitting, including initial state.
    // No explicit setView here needed as L.map already sets the initial view.

    setTimeout(() => {
        if (mapRef.current) { 
            mapRef.current.invalidateSize();
            // console.log(`RunPathMap (${mapGeneratedId}): Map initialized and invalidated.`);
        }
    }, 100);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      tileLayerRef.current = null;
      pathPolylineRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapGeneratedId]); // mapGeneratedId is stable, so this runs once on mount.

  // Effect for updating path and fitting bounds when pathPoints prop changes
  useEffect(() => { 
    if (mapRef.current && pathPolylineRef.current && pathPoints) { 
      const latLngs = pathPoints.map(p => L.latLng(p.lat, p.lng));
      pathPolylineRef.current.setLatLngs(latLngs);
      
      requestAnimationFrame(() => { 
        if (mapRef.current) { 
            if (latLngs.length > 1) {
                try {
                    mapRef.current.fitBounds(L.polyline(latLngs).getBounds(), { padding: [15, 15], maxZoom: 16, animate: true });
                } catch (e) {
                    // console.warn("Could not fit bounds to polyline on update:", e);
                    if (latLngs.length > 0) mapRef.current.setView(latLngs[0], DEFAULT_MAP_ZOOM_STATIC, { animate: true });
                }
            } else if (latLngs.length === 1) {
                mapRef.current.setView(latLngs[0], 15, { animate: true }); 
            } else { 
                mapRef.current.setView(DEFAULT_MAP_CENTER_STATIC, DEFAULT_MAP_ZOOM_STATIC, {animate: true});
            }
        }
      });
    } else if (mapRef.current && pathPolylineRef.current && (!pathPoints || pathPoints.length === 0)) {
        pathPolylineRef.current.setLatLngs([]); 
        requestAnimationFrame(() => {
             if (mapRef.current) mapRef.current.setView(DEFAULT_MAP_CENTER_STATIC, DEFAULT_MAP_ZOOM_STATIC, {animate: true});
        });
    }
  }, [pathPoints]);


  return <div id={`feed-map-${mapGeneratedId}`} ref={mapContainerRef} className="w-full h-40 md:h-48 rounded-none border border-gray-200 bg-gray-100 relative z-0" />;
};

export default RunPathMap;
