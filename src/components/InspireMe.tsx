/**
 * InspireMe Component (Tab 2)
 * Displays community plans, similarity match insights against user preferences,
 * and crowdsourced tips with clear [COMMUNITY] data confidence distinction
 */

import React, { useState } from 'react';
import {
  Sparkles,
  Heart,
  ThumbsUp,
  MapPin,
  Clock,
  DollarSign,
  Users,
  MessageSquare,
  Plus,
  Compass,
  ArrowRight,
  Filter,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { CommunityPlan, CommunityTip, UserPreferences } from '../types';
import { CommunityTipModal } from './CommunityTipModal';

interface InspireMeProps {
  plans: CommunityPlan[];
  tips: CommunityTip[];
  userPreferences: UserPreferences;
  onApplyCommunityPlan: (plan: CommunityPlan) => void;
  onAddTip: (tip: Omit<CommunityTip, 'id' | 'createdAt' | 'helpfulCount' | 'dataConfidence'>) => void;
  onLikePlan: (planId: string) => void;
  onHelpfulTip: (tipId: string) => void;
}

export const InspireMe: React.FC<InspireMeProps> = ({
  plans,
  tips,
  userPreferences,
  onApplyCommunityPlan,
  onAddTip,
  onLikePlan,
  onHelpfulTip,
}) => {
  const [selectedTipCategory, setSelectedTipCategory] = useState<string>('all');
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [activeAreaFilter, setActiveAreaFilter] = useState<string>('all');

  const filteredTips = tips.filter((t) => {
    if (selectedTipCategory !== 'all' && t.category !== selectedTipCategory) return false;
    if (activeAreaFilter !== 'all' && t.area !== activeAreaFilter) return false;
    return true;
  });

  const filteredPlans = plans.filter((p) => {
    if (activeAreaFilter !== 'all' && p.area !== activeAreaFilter) return false;
    return true;
  });

  return (
    <div id="inspire-me-container" className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-rose-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-rose-500 text-white text-[11px] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider">
              Community Intelligence
            </span>
            <span className="bg-slate-800 text-slate-300 text-[11px] font-medium px-2 py-0.5 rounded-full border border-slate-700">
              Singapore Crowdsourced
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-1">
            See What Other People Are Doing in Singapore
          </h2>
          <p className="text-xs md:text-sm text-slate-300">
            Real itineraries tried and tested by locals, couples, families, and culture enthusiasts.
          </p>
        </div>

        <button
          onClick={() => setIsTipModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-900/30 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Share a Local Tip</span>
        </button>
      </div>

      {/* 2. Area Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px] shrink-0">
          Filter Area:
        </span>
        {['all', 'Chinatown', 'Marina Bay', 'Civic District', 'Tiong Bahru', 'Kallang', 'Sentosa'].map((area) => (
          <button
            key={area}
            onClick={() => setActiveAreaFilter(area)}
            className={`px-3 py-1.5 rounded-xl font-medium border transition-all cursor-pointer shrink-0 ${
              activeAreaFilter === area
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {area === 'all' ? 'All Singapore Areas' : area}
          </button>
        ))}
      </div>

      {/* 3. Community Itineraries Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Featured Singapore Community Itineraries</h3>
            <p className="text-xs text-slate-500">
              Scored for similarity against your current budget & duration preferences
            </p>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {filteredPlans.length} plans available
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map((cp) => (
            <div
              key={cp.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-rose-300 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Top Meta Badges */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                    {cp.area}
                  </span>
                  {cp.similarityScore && (
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      {cp.similarityScore}% Similar to You
                    </span>
                  )}
                </div>

                <h4 className="text-base font-bold text-slate-900 mb-1 leading-snug">
                  {cp.title}
                </h4>
                <p className="text-xs text-slate-500 mb-3">
                  By {cp.creatorName} · {cp.indoorOutdoor === 'indoor' ? 'Indoor' : 'Mixed indoor/outdoor'}
                </p>

                {/* Similarity Highlights */}
                {cp.similarityHighlights && cp.similarityHighlights.length > 0 && (
                  <div className="bg-slate-50 rounded-xl p-2.5 mb-3 border border-slate-200/60 text-[11px] text-slate-700 space-y-0.5">
                    {cp.similarityHighlights.map((hl, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>{hl}</span>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-xs text-slate-600 mb-4 leading-relaxed line-clamp-3">
                  {cp.description}
                </p>

                {/* Activity List */}
                <div className="space-y-1.5 mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Planned Stops:
                  </span>
                  {cp.activities.map((actName, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-800">
                      <span className="w-4 h-4 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      <span className="truncate">{actName}</span>
                    </div>
                  ))}
                </div>

                {/* Cost & Group Info */}
                <div className="grid grid-cols-3 gap-2 py-2.5 border-t border-b border-slate-100 text-center text-xs mb-4">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Budget</span>
                    <span className="font-bold text-emerald-700">~${cp.budgetPerPerson}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Duration</span>
                    <span className="font-bold text-slate-800">~{Math.round(cp.durationMinutes / 60)}h</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Party</span>
                    <span className="font-bold text-slate-800">{cp.groupSize} Pax</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => onLikePlan(cp.id)}
                  className="flex items-center gap-1 text-xs text-slate-600 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 px-3 py-2 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{cp.likesCount}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onApplyCommunityPlan(cp)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-rose-600 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  <span>Adopt This Plan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Singapore Community Tips Wall */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/90">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-slate-900">Live Singapore Community Tips & Hacks</h3>
              <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                COMMUNITY DATA
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Crowdsourced insider advice from Singapore residents and frequent visitors
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
            {[
              { id: 'all', label: 'All Tips' },
              { id: 'crowd', label: 'Crowds' },
              { id: 'transport', label: 'MRT & Transit' },
              { id: 'voucher', label: 'Vouchers' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedTipCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  selectedTipCategory === cat.id
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tips Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTips.map((tip) => (
            <div
              key={tip.id}
              className="bg-slate-50 rounded-2xl p-4 border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-slate-900 truncate">
                    {tip.activityName}
                  </span>
                  <span className="bg-slate-200 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded capitalize">
                    {tip.category}
                  </span>
                </div>
                <p className="text-xs text-slate-700 mb-3 leading-relaxed">
                  "{tip.content}"
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 text-[11px] text-slate-500">
                <span>By {tip.authorName} · {tip.area}</span>
                <button
                  type="button"
                  onClick={() => onHelpfulTip(tip.id)}
                  className="flex items-center gap-1 text-slate-600 hover:text-rose-600 font-medium cursor-pointer"
                >
                  <ThumbsUp className="w-3 h-3" />
                  <span>Helpful ({tip.helpfulCount})</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tip Submission Modal */}
      <CommunityTipModal
        isOpen={isTipModalOpen}
        onClose={() => setIsTipModalOpen(false)}
        onSubmitTip={onAddTip}
      />
    </div>
  );
};
