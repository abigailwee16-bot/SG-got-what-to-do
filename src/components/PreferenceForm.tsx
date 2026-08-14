/**
 * PreferenceForm Component
 * Collects Singapore activity search criteria using progressive disclosure, segmented controls, and chips
 */

import React, { useState } from 'react';
import {
  MapPin,
  Users,
  Clock,
  DollarSign,
  CloudSun,
  Accessibility,
  Ticket,
  Heart,
  Search,
  Sparkles,
  Navigation,
  Check,
} from 'lucide-react';
import {
  AccessibilityRequirement,
  BudgetRange,
  DurationOption,
  GroupSizeCategory,
  IndoorOutdoorPreference,
  UserPreferences,
  VoucherType,
} from '../types';
import { POPULAR_SINGAPORE_LOCATIONS } from '../data/singaporeActivities';

interface PreferenceFormProps {
  preferences: UserPreferences;
  onChange: (updated: Partial<UserPreferences>) => void;
  onSubmit: () => void;
  isLoading: boolean;
  onDetectLocation: () => void;
  isLocating: boolean;
}

const INTEREST_OPTIONS = [
  'Food',
  'Heritage',
  'Culture',
  'Museums',
  'Art',
  'Music',
  'Theatre',
  'Sports',
  'Fitness',
  'Nature',
  'Shopping',
  'Family',
  'Nightlife',
  'Learning',
  'Wellness',
  'Adventure',
  'Free activities',
];

const ACCESSIBILITY_OPTIONS: { id: AccessibilityRequirement; label: string; desc: string }[] = [
  { id: 'wheelchair', label: 'Wheelchair Accessible', desc: 'Ramps & wide doorways' },
  { id: 'step_free', label: 'Step-free Access', desc: 'No stairs required' },
  { id: 'lift_access', label: 'Lift Access', desc: 'Elevators to all floors' },
  { id: 'minimal_walking', label: 'Minimal Walking', desc: 'Short distances & ample seating' },
  { id: 'accessible_toilets', label: 'Accessible Toilets', desc: 'Dedicated facilities' },
  { id: 'elderly_friendly', label: 'Elderly Friendly', desc: 'Gentle pace & seated options' },
  { id: 'children_friendly', label: 'Children Friendly', desc: 'Safe for young kids & strollers' },
];

const VOUCHER_OPTIONS: { id: VoucherType; label: string; desc: string }[] = [
  { id: 'cdc_vouchers', label: 'CDC Vouchers', desc: 'Hawker & Heartland merchant schemes' },
  { id: 'culture_pass', label: 'Singapore Culture Pass', desc: 'Museums & performing arts' },
  { id: 'activesg_credits', label: 'ActiveSG Credits', desc: 'Public gyms, pools & sports halls' },
  { id: 'passion_card', label: 'Passion Card', desc: 'PA member discounts' },
];

