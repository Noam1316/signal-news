'use client';

import { useLanguage } from '@/i18n/context';
import { getUpcomingEvents, daysUntil, CATEGORY_META, type GeoEvent } from '@/services/geo-calendar';

function DaysChip({ days }: { days: number }) {
  const urgent = days <= 7;
  const soon = days <= 21;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold font-mono
      ${urgent ? 'bg-red-500/15 text-red-400 border border-red-500/25'
        : soon ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
        : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>
      {days === 0 ? '⚡ היום' : days === 1 ? '⚡ מחר' : `${days}d`}
    </span>
  );
}

function EventCard({ event, lang }: { event: GeoEvent; lang: string }) {
  const days = daysUntil(event.date);
  const meta = CATEGORY_META[event.category];
  const importanceColor = event.importance === 'critical' ? 'border-red-500/30' : event.importance === 'high' ? 'border-amber-500/20' : 'border-gray-800';

  const dateLabel = event.dateApprox
    ? (lang === 'he' ? 'בערך' : '~') + ' ' + new Date(event.date).toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-US', { month: 'long', year: 'numeric' })
    : new Date(event.date).toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className={`p-3 rounded-xl bg-gray-900/60 border ${importanceColor} space-y-2 hover:border-gray-700 transition-colors`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-sm shrink-0">{meta.icon}</span>
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${meta.color}`}>
            {lang === 'he' ? meta.he : meta.en}
          </span>
          {event.importance === 'critical' && (
            <span className="text-[10px] font-bold text-red-400">⚠</span>
          )}
        </div>
        <DaysChip days={days} />
      </div>

      <div>
        <h4 className="text-sm font-bold text-white leading-snug">
          {lang === 'he' ? event.titleHe : event.titleEn}
        </h4>
        <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">
          {lang === 'he' ? event.descHe : event.descEn}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[10px] text-gray-600">{dateLabel}</span>
        <span className="text-[10px] text-gray-600">{event.region}</span>
      </div>
    </div>
  );
}

export default function GeoCalendar() {
  const { lang, dir } = useLanguage();
  const events = getUpcomingEvents({ limit: 12, daysAhead: 180 });
  const critical = events.filter(e => e.importance === 'critical');
  const rest = events.filter(e => e.importance !== 'critical');

  return (
    <div dir={dir} className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <span>📅</span>
          {lang === 'he' ? 'לוח גיאופוליטי — 6 חודשים קדימה' : 'Geopolitical Calendar — 6 Months Ahead'}
        </h3>
        <span className="text-[10px] text-gray-600">
          {events.length} {lang === 'he' ? 'אירועים' : 'events'}
        </span>
      </div>

      {/* Critical events */}
      {critical.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-red-400">
              ⚠ {lang === 'he' ? 'קריטי' : 'Critical'}
            </span>
            <div className="flex-1 h-px bg-red-500/20" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {critical.map(e => <EventCard key={e.id} event={e} lang={lang} />)}
          </div>
        </div>
      )}

      {/* Other events */}
      {rest.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
              {lang === 'he' ? 'אירועים קרובים' : 'Upcoming Events'}
            </span>
            <div className="flex-1 h-px bg-gray-800" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {rest.map(e => <EventCard key={e.id} event={e} lang={lang} />)}
          </div>
        </div>
      )}

      {events.length === 0 && (
        <div className="text-center py-8 text-gray-500 text-sm">
          {lang === 'he' ? 'אין אירועים קרובים' : 'No upcoming events'}
        </div>
      )}

      <p className="text-[10px] text-gray-700 text-center">
        {lang === 'he' ? '* תאריכים משוערים מסומנים ב-~' : '* Approximate dates marked with ~'}
      </p>
    </div>
  );
}
