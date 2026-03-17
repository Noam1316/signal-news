'use client';

import { useState, useCallback } from 'react';

interface ShareButtonProps {
  title: string;
  text: string;
}

export default function ShareButton({ title, text }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleClick = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();

      const shareData = { title, text };

      if (typeof navigator !== 'undefined' && navigator.share) {
        try {
          await navigator.share(shareData);
          return;
        } catch {
          // User cancelled or API unavailable, fall through to clipboard
        }
      }

      try {
        await navigator.clipboard.writeText(`${title}\n${text}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // clipboard not available
      }
    },
    [title, text],
  );

  return (
    <div className="relative inline-flex">
      <button
        onClick={handleClick}
        className="p-1.5 rounded-md text-gray-400 hover:text-gray-200 hover:bg-gray-700 transition-colors"
        aria-label="Share"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
      </button>
      {copied && (
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-700 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
          Copied!
        </span>
      )}
    </div>
  );
}
