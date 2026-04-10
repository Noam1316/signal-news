'use client';

import { useState } from 'react';
import { useLanguage } from '@/i18n/context';
import type { BriefStory } from '@/lib/types';

interface Props {
  story: BriefStory;
}

export default function ShareStoryButton({ story }: Props) {
  const { lang } = useLanguage();
  const [copied, setCopied] = useState(false);

  const headline = typeof story.headline === 'string' ? story.headline : (lang === 'he' ? story.headline.he : story.headline.en);

  const buildText = (origin: string) => lang === 'he'
    ? `📡 זיקוק: "${headline}"\n⚡ סבירות: ${story.likelihood}% | ${story.sources?.length ?? 0} מקורות\n🔗 ${origin}/dashboard`
    : `📡 Zikuk: "${headline}"\n⚡ Likelihood: ${story.likelihood}% | ${story.sources?.length ?? 0} sources\n🔗 ${origin}/dashboard`;

  const handleNativeShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = buildText(window.location.origin);
    if (navigator.share) {
      try { await navigator.share({ title: `Zikuk — ${headline}`, text, url: `${window.location.origin}/dashboard` }); return; }
      catch { /* cancelled */ }
    }
    // Clipboard fallback
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* silent */ }
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = buildText(window.location.origin);
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  };

  return (
    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
      {/* WhatsApp — desktop only (mobile uses native share) */}
      <button
        onClick={handleWhatsApp}
        className="hidden sm:flex items-center justify-center w-6 h-6 rounded-md
                   text-[#25D366] hover:bg-[#25D366]/10 border border-[#25D366]/30
                   hover:border-[#25D366]/60 transition-colors shrink-0"
        title={lang === 'he' ? 'שתף בוואטסאפ' : 'Share on WhatsApp'}
        aria-label="WhatsApp"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </button>

      {/* Native share / copy button */}
      <button
        onClick={handleNativeShare}
        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium
                   border border-gray-700 text-gray-500 hover:text-gray-200 hover:border-gray-500
                   transition-colors shrink-0"
        title={lang === 'he' ? 'שתף סיגנל' : 'Share signal'}
      >
        {copied ? (
          <span className="text-emerald-400">{lang === 'he' ? '✓' : '✓'}</span>
        ) : (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        )}
        <span className="hidden sm:inline">
          {copied ? (lang === 'he' ? 'הועתק' : 'Copied') : (lang === 'he' ? 'שתף' : 'Share')}
        </span>
      </button>
    </div>
  );
}
