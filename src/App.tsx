/**
 * SG got what to do - Main Application Entry
 * SG is not as boring as you think
 * Full-stack Singapore Activity Discovery & Recommendation Engine
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { PreferenceForm } from './components/PreferenceForm';
import { PlanResult } from './components/PlanResult';
import { InspireMe } from './components/InspireMe';
import {
  CommunityPlan,
  CommunityTip,
  LiveSingaporeConditions,
  RecommendedPlan,
  UserPreferences,
} from './types';
import { DEFAULT_SINGAPORE_CONDITIONS } from './utils/singaporeData';
import { buildRecommendedPlan } from './utils/recommendationEngine';
import { COMMUNITY_PLANS, INITIAL_COMMUNITY_TIPS } from './data/communityPlans';
import { SINGAPORE_ACTIVITIES } from './data/singaporeActivities';

export default function App() {
  const [activeTab, setActiveTab] = useState<'find' | 'inspire'>('find');

  // User Preferences State
  const [preferences, setPreferences] = useState<UserPreferences>({
    currentLocationName: 'Chinatown / Outram, Singapore',
    currentCoordinates: { lat: 1.2824, lng: 103.8431 },
    destinationQuery: 'Chinatown',
    destinationCoordinates: { lat: 1.2824, lng: 103.8431 },
    groupSize: 2,
    groupCategory: '2',
    durationMinutes: 180,
    durationOption: '2_3h',
    budgetPerPerson: 50,
    budgetOption: '25_50',
    indoorOutdoor: 'rain_preference',
    accessibility: [],
    vouchers: ['cdc_vouchers'],
    interests: ['Food', 'Heritage'],
  });

  // Live Singapore Conditions (data.gov.sg / NEA)
  const [conditions, setConditions] = useState<LiveSingaporeConditions>(DEFAULT_SINGAPORE_CONDITIONS);
  const [isLocating, setIsLocating] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);

  // Recommended Plans State
  const [primaryPlan, setPrimaryPlan] = useState<RecommendedPlan | null>(null);
  const [alternativePlans, setAlternativePlans] = useState<RecommendedPlan[]>([]);

  // Community State
  const [communityPlans, setCommunityPlans] = useState<CommunityPlan[]>(COMMUNITY_PLANS);
  const [communityTips, setCommunityTips] = useState<CommunityTip[]>(INITIAL_COMMUNITY_TIPS);

  // Fetch Live Weather & NEA Data on mount
  const fetchLiveWeather = useCallback(async () => {
    try {
      const res = await fetch('/api/live-data/weather');
      if (res.ok) {
        const data = await res.json();
        setConditions(data);
      }
    } catch (e) {
      console.warn('Live weather fetch warning:', e);
    }
  }, []);

  useEffect(() => {
    fetchLiveWeather();
    // Poll weather every 3 minutes for live updates
    const timer = setInterval(fetchLiveWeather, 180000);
    return () => clearInterval(timer);
  }, [fetchLiveWeather]);

  // Request Browser Geolocation & Reverse Lookup with OneMap
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser. Please select a Singapore hub manually.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        try {
          const revRes = await fetch(`/api/location/reverse?lat=${lat}&lng=${lng}`);
          if (revRes.ok) {
            const revData = await revRes.json();
            setPreferences((prev) => ({
              ...prev,
              currentLocationName: revData.area || 'Current Singapore GPS Location',
              currentCoordinates: { lat, lng },
              destinationQuery: revData.area || 'Nearby',
              destinationCoordinates: { lat, lng },
            }));
          } else {
            setPreferences((prev) => ({
              ...prev,
              currentLocationName: 'Singapore GPS Position',
              currentCoordinates: { lat, lng },
            }));
          }
        } catch {
          setPreferences((prev) => ({
            ...prev,
            currentLocationName: 'Singapore GPS Position',
            currentCoordinates: { lat, lng },
          }));
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        console.warn('Geolocation denied or error:', err.message);
        setIsLocating(false);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Generate Recommended Plan with Gemini AI Reasoning
  const generatePlan = async () => {
    setIsGeneratingPlan(true);

    try {
      // 1. Run Core Multidimensional Recommendation Engine
      const { primaryPlan: basePlan, alternativePlans: alts } = buildRecommendedPlan(
        preferences,
        conditions,
        SINGAPORE_ACTIVITIES
      );

      setPrimaryPlan(basePlan);
      setAlternativePlans(alts);

      // 2. Query Gemini Server-Side for Narrative Reasoning Layer
      setIsLoadingInsight(true);
      try {
        const insightRes = await fetch('/api/insight', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plan: basePlan,
            userPreferences: preferences,
            liveConditions: conditions,
          }),
        });

        if (insightRes.ok) {
          const insightData = await insightRes.json();
          setPrimaryPlan((prev) => (prev ? { ...prev, geminiInsight: insightData } : prev));
        }
      } catch (geminiErr) {
        console.warn('Gemini insight fetch warning:', geminiErr);
      } finally {
        setIsLoadingInsight(false);
      }
    } catch (err) {
      console.error('Plan generation error:', err);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  // Refresh only the Gemini AI Insight on demand
  const handleRefreshInsight = async () => {
    if (!primaryPlan) return;
    setIsLoadingInsight(true);
    try {
      const insightRes = await fetch('/api/insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: primaryPlan,
          userPreferences: preferences,
          liveConditions: conditions,
        }),
      });

      if (insightRes.ok) {
        const insightData = await insightRes.json();
        setPrimaryPlan((prev) => (prev ? { ...prev, geminiInsight: insightData } : prev));
      }
    } catch (e) {
      console.warn('Refresh insight error:', e);
    } finally {
      setIsLoadingInsight(false);
    }
  };

  // Switch to an alternative plan
  const handleSelectAlternative = (altPlan: RecommendedPlan) => {
    setPrimaryPlan(altPlan);
    setAlternativePlans((prev) => prev.filter((p) => p.id !== altPlan.id));
    window.scrollTo({ top: 320, behavior: 'smooth' });
  };

  // Apply a community plan from Tab 2
  const handleApplyCommunityPlan = (cp: CommunityPlan) => {
    const updatedPrefs: UserPreferences = {
      ...preferences,
      destinationQuery: cp.area,
      groupSize: cp.groupSize,
      groupCategory: (cp.groupSize <= 1 ? '1' : cp.groupSize === 2 ? '2' : cp.groupSize <= 4 ? '3-4' : '5-8') as any,
      durationMinutes: cp.durationMinutes,
      budgetPerPerson: cp.budgetPerPerson,
      interests: cp.interests,
    };
    setPreferences(updatedPrefs);
    setActiveTab('find');

    // Run recommendation engine with new preferences
    const { primaryPlan: newPlan, alternativePlans: newAlts } = buildRecommendedPlan(
      updatedPrefs,
      conditions,
      SINGAPORE_ACTIVITIES
    );
    setPrimaryPlan(newPlan);
    setAlternativePlans(newAlts);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Like a community plan
  const handleLikePlan = (planId: string) => {
    setCommunityPlans((prev) =>
      prev.map((p) => (p.id === planId ? { ...p, likesCount: p.likesCount + 1 } : p))
    );
  };

  // Upvote helpful community tip
  const handleHelpfulTip = (tipId: string) => {
    setCommunityTips((prev) =>
      prev.map((t) => (t.id === tipId ? { ...t, helpfulCount: t.helpfulCount + 1 } : t))
    );
  };

  // Add new community tip
  const handleAddTip = (newTipData: Omit<CommunityTip, 'id' | 'createdAt' | 'helpfulCount' | 'dataConfidence'>) => {
    const newTip: CommunityTip = {
      ...newTipData,
      id: `tip-${Date.now()}`,
      helpfulCount: 1,
      createdAt: new Date().toISOString().split('T')[0],
      dataConfidence: 'COMMUNITY',
    };
    setCommunityTips((prev) => [newTip, ...prev]);
  };

  // Initial Plan Generation on Mount
  useEffect(() => {
    generatePlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans selection:bg-rose-500 selection:text-white">
      {/* 1. Header with live clock, weather status, and navigation */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        conditions={conditions}
        currentLocationName={preferences.currentLocationName}
        onRefreshLocation={handleDetectLocation}
        isLocating={isLocating}
      />

      {/* 2. Main Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {activeTab === 'find' ? (
          <div className="space-y-8">
            {/* Layout Grid: Preferences Form & Result */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Criteria Form */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800">
                  <h2 className="text-sm font-bold text-slate-100 mb-1">
                    Customise Your Activity Criteria
                  </h2>
                  <p className="text-xs text-slate-400">
                    Tell us where you are, who you're with, your budget, and what you feel like doing.
                  </p>
                </div>

                <PreferenceForm
                  preferences={preferences}
                  onChange={(updated) => setPreferences((prev) => ({ ...prev, ...updated }))}
                  onSubmit={generatePlan}
                  isLoading={isGeneratingPlan}
                  onDetectLocation={handleDetectLocation}
                  isLocating={isLocating}
                />
              </div>

              {/* Right Column: Recommended Itinerary Plan Result */}
              <div className="lg:col-span-7">
                {primaryPlan ? (
                  <PlanResult
                    plan={primaryPlan}
                    alternativePlans={alternativePlans}
                    onSelectAlternative={handleSelectAlternative}
                    userPreferences={preferences}
                    conditions={conditions}
                    onRefreshInsight={handleRefreshInsight}
                    isLoadingInsight={isLoadingInsight}
                  />
                ) : (
                  <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
                      <span className="animate-spin text-xl">🧭</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">
                      Generating Your Singapore Recommendation...
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Querying OneMap geospatial distances, live NEA weather forecasts, and Gemini AI reasoning.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Tab 2: Inspire Me (Community Plans & Signals) */
          <InspireMe
            plans={communityPlans}
            tips={communityTips}
            userPreferences={preferences}
            onApplyCommunityPlan={handleApplyCommunityPlan}
            onAddTip={handleAddTip}
            onLikePlan={handleLikePlan}
            onHelpfulTip={handleHelpfulTip}
          />
        )}
      </main>

      {/* 3. Accessible Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-8 mt-16 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-bold text-slate-200">SG got what to do</span> · SG is not as boring as you think
            <div className="text-slate-400 mt-0.5">
              Powered by OneMap, data.gov.sg (NEA Weather & Environmental data), LTA DataMall, and Google Gemini AI.
            </div>
          </div>

          <div className="flex items-center gap-4 text-slate-300">
            <span>Currency: SGD ($)</span>
            <span>·</span>
            <span>Timezone: SGT (UTC+8)</span>
            <span>·</span>
            <span>WCAG 2.1 AA Compliant</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
