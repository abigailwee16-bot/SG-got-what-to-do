/**
 * BusArrivalWidget Component
 * Real-time Singapore Bus Arrival timing tool connected to LTA DataMall v3 API.
 * Supports BusStopCode (e.g. 83139) & optional ServiceNo (e.g. 15) with 20s live refresh.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Bus, RefreshCw, Clock, Users, Accessibility, Search, AlertCircle } from 'lucide-react';
import { BusArrivalData, BusServiceArrival, NextBusInfo } from '../types';

interface BusArrivalWidgetProps {
  initialBusStopCode?: string;
  initialServiceNo?: string;
}

const COMMON_BUS_STOPS = [
  { code: '83139', name: 'Jalan Eunos / Opp Eunos Stn' },
  { code: '03223', name: 'Opp The Treasury (City Hall)' },
  { code: '08057', name: 'Dhoby Ghaut Stn Exit B' },
  { code: '01012', name: 'Bras Basah / Hotel Rendezvous' },
  { code: '03011', name: 'Marina Bay Sands / Bayfront' },
];

export const BusArrivalWidget: React.FC<BusArrivalWidgetProps> = ({
  initialBusStopCode = '83139',
  initialServiceNo = '',
}) => {
  const [busStopCode, setBusStopCode] = useState(initialBusStopCode);
  const [serviceNo, setServiceNo] = useState(initialServiceNo);
  const [data, setData] = useState<BusArrivalData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [countdown, setCountdown] = useState(20);

  const fetchArrivals = useCallback(async (stopCode: string, svcNo: string) => {
    if (!stopCode.trim()) return;
    setIsLoading(true);
    setError(null);

    try {
      let url = `/api/bus-arrival?BusStopCode=${encodeURIComponent(stopCode.trim())}`;
      if (svcNo.trim()) {
        url += `&ServiceNo=${encodeURIComponent(svcNo.trim())}`;
      }

      const res = await fetch(url);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned status ${res.status}`);
      }

      const result: BusArrivalData = await res.json();
      setData(result);
      setCountdown(20);
    } catch (err: any) {
      console.error('Bus arrival fetch error:', err);
      setError(err.message || 'Unable to retrieve live bus arrivals');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch initial on mount
  useEffect(() => {
    fetchArrivals(busStopCode, serviceNo);
  }, []);

  // 20-second live refresh interval matching LTA DataMall v3 specification
  useEffect(() => {
    if (!autoRefresh) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchArrivals(busStopCode, serviceNo);
          return 20;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRefresh, busStopCode, serviceNo, fetchArrivals]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchArrivals(busStopCode, serviceNo);
  };

  const getLoadBadge = (load?: string) => {
    switch (load) {
      case 'SEA':
        return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">Seats Avail</span>;
      case 'SDA':
        return <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">Standing</span>;
      case 'LSD':
        return <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">Crowded</span>;
      default:
        return null;
    }
  };

  const renderNextBusCard = (bus?: NextBusInfo, label: string = 'Next Bus') => {
    if (!bus || !bus.estimatedArrival) {
      return (
        <div className="bg-slate-800/50 rounded-xl p-2.5 border border-slate-700/50 text-center text-slate-500 text-xs">
          <span className="text-[10px] uppercase font-bold tracking-wider block mb-1">{label}</span>
          <span>No service</span>
        </div>
      );
    }

    const isArr = bus.minutesToArrival === 0 || bus.arrivalText === 'Arr';

    return (
      <div className="bg-slate-800/90 rounded-xl p-2.5 border border-slate-700 text-xs space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">{label}</span>
          {getLoadBadge(bus.load)}
        </div>

        <div className="flex items-baseline justify-between">
          <span className={`text-base font-black ${isArr ? 'text-emerald-400 animate-pulse' : 'text-white'}`}>
            {bus.arrivalText}
          </span>
          <span className="text-[10px] text-slate-400">
            {bus.typeDescription}
          </span>
        </div>

        <div className="flex items-center gap-2 pt-1 border-t border-slate-700/60 text-[10px] text-slate-400">
          {bus.isWheelchairAccessible && (
            <span className="flex items-center gap-0.5 text-sky-300">
              <Accessibility className="w-3 h-3" />
              <span>WAB</span>
            </span>
          )}
          <span>Dest: {bus.destinationCode}</span>
        </div>
      </div>
    );
  };

  return (
    <div id="lta-bus-arrival-widget" className="bg-slate-900 rounded-3xl p-6 border border-slate-800 text-white shadow-lg space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-600/30 border border-rose-500/40 flex items-center justify-center text-rose-400">
            <Bus className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white">Live LTA DataMall Bus Arrival v3</h4>
              <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[9px] font-semibold px-2 py-0.2 rounded-full">
                20s Live Sync
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Official Singapore Land Transport Authority (LTA) verified next bus timing
            </p>
          </div>
        </div>

        {/* Live sync timer & manual refresh */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
              autoRefresh
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {autoRefresh ? `Live Sync (${countdown}s)` : 'Sync Paused'}
          </button>

          <button
            id="btn-refresh-bus"
            type="button"
            onClick={() => fetchArrivals(busStopCode, serviceNo)}
            disabled={isLoading}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            title="Refresh bus timings"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-rose-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Query Form: Bus Stop Code & Optional Service No */}
      <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
        <div className="sm:col-span-6">
          <label className="block text-[11px] font-medium text-slate-400 mb-1">
            Bus Stop Code (e.g. 83139)
          </label>
          <div className="relative">
            <input
              id="input-bus-stop-code"
              type="text"
              value={busStopCode}
              onChange={(e) => setBusStopCode(e.target.value)}
              placeholder="e.g. 83139"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>

        <div className="sm:col-span-4">
          <label className="block text-[11px] font-medium text-slate-400 mb-1">
            Service No (Optional, e.g. 15)
          </label>
          <input
            id="input-bus-service-no"
            type="text"
            value={serviceNo}
            onChange={(e) => setServiceNo(e.target.value)}
            placeholder="All or e.g. 15"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="sm:col-span-2 flex items-end">
          <button
            id="btn-search-bus-timing"
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold py-2 px-3 rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Fetch</span>
          </button>
        </div>
      </form>

      {/* Quick Select Presets */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
        <span className="text-slate-500 shrink-0 font-medium">Quick Stops:</span>
        {COMMON_BUS_STOPS.map((stop) => (
          <button
            key={stop.code}
            type="button"
            onClick={() => {
              setBusStopCode(stop.code);
              fetchArrivals(stop.code, serviceNo);
            }}
            className={`shrink-0 px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
              busStopCode === stop.code
                ? 'bg-rose-600/30 text-rose-300 border-rose-500/50'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            <strong>{stop.code}</strong> ({stop.name.split('/')[0].trim()})
          </button>
        ))}
      </div>

      {/* Error Notice */}
      {error && (
        <div className="bg-rose-950/50 border border-rose-800/80 rounded-xl p-3 text-xs text-rose-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Bus Arrival Services List */}
      <div className="space-y-3">
        {data && data.services && data.services.length > 0 ? (
          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {data.services.map((srv: BusServiceArrival) => (
              <div
                key={srv.serviceNo}
                className="bg-slate-800/60 hover:bg-slate-800/90 rounded-2xl p-3.5 border border-slate-700/80 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-9 h-9 rounded-xl bg-rose-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                      {srv.serviceNo}
                    </span>
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Service {srv.serviceNo}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Operator: {srv.operator}
                      </span>
                    </div>
                  </div>

                  <span className="text-[11px] text-slate-400 font-mono">
                    Stop: {data.busStopCode}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {renderNextBusCard(srv.nextBus, 'Next Bus')}
                  {renderNextBusCard(srv.nextBus2, 'Subsequent 2')}
                  {renderNextBusCard(srv.nextBus3, 'Subsequent 3')}
                </div>
              </div>
            ))}
          </div>
        ) : !isLoading && !error ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            No operating bus services found for stop code <strong>{busStopCode}</strong>.
          </div>
        ) : null}
      </div>
    </div>
  );
};
