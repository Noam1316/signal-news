'use client';

import { useLanguage } from '@/i18n/context';

interface SignalLabelProps {
  isSignal: boolean;
}

export default function SignalLabel({ isSignal }: SignalLabelProps) {
  const { ui } = useLanguage();

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${
        isSignal ? 'text-green-400' : 'text-gray-500'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isSignal ? 'bg-green-400' : 'bg-gray-600'
        }`}
      />
      {isSignal ? ui('signal') : ui('noise')}
    </span>
  );
}
