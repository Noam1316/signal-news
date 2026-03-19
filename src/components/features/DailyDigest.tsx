'use client';

import { useState } from 'react';
import { useLanguage } from '@/i18n/context';

export default function DailyDigest() {
  const { lang } = useLanguage();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [time, setTime] = useState('08:00');

  const handleSubscribe = () => {
    if (email.includes('@')) {
      setSubscribed(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('signal-news-digest', JSON.stringify({ email, time, subscribedAt: new Date().toISOString() }));
      }
    }
  };

  // Demo preview of what the digest would look like
  const previewStories = [
    { topic: 'Iran Nuclear', likelihood: 72, delta: '+5', shock: true },
    { topic: 'Gaza Ceasefire', likelihood: 58, delta: '-3', shock: false },
    { topic: 'US Economy', likelihood: 44, delta: '+8', shock: true },
    { topic: 'Ukraine Front', likelihood: 65, delta: '+2', shock: false },
    { topic: 'Saudi Deal', likelihood: 31, delta: '-7', shock: false },
  ];

  return (
    <div className="space-y-4">
      {/* Subscribe card */}
      <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          📧 {lang === 'he' ? 'סיכום יומי למייל' : 'Daily Email Digest'}
        </h3>

        {subscribed ? (
          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
            <p className="text-emerald-400 font-semibold">✓ {lang === 'he' ? 'נרשמת בהצלחה!' : 'Subscribed!'}</p>
            <p className="text-[10px] text-gray-400 mt-1">
              {lang === 'he'
                ? `סיכום יומי יישלח ל-${email} בשעה ${time}`
                : `Daily digest will be sent to ${email} at ${time}`}
            </p>
            <button
              onClick={() => setSubscribed(false)}
              className="text-[10px] text-gray-500 hover:text-gray-300 mt-2"
            >
              {lang === 'he' ? 'שנה הגדרות' : 'Change settings'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={lang === 'he' ? 'הזן כתובת מייל' : 'Enter email address'}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-yellow-400/50 focus:outline-none"
              />
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-2 text-sm text-white focus:outline-none"
              >
                <option value="06:00">06:00</option>
                <option value="07:00">07:00</option>
                <option value="08:00">08:00</option>
                <option value="09:00">09:00</option>
                <option value="12:00">12:00</option>
                <option value="18:00">18:00</option>
              </select>
            </div>
            <button
              onClick={handleSubscribe}
              disabled={!email.includes('@')}
              className="w-full py-2.5 rounded-lg bg-yellow-400/15 text-yellow-400 border border-yellow-400/20 hover:bg-yellow-400/25 transition-colors font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {lang === 'he' ? 'הרשמה לסיכום יומי' : 'Subscribe to Daily Digest'}
            </button>
          </div>
        )}
      </div>

      {/* Digest preview */}
      <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 space-y-3">
        <h4 className="text-xs font-semibold text-gray-400 uppercase flex items-center gap-2">
          👁️ {lang === 'he' ? 'תצוגה מקדימה — סיכום יומי' : 'Preview — Daily Digest'}
        </h4>

        <div className="p-4 rounded-lg bg-gray-950 border border-gray-800 space-y-3">
          {/* Header */}
          <div className="border-b border-gray-800 pb-3">
            <h3 className="text-sm font-bold text-yellow-400">⚡ Signal News Daily Brief</h3>
            <p className="text-[10px] text-gray-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          {/* Stories */}
          {previewStories.map((story, i) => (
            <div key={i} className="flex items-center gap-3 py-1.5">
              <span className="text-sm font-bold text-yellow-400 w-8 text-center">{story.likelihood}%</span>
              <div className="flex-1">
                <p className="text-xs text-white">{story.topic}</p>
              </div>
              <span className={`text-[10px] ${story.delta.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                {story.delta}%
              </span>
              {story.shock && <span className="text-[10px] px-1 py-0.5 rounded bg-red-500/15 text-red-400">⚡SHOCK</span>}
            </div>
          ))}

          {/* Footer */}
          <div className="border-t border-gray-800 pt-2 text-center">
            <p className="text-[10px] text-gray-600">
              Track Record: 73% accuracy · Brier: 0.19 · 🔥 4-streak
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
