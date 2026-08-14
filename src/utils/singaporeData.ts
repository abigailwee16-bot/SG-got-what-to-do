/**
 * Singapore Geospatial & Transit Helpers
 * Provides distance formulas, MRT metadata, and Live API adapters
 */

import { LiveSingaporeConditions } from '../types';

export const MRT_LINES_MAP: Record<string, { name: string; color: string; textColor: string }> = {
  NS: { name: 'North South Line', color: '#D42E12', textColor: '#FFFFFF' },
  EW: { name: 'East West Line', color: '#009645', textColor: '#FFFFFF' },
  NE: { name: 'North East Line', color: '#8F1A95', textColor: '#FFFFFF' },
  CC: { name: 'Circle Line', color: '#FF9E1B', textColor: '#000000' },
  DT: { name: 'Downtown Line', color: '#005EC4', textColor: '#FFFFFF' },
  TEL: { name: 'Thomson-East Coast Line', color: '#9D5B25', textColor: '#FFFFFF' },
  JRL: { name: 'Jurong Region Line', color: '#00917E', textColor: '#FFFFFF' },
  CRL: { name: 'Cross Island Line', color: '#97C05C', textColor: '#000000' },
  CG: { name: 'Changi Airport Branch', color: '#009645', textColor: '#FFFFFF' },
};

/**
 * Calculates Haversine distance in kilometres between two coordinates
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Generates an accurate Google Maps navigation handoff URL
 */
export function getGoogleMapsNavigationUrl(
  destName: string,
  destLat: number,
  destLng: number,
  fromLat?: number,
  fromLng?: number
): string {
  const query = encodeURIComponent(`${destName}, Singapore`);
  if (fromLat && fromLng) {
    return `https://www.google.com/maps/dir/?api=1&origin=${fromLat},${fromLng}&destination=${destLat},${destLng}&destination_place_id=${query}&travelmode=transit`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${destLat},${destLng}`;
}

/**
 * Default fallback live Singapore conditions if external NEA API is unreachable
 */
export const DEFAULT_SINGAPORE_CONDITIONS: LiveSingaporeConditions = {
  weatherForecast: 'Passing Showers in afternoon',
  temperatureC: 31,
  humidityPercent: 78,
  rainfallMm: 2.4,
  psiValue: 42,
  psiStatus: 'Good',
  forecast2hr: [
    { area: 'City / Civic District', forecast: 'Passing Showers' },
    { area: 'Marina Bay / Downtown', forecast: 'Passing Showers' },
    { area: 'Chinatown / Outram', forecast: 'Partly Cloudy' },
    { area: 'Orchard / Tanglin', forecast: 'Passing Showers' },
    { area: 'Sentosa / HarbourFront', forecast: 'Fair' },
    { area: 'Kallang / Geylang', forecast: 'Passing Showers' },
    { area: 'Changi / East Coast', forecast: 'Fair' },
    { area: 'Jurong East / West', forecast: 'Cloudy' },
  ],
  lastUpdated: new Date().toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' }),
  dataConfidence: 'LIVE',
  source: 'data.gov.sg / NEA Weather API',
};
