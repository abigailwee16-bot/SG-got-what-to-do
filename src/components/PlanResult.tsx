/**
 * PlanResult Component
 * Renders the primary recommended Singapore itinerary with timeline, transit,
 * interactive map view (A, B, C...), collapsible attire & wet-weather dropboxes,
 * and alternative plans.
 */

import React, { useState } from 'react';
import {
  CheckCircle2,
  MapPin,
  Train,
  Navigation,
  CloudRain,
  Shirt,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ShieldCheck,
  Zap,
  Map as MapIcon,
  ListOrdered,
  Bus,
} from 'lucide-react';
import { RecommendedPlan, UserPreferences, LiveSingaporeConditions } from '../types';
import { MRT_LINES_MAP } from '../utils/singaporeData';
import { ItineraryMap } from './ItineraryMap';
import { BusArrivalWidget } from './BusArrivalWidget';

interface PlanResultProps {
  plan: RecommendedPlan;
  alternativePlans: RecommendedPlan[];
  onSelectAlternative: (altPlan: RecommendedPlan) => void;
  userPreferences: UserPreferences;
  conditions: LiveSingaporeConditions | null;
  onRefreshInsight?: () => void;
  isLoadingInsight?: boolean;
}

const STOP_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export const PlanResult: React.FC<PlanResultProps> = ({
  plan,
  alternativePlans,
  onSelectAlternative,
  userPreferences,
  conditions,
}) => {
  const [viewMode, setViewMode] = useState<'both' | 'map' | 'timeline'>('both');
  const [isAttireOpen, setIsAttireOpen] = useState(false);
  const [isRainOpen, setIsRainOpen] = useState(false);
  const [showBusArrivals, setShowBusArrivals] = useState(false);

  return (
    <div id="plan-result-container" className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Hero Plan Summary Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-700/80">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="bg-rose-500 text-white text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
              Your Best Singapore Plan
            </span>
            <span className="bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Verified Singapore Routing
            </span>
          </div>

          <div className="text-xs text-slate-300 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-rose-400" />
            <span>Target Area: <strong className="text-white">{plan.area}</strong></span>
          </div>
        </div>

        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">
          {plan.title}
        </h2>
        <p className="text-sm md:text-base text-slate-300 mb-6">
          {plan.tagline}
        </p>

        {/* Cost & Duration Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 mb-6">
          <div>
            <span className="text-xs text-slate-400 block mb-1">Estimated Cost / Pax</span>
            <div className="text-2xl font-black text-emerald-400">
              SGD ${plan.costPerPerson}
            </div>
            <span className="text-[11px] text-slate-400">
              Total ({userPreferences.groupSize}pax): SGD ${plan.totalCostGroup}
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-400 block mb-1">Total Duration</span>
            <div className="text-2xl font-black text-white flex items-baseline gap-1">
              <span>~{Math.round(plan.totalDurationMinutes / 60)}</span>
              <span className="text-sm font-normal text-slate-300">hours</span>
            </div>
            <span className="text-[11px] text-slate-400">{plan.items.length} curated stops</span>
          </div>

          <div>
            <span className="text-xs text-slate-400 block mb-1">Activity Breakdown</span>
            <div className="text-xs text-slate-200 space-y-0.5 font-medium">
              <div>Activity: ${plan.costBreakdown.activity}</div>
              <div>Food/Dining: ${plan.costBreakdown.food}</div>
              <div>MRT/Transit: ~${plan.costBreakdown.transport}</div>
            </div>
          </div>

          <div>
            <span className="text-xs text-slate-400 block mb-1">Weather Suitability</span>
            <div className="text-xs font-semibold text-sky-300">
              {plan.weatherSuitability.status === 'indoor_safe' ? '100% Indoor Shelter' : 'Balanced Outdoor'}
            </div>
            <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
              {conditions?.weatherForecast || 'Normal conditions'}
            </p>
          </div>
        </div>

        {/* Why this plan was selected checklist */}
        <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-700/60">
          <h3 className="text-xs font-bold text-rose-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-rose-400" />
            Why This Plan Was Selected For You
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {plan.whyRecommended.map((reason, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-slate-200">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>{reason}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Itinerary Section with "View on Map" & Timeline */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/90 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Your Recommended Itinerary</h3>
            <p className="text-xs text-slate-500">
              Sequenced to minimize walking and avoid peak transit congestions
            </p>
          </div>

          {/* View mode toggle controls: View on Map vs Timeline */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
            <button
              id="btn-view-both"
              type="button"
              onClick={() => setViewMode('both')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'both'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Views
            </button>
            <button
              id="btn-view-map"
              type="button"
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'map'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>View on Map</span>
            </button>
            <button
              id="btn-view-timeline"
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'timeline'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>Timeline</span>
            </button>
          </div>
        </div>

        {/* Visual Map View (A for first destination, B for second, etc.) */}
        {(viewMode === 'both' || viewMode === 'map') && (
          <div className="space-y-2">
            <ItineraryMap plan={plan} />
          </div>
        )}

        {/* Timeline Items */}
        {(viewMode === 'both' || viewMode === 'timeline') && (
          <div className="space-y-8 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-slate-200 md:before:left-36 pt-2">
            {plan.items.map((item, index) => {
              const act = item.activity;
              const letter = STOP_LETTERS[index] || `${index + 1}`;
              return (
                <div key={act.id} className="relative flex flex-col md:flex-row items-start gap-4 md:gap-8 group">
                  {/* Time & Letter Badge (Desktop side column / Mobile inline) */}
                  <div className="md:w-32 shrink-0 text-left md:text-right">
                    <div className="inline-flex items-center gap-1.5 bg-slate-900 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-xs">
                      <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center font-black">
                        {letter}
                      </span>
                      <span>{item.timeSlot}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 block mt-1 font-medium capitalize">
                      {item.role === 'main' ? 'Primary Activity' : item.role === 'food' ? 'Dining Experience' : 'Leisure Stop'}
                    </span>
                  </div>

                  {/* Timeline node dot */}
                  <div className="hidden md:flex absolute left-36 -translate-x-1/2 w-6 h-6 rounded-full bg-rose-600 text-white font-black text-[11px] border-2 border-white shadow-xs z-10 items-center justify-center">
                    {letter}
                  </div>

                  {/* Activity Card */}
                  <div className="flex-1 bg-slate-50 hover:bg-slate-50/80 rounded-2xl p-5 border border-slate-200/80 transition-all w-full">
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="bg-rose-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded">
                            Stop {letter}
                          </span>
                          <span className="bg-rose-100 text-rose-800 text-[11px] font-bold px-2 py-0.5 rounded-md">
                            {act.category}
                          </span>
                          <span className="bg-slate-200 text-slate-800 text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase">
                            {act.dataConfidence}
                          </span>
                          {act.airConditioned && (
                            <span className="bg-sky-100 text-sky-800 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                              Air-Conditioned
                            </span>
                          )}
                          {act.voucherSupport.cdcVouchers && (
                            <span className="bg-purple-100 text-purple-800 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                              CDC Vouchers OK
                            </span>
                          )}
                        </div>
                        <h4 className="text-base font-bold text-slate-900">{act.name}</h4>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-bold text-emerald-700">
                          {act.pricePerPerson === 0 ? 'Free Entry' : `Est. SGD $${act.pricePerPerson}/pax`}
                        </span>
                        <span className="text-[11px] text-slate-500 block">{act.openingHours}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                      {act.description}
                    </p>

                    {/* Highlights and MRT line info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-200/60 mb-3">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Train className="w-3.5 h-3.5 text-slate-500" />
                        <span>
                          MRT: <strong>{act.nearestMrt.station}</strong>
                        </span>
                        <div className="flex gap-1 ml-1">
                          {act.nearestMrt.line.map((lineCode) => {
                            const lineMeta = MRT_LINES_MAP[lineCode] || { color: '#64748b', textColor: '#fff' };
                            return (
                              <span
                                key={lineCode}
                                style={{ backgroundColor: lineMeta.color, color: lineMeta.textColor }}
                                className="text-[9px] font-bold px-1.5 py-0.2 rounded"
                              >
                                {lineCode}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Navigation className="w-3.5 h-3.5 text-rose-500" />
                        <span>{act.nearestMrt.exit || 'Main Exit'} · {act.nearestMrt.walkMinutes} min walk</span>
                      </div>
                    </div>

                    {/* Insider Tip Badge */}
                    {act.tips && act.tips.length > 0 && (
                      <div className="bg-amber-50 rounded-xl p-2.5 border border-amber-200/80 text-xs text-amber-950 flex items-start gap-2">
                        <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span><strong>Local Tip:</strong> {act.tips[0]}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Getting Around & Navigation Handoff */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/90 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Train className="w-5 h-5 text-rose-600" />
              <span>Getting Around & Transit Route</span>
            </h3>
            <p className="text-xs text-slate-500">
              Singapore public transport instructions based on OneMap, MRT & LTA DataMall
            </p>
          </div>

          <button
            id="btn-toggle-bus-arrivals"
            type="button"
            onClick={() => setShowBusArrivals(!showBusArrivals)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              showBusArrivals
                ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
          >
            <Bus className="w-3.5 h-3.5" />
            <span>{showBusArrivals ? 'Hide Next Bus Timings' : 'Check Live Bus Arrival (LTA)'}</span>
          </button>
        </div>

        {/* LTA DataMall Live Bus Arrival Drawer */}
        {showBusArrivals && (
          <div className="animate-in fade-in duration-200">
            <BusArrivalWidget initialBusStopCode="83139" />
          </div>
        )}

        <div className="space-y-3">
          {plan.travelSegments.map((seg, idx) => (
            <div
              key={idx}
              className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900">
                    {seg.fromName} → {seg.toName}
                  </span>
                  <span className="bg-slate-200 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase">
                    {seg.mode} ({seg.durationMinutes} mins · {seg.distanceMeters}m)
                  </span>
                </div>
                <p className="text-xs text-slate-600">{seg.instruction}</p>
              </div>

              <a
                href={seg.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs shrink-0 cursor-pointer"
              >
                <span>Navigate in Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Dropboxes (Accordions) for "What to wear" and "If it rains" */}
      <div className="space-y-3">
        {/* What to wear Dropbox */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition-all">
          <button
            id="accordion-what-to-wear"
            type="button"
            onClick={() => setIsAttireOpen(!isAttireOpen)}
            className="w-full p-4 md:p-5 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                <Shirt className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">What to Wear (Attire Guide)</h4>
                <p className="text-xs text-slate-500">
                  {isAttireOpen ? 'Click to collapse recommendation' : 'Click to view dress code & footwear advice for this plan'}
                </p>
              </div>
            </div>
            <div className="p-1 rounded-lg bg-slate-100 text-slate-600">
              {isAttireOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {isAttireOpen && (
            <div className="px-5 pb-5 pt-1 border-t border-slate-100 space-y-3 animate-in fade-in duration-200">
              <p className="text-xs text-slate-600 leading-relaxed">
                {plan.attireAdvice}
              </p>
              <div className="bg-sky-50 rounded-xl p-3 border border-sky-100 text-xs text-sky-900 space-y-1">
                <div>• <strong>Footwear:</strong> Comfortable cushioned sneakers or walking shoes.</div>
                <div>• <strong>Weather gear:</strong> Compact umbrella for sudden tropical afternoon showers.</div>
                <div>• <strong>Temperature:</strong> Indoor venues maintain a crisp 23°C - 25°C air-conditioning.</div>
              </div>
            </div>
          )}
        </div>

        {/* If It Rains Dropbox */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition-all">
          <button
            id="accordion-if-it-rains"
            type="button"
            onClick={() => setIsRainOpen(!isRainOpen)}
            className="w-full p-4 md:p-5 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <CloudRain className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">If It Rains: Instant Wet-Weather Pivot</h4>
                <p className="text-xs text-slate-500">
                  {isRainOpen ? 'Click to collapse rain contingency' : 'Click to view 100% sheltered wet-weather backup plan'}
                </p>
              </div>
            </div>
            <div className="p-1 rounded-lg bg-slate-100 text-slate-600">
              {isRainOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {isRainOpen && (
            <div className="px-5 pb-5 pt-1 border-t border-slate-100 space-y-3 animate-in fade-in duration-200">
              <p className="text-xs text-slate-600 leading-relaxed">
                {plan.rainPlan.description}
              </p>
              <div className="bg-slate-900 text-white rounded-xl p-3 border border-slate-800 text-xs">
                <div className="font-semibold text-sky-300 mb-1">{plan.rainPlan.title}</div>
                <div className="text-[11px] text-slate-300">
                  100% sheltered walkways via connected MRT concourses. Zero rain exposure.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. Alternative Plan Options */}
      {alternativePlans.length > 0 && (
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/90">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Alternative Singapore Plans</h3>
              <p className="text-xs text-slate-500">
                Other strong candidates tailored to different trade-offs
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {alternativePlans.map((altPlan) => (
              <div
                key={altPlan.id}
                className="bg-slate-50 rounded-2xl p-4 border border-slate-200 hover:border-rose-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded">
                      {altPlan.area}
                    </span>
                    <span className="text-xs font-bold text-emerald-700">
                      ~SGD ${altPlan.costPerPerson}/pax
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">{altPlan.title}</h4>
                  <p className="text-xs text-slate-500 mb-3">{altPlan.tagline}</p>
                  <ul className="text-[11px] text-slate-600 space-y-1 mb-4">
                    {altPlan.whyRecommended.slice(0, 2).map((w, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-emerald-500">✓</span> {w}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectAlternative(altPlan)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-rose-600 text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Switch to This Plan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

