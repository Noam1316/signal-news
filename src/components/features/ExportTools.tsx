'use client';

import { useState } from 'react';
import { useLanguage } from '@/i18n/context';

export default function ExportTools() {
  const { lang } = useLanguage();
  const [exporting, setExporting] = useState<string | null>(null);
  const [lastExport, setLastExport] = useState<string | null>(null);

  const exportCSV = async (endpoint: string, filename: string) => {
    setExporting(filename);
    try {
      const res = await fetch(endpoint);
      const data = await res.json();

      let rows: string[][] = [];
      let headers: string[] = [];

      // Flatten data based on endpoint
      if (Array.isArray(data)) {
        if (data.length > 0) {
          headers = Object.keys(data[0]);
          rows = data.map(item => headers.map(h => {
            const val = item[h];
            return typeof val === 'object' ? JSON.stringify(val) : String(val ?? '');
          }));
        }
      } else if (data.stories || data.matches || data.shocks || data.agents) {
        const arr = data.stories || data.matches || data.shocks || data.agents || [];
        if (arr.length > 0) {
          headers = Object.keys(arr[0]);
          rows = arr.map((item: any) => headers.map(h => {
            const val = item[h];
            return typeof val === 'object' ? JSON.stringify(val) : String(val ?? '');
          }));
        }
      }

      if (headers.length === 0) {
        headers = Object.keys(data);
        rows = [headers.map(h => String(data[h] ?? ''))];
      }

      const csv = [
        headers.join(','),
        ...rows.map(r => r.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      setLastExport(filename);
    } catch (err) {
      console.error('Export error:', err);
    }
    setExporting(null);
  };

  const exportJSON = async (endpoint: string, filename: string) => {
    setExporting(filename);
    try {
      const res = await fetch(endpoint);
      const data = await res.json();

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      setLastExport(filename);
    } catch (err) {
      console.error('Export error:', err);
    }
    setExporting(null);
  };

  const exports = [
    { name: 'Brief Stories', endpoint: '/api/stories', icon: '📋' },
    { name: 'Shocks', endpoint: '/api/shocks', icon: '⚡' },
    { name: 'Entities', endpoint: '/api/entities', icon: '🕸️' },
    { name: 'Polymarket', endpoint: '/api/polymarket', icon: '📈' },
    { name: 'Media Bias', endpoint: '/api/bias', icon: '🏛️' },
    { name: 'RSS Articles', endpoint: '/api/rss/latest', icon: '📰' },
    { name: 'Demo Agents', endpoint: '/api/agents?view=full', icon: '👥' },
  ];

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-gray-900 border border-gray-800">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          📄 {lang === 'he' ? 'ייצוא נתונים' : 'Export Data'}
        </h3>
        <p className="text-[10px] text-gray-500 mt-1">
          {lang === 'he' ? 'ייצוא לקובצי CSV או JSON' : 'Export to CSV or JSON files'}
        </p>
      </div>

      <div className="space-y-2">
        {exports.map(exp => (
          <div key={exp.name} className="flex items-center gap-3 p-3 rounded-xl bg-gray-900 border border-gray-800">
            <span className="text-lg">{exp.icon}</span>
            <span className="flex-1 text-sm text-white">{exp.name}</span>
            <button
              onClick={() => exportCSV(exp.endpoint, exp.name.toLowerCase().replace(/\s/g, '-'))}
              disabled={exporting === exp.name.toLowerCase().replace(/\s/g, '-')}
              className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25 transition-colors disabled:opacity-40"
            >
              {exporting === exp.name.toLowerCase().replace(/\s/g, '-') ? '...' : 'CSV'}
            </button>
            <button
              onClick={() => exportJSON(exp.endpoint, exp.name.toLowerCase().replace(/\s/g, '-'))}
              disabled={exporting === exp.name.toLowerCase().replace(/\s/g, '-')}
              className="text-xs px-3 py-1.5 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/20 hover:bg-blue-500/25 transition-colors disabled:opacity-40"
            >
              JSON
            </button>
          </div>
        ))}
      </div>

      {lastExport && (
        <p className="text-[10px] text-emerald-400 text-center">
          ✓ {lastExport} {lang === 'he' ? 'יוצא בהצלחה' : 'exported successfully'}
        </p>
      )}
    </div>
  );
}
