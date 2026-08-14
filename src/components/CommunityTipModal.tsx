/**
 * CommunityTipModal Component
 * Accessible dialog allowing users to submit practical tips and crowd advice for Singapore venues
 */

import React, { useState } from 'react';
import { X, Send, MessageSquare, AlertCircle } from 'lucide-react';
import { CommunityTip } from '../types';

interface CommunityTipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitTip: (tip: Omit<CommunityTip, 'id' | 'createdAt' | 'helpfulCount' | 'dataConfidence'>) => void;
}

export const CommunityTipModal: React.FC<CommunityTipModalProps> = ({
  isOpen,
  onClose,
  onSubmitTip,
}) => {
  const [activityName, setActivityName] = useState('');
  const [area, setArea] = useState('Chinatown');
  const [authorName, setAuthorName] = useState('');
  const [category, setCategory] = useState<'crowd' | 'transport' | 'voucher' | 'food' | 'general'>('crowd');
  const [content, setContent] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityName.trim() || !content.trim()) return;

    onSubmitTip({
      activityName: activityName.trim(),
      area,
      authorName: authorName.trim() || 'Singapore Explorer',
      category,
      content: content.trim(),
    });

    setActivityName('');
    setContent('');
    setAuthorName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Share a Singapore Community Tip</h3>
            <p className="text-xs text-slate-500">
              Help fellow explorers with crowd times, MRT exits, or voucher hacks
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Venue / Activity Name *
            </label>
            <input
              type="text"
              required
              value={activityName}
              onChange={(e) => setActivityName(e.target.value)}
              placeholder="e.g. Chinatown Complex, Cloud Forest, Maxwell Food Centre"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Area / Neighbourhood
              </label>
              <select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
              >
                <option value="Chinatown">Chinatown / Outram</option>
                <option value="Marina Bay">Marina Bay / Downtown</option>
                <option value="Civic District">Civic District / City Hall</option>
                <option value="Tiong Bahru">Tiong Bahru</option>
                <option value="Bugis">Bugis / Kampong Gelam</option>
                <option value="Sentosa">Sentosa / HarbourFront</option>
                <option value="Orchard">Orchard / Somerset</option>
                <option value="Kallang">Kallang / Sports Hub</option>
                <option value="Jurong East">Jurong East</option>
                <option value="Changi">Changi / Jewel</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tip Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
              >
                <option value="crowd">Crowd / Best Time</option>
                <option value="transport">Transport / MRT Exit</option>
                <option value="voucher">CDC / Culture Pass Voucher</option>
                <option value="food">Food & Stall Recommendation</option>
                <option value="general">General Insider Tip</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Your Practical Tip *
            </label>
            <textarea
              required
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="e.g. Arrive before 11:45am for zero queue at Michelin hawkers; take MRT Exit 2 for shelter."
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Your Name / Handle (Optional)
            </label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="e.g. Wei Ming (Tiong Bahru Local)"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>Community tips are labelled with [COMMUNITY] tag and vetted for practical Singapore value.</span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl flex items-center gap-1.5 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Tip</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
