'use client';

import { useState } from 'react';
import { useLanguage } from '@/i18n/context';

interface Props {
  likelihood: number;
  className?: string;
}

export default function LikelihoodTooltip({ likelihood, className = '' }: Props) {
  const { lang } = useLanguage();
  const [show, setShow] = useState(false);

  const explanation = lang === 'he'
    ? `ציון הסבירות מחושב מ: מספר מקורות × אמינות המקור × עדכניות × עקביות הנרטיב. ${likelihood}% פירושו שסיגנל מעריך ש${likelihood >= 70 ? 'המידע מגובה חזק ועשוי להתממש' : likelihood >= 45 ? 'המידע סביר אך עדיין לא מגובה מספיק' : 'המידע חלש ודורש אימות נוסף'}.`
    : `Likelihood is computed from: source count × credibility × recency × narrative consistency. ${likelihood}% means Signal estimates this ${likelihood >= 70 ? 'is well-corroborated and likely to develop' : likelihood >= 45 ? 'is plausible but needs more corroboration' : 'is a weak signal requiring further verification'}.`;

  return (
    <span className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setShow(p => !p); }}
        onBlur={() => setShow(false)}
        className="w-3.5 h-3.5 rounded-full border border-gray-600 text-gray-500 hover:border-yellow-400/60 hover:text-yellow-400 transition-colors flex items-center justify-center text-[9px] font-bold leading-none focus:outline-none"
        aria-label={lang === 'he' ? 'הסבר על ציון הסבירות' : 'Likelihood score explanation'}
      >
        ?
      </button>
      {show && (
        <div
          className="absolute bottom-full mb-2 start-1/2 -translate-x-1/2 w-56 z-50
                     bg-gray-900 border border-gray-700 rounded-xl p-3 shadow-2xl
                     text-[11px] text-gray-300 leading-relaxed"
          onClick={e => e.stopPropagation()}
        >
          <div className="font-semibold text-yellow-400 mb-1">
            {lang === 'he' ? 'מה זה ציון הסבירות?' : 'What is the Likelihood Score?'}
          </div>
          {explanation}
          <div className="mt-2 pt-2 border-t border-gray-800 grid grid-cols-3 gap-1 text-[10px]">
            <div className="text-center">
              <div className="text-emerald-400 font-bold">70%+</div>
              <div className="text-gray-500">{lang === 'he' ? 'חזק' : 'Strong'}</div>
            </div>
            <div className="text-center">
              <div className="text-yellow-400 font-bold">45-70%</div>
              <div className="text-gray-500">{lang === 'he' ? 'מתפתח' : 'Developing'}</div>
            </div>
            <div className="text-center">
              <div className="text-red-400 font-bold">&lt;45%</div>
              <div className="text-gray-500">{lang === 'he' ? 'חלש' : 'Weak'}</div>
            </div>
          </div>
          {/* Arrow */}
          <div className="absolute top-full start-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-700" />
        </div>
      )}
    </span>
  );
}
