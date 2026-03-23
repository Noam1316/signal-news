'use client';

import { useState } from 'react';
import { useLanguage } from '@/i18n/context';

const PRESET_TOPICS = [
  { key: 'iran', he: 'איראן', en: 'Iran' },
  { key: 'ukraine', he: 'אוקראינה', en: 'Ukraine' },
  { key: 'israel', he: 'ישראל', en: 'Israel' },
  { key: 'tech', he: 'טכנולוגיה', en: 'Tech' },
  { key: 'economy', he: 'כלכלה', en: 'Economy' },
  { key: 'elections', he: 'בחירות', en: 'Elections' },
  { key: 'china', he: 'סין', en: 'China' },
  { key: 'usa', he: 'ארה"ב', en: 'USA' },
];

type Step = 'idle' | 'open' | 'loading' | 'success' | 'error';

export default function EmailSubscribe() {
  const { lang, dir } = useLanguage();
  const [step, setStep] = useState<Step>('idle');
  const [email, setEmail] = useState('');
  const [dailyBrief, setDailyBrief] = useState(true);
  const [watchlistAlerts, setWatchlistAlerts] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  const t = {
    subscribe: lang === 'he' ? '📧 תקציר יומי במייל' : '📧 Daily Email Brief',
    modalTitle: lang === 'he' ? 'הירשם לעדכונים' : 'Subscribe to Updates',
    emailPlaceholder: lang === 'he' ? 'your@email.com' : 'your@email.com',
    dailyBriefLabel: lang === 'he' ? 'תקציר יומי — כל בוקר ב-7:00' : 'Daily brief — every morning at 7am',
    watchlistLabel: lang === 'he' ? 'התראות על נושאים שאני עוקב' : 'Watchlist topic alerts',
    topicsLabel: lang === 'he' ? 'נושאים לעקוב:' : 'Topics to watch:',
    submitBtn: lang === 'he' ? 'הירשם' : 'Subscribe',
    cancel: lang === 'he' ? 'ביטול' : 'Cancel',
    successTitle: lang === 'he' ? '✅ נרשמת בהצלחה!' : '✅ Subscribed!',
    successMsg: lang === 'he' ? 'תקציר ראשון יגיע מחר בבוקר.' : 'Your first brief arrives tomorrow morning.',
    close: lang === 'he' ? 'סגור' : 'Close',
    emailRequired: lang === 'he' ? 'נא להזין כתובת מייל תקינה' : 'Please enter a valid email',
    atLeastOne: lang === 'he' ? 'נא לבחור לפחות סוג אחד של עדכון' : 'Please choose at least one update type',
  };

  function toggleTopic(key: string) {
    setSelectedTopics(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes('@')) { setErrorMsg(t.emailRequired); return; }
    if (!dailyBrief && !watchlistAlerts) { setErrorMsg(t.atLeastOne); return; }

    setErrorMsg('');
    setStep('loading');

    // Map selected topic keys to Hebrew labels
    const topics = selectedTopics.map(k => {
      const p = PRESET_TOPICS.find(pt => pt.key === k);
      return lang === 'he' ? (p?.he ?? k) : (p?.en ?? k);
    });

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, topics, dailyBrief, watchlistAlerts }),
      });
      if (!res.ok) throw new Error('server error');
      setStep('success');
    } catch {
      setStep('error');
      setErrorMsg(lang === 'he' ? 'שגיאה, נסה שוב.' : 'Error, please try again.');
    }
  }

  if (step === 'idle') {
    return (
      <button
        onClick={() => setStep('open')}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-sm font-medium transition-all"
        dir={dir}
      >
        <span>📧</span>
        <span>{t.subscribe}</span>
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={() => { if (step !== 'loading') setStep('idle'); }}
      />

      {/* Modal */}
      <div
        dir={dir}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-[#0f1629] border border-white/10 rounded-2xl shadow-2xl p-6"
      >
        {step === 'success' ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">✅</div>
            <h2 className="text-xl font-bold text-white mb-2">{t.successTitle}</h2>
            <p className="text-gray-400 text-sm mb-6">{t.successMsg}</p>
            <button
              onClick={() => setStep('idle')}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-500 transition"
            >
              {t.close}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2 className="text-lg font-bold text-white mb-5">{t.modalTitle}</h2>

            {/* Email */}
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={t.emailPlaceholder}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-indigo-500 mb-4"
              dir="ltr"
              required
            />

            {/* Options */}
            <div className="space-y-3 mb-5">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={dailyBrief}
                  onChange={e => setDailyBrief(e.target.checked)}
                  className="w-4 h-4 accent-indigo-500"
                />
                <div>
                  <div className="text-sm text-white font-medium">{t.dailyBriefLabel}</div>
                  <div className="text-xs text-gray-500">{lang === 'he' ? 'סיגנלים מובילים + זעזועים' : 'Top signals + shocks'}</div>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={watchlistAlerts}
                  onChange={e => setWatchlistAlerts(e.target.checked)}
                  className="w-4 h-4 accent-indigo-500"
                />
                <div>
                  <div className="text-sm text-white font-medium">{t.watchlistLabel}</div>
                  <div className="text-xs text-gray-500">{lang === 'he' ? 'כשנושא שלך מתפוצץ' : 'When your topic spikes'}</div>
                </div>
              </label>
            </div>

            {/* Topics */}
            <div className="mb-5">
              <div className="text-xs text-gray-400 mb-2 font-medium">{t.topicsLabel}</div>
              <div className="flex flex-wrap gap-2">
                {PRESET_TOPICS.map(topic => (
                  <button
                    key={topic.key}
                    type="button"
                    onClick={() => toggleTopic(topic.key)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                      selectedTopics.includes(topic.key)
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:border-indigo-500/50'
                    }`}
                  >
                    {lang === 'he' ? topic.he : topic.en}
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {(errorMsg || step === 'error') && (
              <p className="text-red-400 text-xs mb-3">{errorMsg}</p>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={step === 'loading'}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg font-medium text-sm transition"
              >
                {step === 'loading' ? '...' : t.submitBtn}
              </button>
              <button
                type="button"
                onClick={() => setStep('idle')}
                disabled={step === 'loading'}
                className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-400 rounded-lg text-sm transition"
              >
                {t.cancel}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
