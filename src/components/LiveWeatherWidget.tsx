/**
 * LiveWeatherWidget Component
 * Displays live weather conditions, 2-hr forecast, air temperature, and PSI for Singapore
 */

import React from 'react';
import { CloudRain, Sun, Wind, Droplets, Activity as ActivityIcon, ShieldCheck, MapPin } from 'lucide-react';
import { LiveSingaporeConditions } from '../types';

interface LiveWeatherWidgetProps {
  conditions: LiveSingaporeConditions | null;
  selectedArea?: string;
}

export const LiveWeatherWidget: React.FC<LiveWeatherWidgetProps> = ({ conditions, selectedArea }) => {
  if (!conditions) {
    return (
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm animate-pulse">
        <div className="h-4 bg-slate-100 rounded w-1/3 mb-2"></div>
        <div className="h-8 bg-slate-100 rounded w-2/3"></div>
      </div>
    );
  }

  const isRaining =
    conditions.weatherForecast.toLowerCase().includes('rain') ||
    conditions.weatherForecast.toLowerCase().includes('shower') ||
    conditions.rainfallMm > 0;

  return (
    <div id="live-weather-card" className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-5 border border-slate-700/80 shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-xl ${isRaining ? 'bg-sky-500/20 text-sky-400' : 'bg-amber-500/20 text-amber-400'}`}>
            {isRaining ? <CloudRain className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-slate-200">Live Singapore Environmental Data</h3>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                {conditions.dataConfidence}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Source: {conditions.source} · Updated {conditions.lastUpdated}
            </p>
          </div>
        </div>

        {selectedArea && (
          <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1 rounded-full border border-slate-700 text-xs text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-rose-400" />
            <span>Target Area: <strong className="text-white">{selectedArea}</strong></span>
          </div>
        )}
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60">
          <span className="text-xs text-slate-400 block mb-1">Temperature</span>
          <div className="text-xl font-bold text-white flex items-baseline gap-1">
            <span>{conditions.temperatureC}°C</span>
            <span className="text-xs font-normal text-slate-400">(Tropical)</span>
          </div>
        </div>

        <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60">
          <span className="text-xs text-slate-400 block mb-1">Forecast</span>
          <div className="text-sm font-semibold text-sky-300 truncate" title={conditions.weatherForecast}>
            {conditions.weatherForecast}
          </div>
        </div>

        <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60">
          <span className="text-xs text-slate-400 block mb-1 flex items-center gap-1">
            <Droplets className="w-3 h-3 text-sky-400" /> Humidity
          </span>
          <div className="text-xl font-bold text-white">
            {conditions.humidityPercent}%
          </div>
        </div>

        <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60">
          <span className="text-xs text-slate-400 block mb-1 flex items-center gap-1">
            <ActivityIcon className="w-3 h-3 text-emerald-400" /> 24-hr PSI
          </span>
          <div className="text-xl font-bold text-emerald-300 flex items-center gap-1.5">
            <span>{conditions.psiValue}</span>
            <span className="text-[11px] bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded font-normal">
              {conditions.psiStatus}
            </span>
          </div>
        </div>
      </div>

      {/* 2-Hour Sector Forecast Mini-Pills */}
      {conditions.forecast2hr && conditions.forecast2hr.length > 0 && (
        <div>
          <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold block mb-2">
            2-Hour Regional Forecasts
          </span>
          <div className="flex flex-wrap gap-1.5">
            {conditions.forecast2hr.map((f, i) => (
              <div
                key={i}
                className="bg-slate-800/60 text-slate-300 px-2.5 py-1 rounded-lg text-xs border border-slate-700/50 flex items-center gap-1.5"
              >
                <span className="text-slate-400">{f.area}:</span>
                <span className="font-medium text-white">{f.forecast}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
