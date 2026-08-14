/**
 * Header Component
 * Displays application identity, live Singapore time, weather status, and navigation tabs
 */

import React, { useEffect, useState } from 'react';
import { Compass, Sparkles, CloudRain, Sun, MapPin, RefreshCw } from 'lucide-react';
import { LiveSingaporeConditions } from '../types';

interface HeaderProps {
  activeTab: 'find' | 'inspire';
  onTabChange: (tab: 'find' | 'inspire') => void;
  conditions: LiveSingaporeConditions | null;
  currentLocationName: string;
  onRefreshLocation: () => void;
  isLocating: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  conditions,
  currentLocationName,
  onRefreshLocation,
  isLocating,
}) => {
  const [sgTime, setSgTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const timeStr = new Intl.DateTimeFormat('en-SG', {
        timeZone: 'Asia/Singapore',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }).format(new Date());
      setSgTime(timeStr);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header id="main-header" className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Info Strip */}
        <div className="py-2 border-b border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-300 gap-2">
          <div className="flex items-center space-x-3">
            <span className="flex items-center gap-1.5 font-medium text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Singapore Live
            </span>
            <span className="text-slate-400 hidden sm:inline">|</span>
            <span className="text-slate-300 font-mono">SGT {sgTime || 'Loading...'}</span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Live Weather Pill */}
            {conditions && (
              <div className="flex items-center gap-2 bg-slate-800/80 px-2.5 py-1 rounded-full text-slate-200 border border-slate-700">
                {conditions.weatherForecast.toLowerCase().includes('rain') || conditions.rainfallMm > 0 ? (
                  <CloudRain className="w-3.5 h-3.5 text-sky-400" />
                ) : (
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>{conditions.temperatureC}°C</span>
                <span className="text-slate-400 hidden md:inline">· {conditions.weatherForecast}</span>
                <span className="text-slate-400">· PSI {conditions.psiValue}</span>
                <span className="bg-emerald-950 text-emerald-300 text-[10px] px-1.5 py-0.5 rounded font-semibold">
                  {conditions.dataConfidence}
                </span>
              </div>
            )}

            {/* Location pill */}
            <button
              id="header-location-btn"
              onClick={onRefreshLocation}
              disabled={isLocating}
              className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Refresh your Singapore location"
            >
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              <span className="max-w-[140px] truncate">{currentLocationName || 'Singapore'}</span>
              <RefreshCw className={`w-3 h-3 ${isLocating ? 'animate-spin text-amber-400' : 'text-slate-400'}`} />
            </button>
          </div>
        </div>

        {/* Main Nav Header */}
        <div className="py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 w-full md:w-auto">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-md shadow-rose-900/30">
              <Compass className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">SG got what to do</h1>
                <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  OneMap · NEA · LTA
                </span>
              </div>
              <p className="text-xs text-slate-400">
                SG is not as boring as you think
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <nav aria-label="Main Navigation" className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700/80 w-full md:w-auto">
            <button
              id="tab-find-activities"
              onClick={() => onTabChange('find')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'find'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Find Activities</span>
            </button>
            <button
              id="tab-inspire-me"
              onClick={() => onTabChange('inspire')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'inspire'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Inspire Me</span>
              <span className="bg-rose-900/80 text-rose-200 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                Community
              </span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
