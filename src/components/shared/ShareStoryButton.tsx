'use client';

import { useLanguage } from '@/i18n/context';
import type { BriefStory } from '@/lib/types';

interface Props {
  story: BriefStory;
}

export default function ShareStoryButton({ story }: Props) {
  const { lang } = useLanguage();

  const headline = lang === 'he' ? story.headline.he : story.headline.en;

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const shareText = lang === 'he'
      ? `📡 Zikuk: "${headline}"\n⚡ סבירות: ${story.likelihood}% | ${story.sources?.length ?? 0} מקורות\n🔗 ${window.location.origin}/dashboard`
      : `📡 Zikuk: "${headline}"\n⚡ Likelihood: ${story.likelihood}% | ${story.sources?.length ?? 0} sources\n🔗 ${window.location.origin}/dashboard`;

    // Use Web Share API on mobile
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Zikuk — ${headline}`,
          text: shareText,
          url: `${window.location.origin}/dashboard`,
        });
        return;
      } catch { /* user cancelled */ }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(shareText);
      // Show brief "Copied!" feedback
      const btn = document.getElementById(`share-story-btn-${story.slug}`);
      if (btn) {
        const orig = btn.textContent;
        btn.textContent = lang === 'he' ? '✓ הועתק' : '✓ Copied';
        setTimeout(() => { if (btn) btn.textContent = orig; }, 2000);
      }
    } catch { /* silent */ }
  };

  return (
    <button
      id={`share-story-btn-${story.slug}`}
      onClick={handleShare}
      className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium
                 border border-gray-700 text-gray-500 hover:text-gray-200 hover:border-gray-500
                 transition-colors shrink-0"
      title={lang === 'he' ? 'שתף סיגנל' : 'Share signal'}
      aria-label={lang === 'he' ? 'שתף סיגנל' : 'Share signal'}
    >
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
      <span className="hidden sm:inline">{lang === 'he' ? 'שתף' : 'Share'}</span>
    </button>
  );
}
