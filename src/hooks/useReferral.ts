'use client';

import { useCallback, useEffect, useState } from 'react';

const REF_CODE_KEY = 'signal_ref_code';
const REF_COUNT_KEY = 'signal_ref_count';
const REF_SOURCE_KEY = 'signal_ref_source'; // the code that brought this user

function generateCode(length = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

/**
 * Referral system — generates unique share codes, tracks incoming referrals.
 * All stored in localStorage (no backend needed for MVP).
 */
export function useReferral() {
  const [myCode, setMyCode] = useState('');
  const [referralCount, setReferralCount] = useState(0);
  const [sourceCode, setSourceCode] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check URL for incoming referral code
    const params = new URLSearchParams(window.location.search);
    const incomingRef = params.get('ref');
    if (incomingRef) {
      localStorage.setItem(REF_SOURCE_KEY, incomingRef);
      // Clean URL
      const url = new URL(window.location.href);
      url.searchParams.delete('ref');
      window.history.replaceState({}, '', url.toString());
    }

    // Load or create my code
    let code = localStorage.getItem(REF_CODE_KEY);
    if (!code) {
      code = generateCode();
      localStorage.setItem(REF_CODE_KEY, code);
    }
    setMyCode(code);

    // Load referral count
    const count = parseInt(localStorage.getItem(REF_COUNT_KEY) || '0', 10);
    setReferralCount(count);

    // Load source
    setSourceCode(localStorage.getItem(REF_SOURCE_KEY));
  }, []);

  const incrementReferralCount = useCallback(() => {
    const current = parseInt(localStorage.getItem(REF_COUNT_KEY) || '0', 10);
    const next = current + 1;
    localStorage.setItem(REF_COUNT_KEY, String(next));
    setReferralCount(next);
  }, []);

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?ref=${myCode}`
    : `/?ref=${myCode}`;

  const shareText = `🧠 Signal News — תקציר מודיעיני יומי מ-28 מקורות חדשותיים\nכלי חינמי שמראה לך מה באמת קורה, בלי הטיה\n${shareUrl}`;

  const copyShareLink = useCallback(async (): Promise<boolean> => {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Signal News', text: shareText, url: shareUrl });
        return true;
      }
      await navigator.clipboard.writeText(shareUrl);
      return true;
    } catch {
      return false;
    }
  }, [shareUrl, shareText]);

  // Pro unlock: 5+ referrals = Pro for free (tracked locally)
  const hasProUnlock = referralCount >= 5;
  const nextMilestone = referralCount >= 5 ? null : referralCount >= 3 ? 5 : 3;

  return {
    myCode,
    referralCount,
    sourceCode,
    shareUrl,
    shareText,
    copyShareLink,
    incrementReferralCount,
    hasProUnlock,
    nextMilestone,
  };
}
