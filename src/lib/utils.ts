import { Confidence, Language, LocalizedText } from './types';

export function t(text: LocalizedText, lang: Language): string {
  return text[lang];
}

export function confidenceColor(c: Confidence): string {
  switch (c) {
    case 'high': return 'text-red-400';
    case 'medium': return 'text-amber-400';
    case 'low': return 'text-blue-400';
  }
}

export function confidenceBg(c: Confidence): string {
  switch (c) {
    case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'medium': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'low': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  }
}

export function likelihoodColor(value: number): string {
  if (value >= 70) return '#ef4444';
  if (value >= 40) return '#f59e0b';
  return '#3b82f6';
}

export function formatDate(date: string, lang: Language): string {
  const d = new Date(date);
  return d.toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTime(date: string, lang: Language): string {
  const d = new Date(date);
  return d.toLocaleTimeString(lang === 'he' ? 'he-IL' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(date: string, lang: Language): string {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);

  if (lang === 'he') {
    if (minutes < 60) return `לפני ${minutes} דקות`;
    if (hours < 24) return `לפני ${hours} שעות`;
    return `לפני ${Math.floor(hours / 24)} ימים`;
  }
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
