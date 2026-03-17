'use client';

import { useLanguage } from '@/i18n/context';

interface LensSwitcherProps {
  value: 'all' | 'israel' | 'world';
  onChange: (v: 'all' | 'israel' | 'world') => void;
}

export default function LensSwitcher({ value, onChange }: LensSwitcherProps) {
  const { ui } = useLanguage();

  const options: Array<'all' | 'israel' | 'world'> = ['all', 'israel', 'world'];

  return (
    <div className="inline-flex rounded-lg bg-gray-800 p-0.5">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
            value === opt
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          {ui(opt)}
        </button>
      ))}
    </div>
  );
}
