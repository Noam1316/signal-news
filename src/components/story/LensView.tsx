'use client';

import { LensViewData } from '@/lib/types';
import { useLanguage } from '@/i18n/context';
import SourceList from '@/components/shared/SourceList';

interface LensViewProps {
  lensView: LensViewData;
}

export default function LensView({ lensView }: LensViewProps) {
  const { ui, t } = useLanguage();

  const columns = [
    {
      key: 'israelMainstream' as const,
      label: ui('israelMainstream'),
      data: lensView.israelMainstream,
      accent: 'border-blue-500/30',
    },
    {
      key: 'israelPartisan' as const,
      label: ui('israelPartisan'),
      data: lensView.israelPartisan,
      accent: 'border-amber-500/30',
    },
    {
      key: 'international' as const,
      label: ui('international'),
      data: lensView.international,
      accent: 'border-emerald-500/30',
    },
  ];

  return (
    <div>
      <h3 className="uppercase tracking-wider text-xs text-gray-500 mb-3">
        {ui('lensView')}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
        {columns.map((col, i) => (
          <div
            key={col.key}
            className={`p-4 ${
              i < columns.length - 1 ? 'md:border-e border-b md:border-b-0 border-gray-800' : ''
            }`}
          >
            <div className={`border-s-2 ${col.accent} ps-3`}>
              <h4 className="text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wide">
                {col.label}
              </h4>
              <p className="text-sm text-gray-200 mb-3">
                {t(col.data.emphasis)}
              </p>
              <SourceList sources={col.data.sources} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