export const PreferenceForm: React.FC<PreferenceFormProps> = ({
  preferences,
  onChange,
  onSubmit,
  isLoading,
  onDetectLocation,
  isLocating,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [locationResults, setLocationResults] = useState<any[]>([]);

  // Search OneMap & Singapore locations
  const handleLocationSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setLocationResults([]);
      return;
    }

    setIsSearchingLocation(true);
    try {
      const res = await fetch(`/api/location/search?query=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setLocationResults(data.results || []);
      }
    } catch (err) {
      console.warn('Location search fetch error:', err);
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const handleSelectCustomLocation = (loc: any) => {
    onChange({
      destinationQuery: loc.name,
      destinationCoordinates: loc.coordinates,
      currentLocationName: loc.name,
    });
    setSearchQuery(loc.name);
    setLocationResults([]);
  };

  const handleSelectQuickLocation = (loc: (typeof POPULAR_SINGAPORE_LOCATIONS)[0]) => {
    onChange({
      destinationQuery: loc.name,
      destinationCoordinates: loc.coordinates,
      currentLocationName: loc.name,
    });
    setSearchQuery(loc.name);
  };

  const toggleInterest = (interest: string) => {
    const current = preferences.interests;
    const exists = current.includes(interest);
    const updated = exists ? current.filter((i) => i !== interest) : [...current, interest];
    onChange({ interests: updated });
  };

  const toggleAccessibility = (acc: AccessibilityRequirement) => {
    const current = preferences.accessibility;
    const exists = current.includes(acc);
    const updated = exists ? current.filter((a) => a !== acc) : [...current, acc];
    onChange({ accessibility: updated });
  };

  const toggleVoucher = (v: VoucherType) => {
    const current = preferences.vouchers;
    const exists = current.includes(v);
    const updated = exists ? current.filter((item) => item !== v) : [...current, v];
    onChange({ vouchers: updated });
  };

  const handleGroupSize = (cat: GroupSizeCategory, num: number) => {
    onChange({ groupCategory: cat, groupSize: num });
  };

  const handleDuration = (option: DurationOption, mins: number) => {
    onChange({ durationOption: option, durationMinutes: mins });
  };

  const handleBudget = (option: BudgetRange, val: number) => {
    onChange({ budgetOption: option, budgetPerPerson: val });
  };

  return (
    <form
      id="recommendation-preferences-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-5 md:p-7 space-y-6"
    >
      {/* 1. Location & Starting Area */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label htmlFor="singapore-location-input" className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <MapPin className="w-4 h-4 text-rose-600" />
            <span>Where in Singapore are you or heading to?</span>
          </label>
          <button
            type="button"
            id="use-current-gps-btn"
            onClick={onDetectLocation}
            disabled={isLocating}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer border border-rose-200"
          >
            <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'Locating...' : 'Use My Current Location'}</span>
          </button>
        </div>

        {/* Search input with OneMap lookup */}
        <div className="relative mb-3">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            id="singapore-location-input"
            type="text"
            value={searchQuery || preferences.destinationQuery || ''}
            onChange={(e) => handleLocationSearch(e.target.value)}
            placeholder="Search Singapore mall, MRT station, neighbourhood, or postal code..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white text-slate-900 placeholder:text-slate-400"
          />

          {/* Autocomplete Dropdown */}
          {locationResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 max-h-60 overflow-y-auto">
              <div className="p-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                OneMap Singapore Results
              </div>
              {locationResults.map((loc, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleSelectCustomLocation(loc)}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 border-b border-slate-50 last:border-0 flex flex-col"
                >
                  <span className="text-sm font-semibold text-slate-900">{loc.name}</span>
                  <span className="text-xs text-slate-500 truncate">{loc.address}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Popular Singapore Locations */}
        <div>
          <span className="text-xs text-slate-500 block mb-2 font-medium">Quick Singapore Hubs:</span>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_SINGAPORE_LOCATIONS.slice(0, 7).map((loc, i) => {
              const isSelected = preferences.destinationQuery === loc.name || preferences.currentLocationName === loc.name;
              return (
                <button
                  type="button"
                  key={i}
                  onClick={() => handleSelectQuickLocation(loc)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-rose-600 text-white border-rose-600 font-medium shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {loc.name.split('&')[0].trim()}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Group Size & Duration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-100">
        {/* Group Size */}
        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-2.5">
            <Users className="w-4 h-4 text-rose-600" />
            <span>How many people are going?</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { cat: '1', label: '1 (Solo)', num: 1 },
              { cat: '2', label: '2 (Couple)', num: 2 },
              { cat: '3-4', label: '3 – 4 Pax', num: 4 },
              { cat: '5-8', label: '5 – 8 Pax', num: 6 },
              { cat: '9-15', label: '9 – 15 Pax', num: 10 },
              { cat: '16+', label: '16+ Group', num: 20 },
            ].map((g) => (
              <button
                type="button"
                key={g.cat}
                onClick={() => handleGroupSize(g.cat as GroupSizeCategory, g.num)}
                className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center ${
                  preferences.groupCategory === g.cat
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-2.5">
            <Clock className="w-4 h-4 text-rose-600" />
            <span>How much time do you have?</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { opt: 'under_1h', label: '< 1 hour', mins: 45 },
              { opt: '1_2h', label: '1 – 2 hrs', mins: 90 },
              { opt: '2_3h', label: '2 – 3 hrs', mins: 150 },
              { opt: '3_5h', label: '3 – 5 hrs', mins: 240 },
              { opt: 'half_day', label: 'Half Day', mins: 360 },
              { opt: 'full_day', label: 'Full Day', mins: 480 },
            ].map((d) => (
              <button
                type="button"
                key={d.opt}
                onClick={() => handleDuration(d.opt as DurationOption, d.mins)}
                className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center ${
                  preferences.durationOption === d.opt
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Budget & Indoor/Outdoor */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-100">
        {/* Budget per Person SGD */}
        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-2.5">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>Budget per person (SGD)</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { opt: 'free', label: 'Free ($0)', val: 0 },
              { opt: 'under_10', label: '< $10', val: 10 },
              { opt: '10_25', label: '$10 – $25', val: 25 },
              { opt: '25_50', label: '$25 – $50', val: 50 },
              { opt: '50_100', label: '$50 – $100', val: 100 },
              { opt: '100_plus', label: '$100+', val: 150 },
            ].map((b) => (
              <button
                type="button"
                key={b.opt}
                onClick={() => handleBudget(b.opt as BudgetRange, b.val)}
                className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center ${
                  preferences.budgetOption === b.opt
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {/* Indoor / Outdoor Preference */}
        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-2.5">
            <CloudSun className="w-4 h-4 text-amber-600" />
            <span>Setting Preference</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'indoor', label: 'Air-con / Indoor', sub: 'Beat the tropical heat/rain' },
              { id: 'outdoor', label: 'Outdoor / Parks', sub: 'Enjoy sunshine & open air' },
              { id: 'either', label: 'Either / Flexible', sub: 'Let live weather decide' },
              { id: 'rain_preference', label: 'Indoor if Raining', sub: 'Adaptive rain mode' },
            ].map((set) => (
              <button
                type="button"
                key={set.id}
                onClick={() => onChange({ indoorOutdoor: set.id as IndoorOutdoorPreference })}
                className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                  preferences.indoorOutdoor === set.id
                    ? 'bg-amber-500/10 border-amber-500 text-amber-950 font-medium ring-1 ring-amber-500'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="text-xs font-bold block">{set.label}</span>
                <span className="text-[11px] text-slate-500 block leading-tight">{set.sub}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Interests (Multi-select) */}
      <div className="pt-2 border-t border-slate-100">
        <label className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-2.5">
          <Heart className="w-4 h-4 text-rose-500" />
          <span>Interests (Select multiple or leave empty for general exploration)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {INTEREST_OPTIONS.map((interest) => {
            const isSelected = preferences.interests.includes(interest);
            return (
              <button
                type="button"
                key={interest}
                onClick={() => toggleInterest(interest)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                }`}
              >
                {isSelected && <Check className="w-3.5 h-3.5" />}
                <span>{interest}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Singapore Vouchers & Accessibility (Expandable or Clean Sections) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-100">
        {/* Singapore Vouchers */}
        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-2">
            <Ticket className="w-4 h-4 text-purple-600" />
            <span>Singapore Vouchers to Use</span>
          </label>
          <div className="space-y-1.5">
            {VOUCHER_OPTIONS.map((v) => {
              const isChecked = preferences.vouchers.includes(v.id);
              return (
                <button
                  type="button"
                  key={v.id}
                  onClick={() => toggleVoucher(v.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isChecked
                      ? 'bg-purple-50 border-purple-300 text-purple-950 font-medium'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold block">{v.label}</span>
                    <span className="text-[11px] text-slate-500 block">{v.desc}</span>
                  </div>
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center ${
                      isChecked ? 'bg-purple-600 border-purple-600 text-white' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isChecked && <Check className="w-3 h-3" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Accessibility Requirements */}
        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-2">
            <Accessibility className="w-4 h-4 text-blue-600" />
            <span>Accessibility Requirements</span>
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {ACCESSIBILITY_OPTIONS.map((acc) => {
              const isChecked = preferences.accessibility.includes(acc.id);
              return (
                <button
                  type="button"
                  key={acc.id}
                  onClick={() => toggleAccessibility(acc.id)}
                  className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-1 ${
                    isChecked
                      ? 'bg-blue-50 border-blue-300 text-blue-950 font-medium'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-xs font-semibold truncate" title={acc.desc}>
                    {acc.label}
                  </span>
                  <div
                    className={`w-3.5 h-3.5 shrink-0 rounded border flex items-center justify-center ${
                      isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isChecked && <Check className="w-2.5 h-2.5" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Submit Action */}
      <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-500">
          Scoring with OneMap distance · Live NEA Weather · LTA Transit · Gemini AI
        </div>

        <button
          type="submit"
          id="find-my-plan-submit-btn"
          disabled={isLoading}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-bold text-sm shadow-md shadow-rose-600/20 transition-all cursor-pointer disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
              <span>Analyzing Singapore Conditions...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Find My Singapore Plan</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
