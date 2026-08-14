/**
 * ItineraryMap Component
 * Interactive Leaflet map displaying sequential itinerary stops (A, B, C...)
 * with custom pins, route lines, stop selector pills, and detailed popups.
 */

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, Navigation, Train, ExternalLink, Maximize2, LocateFixed } from 'lucide-react';
import { RecommendedPlan, ItineraryItem } from '../types';
import { MRT_LINES_MAP } from '../utils/singaporeData';

interface ItineraryMapProps {
  plan: RecommendedPlan;
}

// Sequence letters for stops (A, B, C, D, E...)
const STOP_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export const ItineraryMap: React.FC<ItineraryMapProps> = ({ plan }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const polylineRef = useRef<L.Polyline | null>(null);
  const [selectedStopIndex, setSelectedStopIndex] = useState<number | null>(null);

  // Initialize and update the Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // If map doesn't exist yet, create it
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [1.3521, 103.8198], // Singapore center
        zoom: 12,
        zoomControl: false,
      });

      // Add high quality OpenStreetMap tiles (CartoDB Positron for clean visual clarity)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      // Add custom positioned zoom controls
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear existing markers and polylines
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    const validStops = plan.items.filter(
      (item) =>
        item.activity.coordinates &&
        typeof item.activity.coordinates.lat === 'number' &&
        typeof item.activity.coordinates.lng === 'number'
    );

    if (validStops.length === 0) return;

    const latLngs: L.LatLngTuple[] = [];

    // Create markers for each stop with letters A, B, C...
    validStops.forEach((item: ItineraryItem, idx: number) => {
      const { lat, lng } = item.activity.coordinates;
      const letter = STOP_LETTERS[idx] || `${idx + 1}`;
      latLngs.push([lat, lng]);

      // Custom HTML Pin with vibrant gradient and Stop Letter
      const isSelected = selectedStopIndex === idx;
      const markerHtml = `
        <div id="map-marker-pin-${idx}" class="relative cursor-pointer transition-transform duration-200 ${
          isSelected ? 'scale-125 z-50' : 'hover:scale-110'
        }">
          <div class="w-9 h-9 rounded-full bg-gradient-to-br from-rose-500 to-red-600 text-white font-black text-sm flex items-center justify-center shadow-lg border-2 border-white">
            ${letter}
          </div>
          <div class="w-2.5 h-2.5 bg-red-600 rotate-45 mx-auto -mt-1 shadow-xs"></div>
          <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1.5 bg-black/20 rounded-full blur-[1px]"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-itinerary-pin',
        iconSize: [36, 42],
        iconAnchor: [18, 42],
        popupAnchor: [0, -42],
      });

      // Build popup content
      const mrtLines = item.activity.nearestMrt.line
        .map((lineCode) => {
          const meta = MRT_LINES_MAP[lineCode] || { color: '#64748b', textColor: '#fff' };
          return `<span style="background-color: ${meta.color}; color: ${meta.textColor};" class="text-[9px] font-bold px-1.5 py-0.5 rounded mr-1">${lineCode}</span>`;
        })
        .join('');

      const gMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${item.activity.name} Singapore`
      )}`;

      const popupHtml = `
        <div class="p-1 min-w-[210px] max-w-[260px] font-sans text-slate-900">
          <div class="flex items-center gap-1.5 mb-1.5">
            <span class="w-5 h-5 rounded-full bg-rose-600 text-white font-bold text-xs flex items-center justify-center">
              ${letter}
            </span>
            <span class="text-[11px] font-extrabold uppercase tracking-wide text-rose-600">
              Stop ${idx + 1} of ${validStops.length}
            </span>
            <span class="text-[10px] text-slate-400 ml-auto font-mono">${item.timeSlot}</span>
          </div>

          <h4 class="font-bold text-sm text-slate-900 leading-snug mb-1">${item.activity.name}</h4>
          
          <div class="flex items-center gap-1.5 text-xs text-slate-600 mb-2">
            <span class="bg-slate-100 text-slate-700 text-[10px] font-semibold px-1.5 py-0.5 rounded">
              ${item.activity.category}
            </span>
            <span class="text-emerald-700 font-bold text-[11px]">
              ${item.activity.pricePerPerson === 0 ? 'Free' : `$${item.activity.pricePerPerson}/pax`}
            </span>
          </div>

          <div class="text-[11px] text-slate-600 pt-1.5 border-t border-slate-100 space-y-1 mb-2">
            <div class="flex items-center gap-1">
              <span>MRT: <strong>${item.activity.nearestMrt.station}</strong></span>
              <div class="inline-flex">${mrtLines}</div>
            </div>
            <div class="text-slate-500">
              ${item.activity.nearestMrt.exit ? `Exit ${item.activity.nearestMrt.exit} · ` : ''}${item.activity.nearestMrt.walkMinutes} min walk
            </div>
          </div>

          <a href="${gMapsUrl}" target="_blank" rel="noopener noreferrer" 
             class="flex items-center justify-center gap-1.5 w-full py-1.5 px-2.5 rounded-lg bg-slate-900 text-white text-[11px] font-semibold hover:bg-rose-600 transition-colors">
            <span>Open in Google Maps</span>
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
          </a>
        </div>
      `;

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
      marker.bindPopup(popupHtml, { closeButton: true, className: 'itinerary-popup' });

      marker.on('click', () => {
        setSelectedStopIndex(idx);
      });

      markersRef.current.push(marker);
    });

    // Draw route connecting A -> B -> C...
    if (latLngs.length > 1) {
      polylineRef.current = L.polyline(latLngs, {
        color: '#e11d48',
        weight: 4,
        dashArray: '8, 8',
        opacity: 0.85,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);
    }

    // Auto-fit bounds so all stops are nicely centered
    if (latLngs.length > 0) {
      const bounds = L.latLngBounds(latLngs);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }

    // Handle container resize
    setTimeout(() => {
      map.invalidateSize();
    }, 150);
  }, [plan]);

  // Focus on a specific stop when clicking a pill
  const handleSelectStop = (index: number) => {
    setSelectedStopIndex(index);
    const marker = markersRef.current[index];
    const map = mapInstanceRef.current;
    if (marker && map) {
      const latLng = marker.getLatLng();
      map.setView(latLng, 15, { animate: true });
      marker.openPopup();
    }
  };

  // Reset to fit all stops
  const handleFitAll = () => {
    setSelectedStopIndex(null);
    const map = mapInstanceRef.current;
    const validStops = plan.items.filter(
      (item) => item.activity.coordinates && typeof item.activity.coordinates.lat === 'number'
    );
    if (map && validStops.length > 0) {
      const latLngs = validStops.map((s) => [s.activity.coordinates.lat, s.activity.coordinates.lng] as L.LatLngTuple);
      map.fitBounds(L.latLngBounds(latLngs), { padding: [40, 40], maxZoom: 15, animate: true });
    }
  };

  return (
    <div id="itinerary-map-card" className="bg-slate-900 rounded-3xl p-5 md:p-6 border border-slate-800 text-white shadow-lg space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Visual Singapore Itinerary Route Map
            </h4>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Sequential path from Stop A to Stop {STOP_LETTERS[plan.items.length - 1] || plan.items.length} across Singapore
          </p>
        </div>

        <button
          id="btn-map-fit-all"
          type="button"
          onClick={handleFitAll}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
          title="Reset map view to show all stops"
        >
          <LocateFixed className="w-3.5 h-3.5 text-rose-400" />
          <span>Fit All Stops</span>
        </button>
      </div>

      {/* Stop Sequence Selector Chips (A, B, C...) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {plan.items.map((item, idx) => {
          const letter = STOP_LETTERS[idx] || `${idx + 1}`;
          const isSelected = selectedStopIndex === idx;
          return (
            <button
              key={item.activity.id}
              id={`map-stop-chip-${idx}`}
              type="button"
              onClick={() => handleSelectStop(idx)}
              className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-900/40'
                  : 'bg-slate-800/90 text-slate-300 border-slate-700 hover:bg-slate-700/80 hover:text-white'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white/20 text-white font-bold text-[11px] flex items-center justify-center">
                {letter}
              </span>
              <span className="max-w-[120px] truncate">{item.activity.name}</span>
            </button>
          );
        })}
      </div>

      {/* Map Stage Container */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-700 shadow-inner bg-slate-950">
        <div
          id="leaflet-itinerary-map-canvas"
          ref={mapContainerRef}
          className="w-full h-[340px] md:h-[400px] z-10"
        />

        {/* Legend Overlay at top-left */}
        <div className="absolute top-3 left-3 z-20 bg-slate-900/90 backdrop-blur-sm px-3 py-2 rounded-xl border border-slate-700/80 text-[11px] text-slate-200 shadow-md pointer-events-none">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-4 h-4 rounded-full bg-rose-600 text-white font-bold text-[9px] flex items-center justify-center">
              A
            </span>
            <span className="font-semibold text-white">First Destination</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5 bg-rose-500 border-b border-dashed border-rose-300"></span>
            <span className="text-slate-400">Transit connection route</span>
          </div>
        </div>
      </div>
    </div>
  );
};
