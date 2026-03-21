'use client';

import { useState } from 'react';
import { useLanguage } from '@/i18n/context';
import { useShockAlerts } from '@/hooks/useShockAlerts';
import ShockToast from '@/components/alerts/ShockToast';
import AlertSettings from '@/components/alerts/AlertSettings';

export default function AlertBell() {
  const { lang } = useLanguage();
  const { toasts, notifPermission, newCount, requestPermission, dismissToast, clearNewCount } =
    useShockAlerts();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const isEnabled = notifPermission === 'granted';
  const isDenied = notifPermission === 'denied';

  const handleClick = () => {
    clearNewCount();
    setSettingsOpen(p => !p);
  };

  const title = isDenied
    ? lang === 'he' ? 'התראות חסומות' : 'Notifications blocked'
    : isEnabled
    ? lang === 'he' ? 'הגדרות התראות' : 'Alert settings'
    : lang === 'he' ? 'הפעל התראות' : 'Enable alerts';

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        onClick={handleClick}
        title={title}
        className={`relative p-1.5 rounded-lg transition-colors
          ${settingsOpen
            ? 'bg-yellow-400/15 text-yellow-400'
            : isEnabled
            ? 'text-yellow-400 hover:bg-yellow-400/10'
            : isDenied
            ? 'text-gray-600'
            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
          }`}
      >
        {/* Bell icon */}
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* New count badge */}
        {newCount > 0 && (
          <span className="absolute -top-1 -end-1 bg-red-500 text-white text-[9px] font-bold
                           min-w-[14px] h-3.5 px-0.5 rounded-full flex items-center justify-center animate-pulse">
            {newCount > 9 ? '9+' : newCount}
          </span>
        )}

        {/* Enabled dot */}
        {isEnabled && newCount === 0 && !settingsOpen && (
          <span className="absolute -top-0.5 -end-0.5 w-2 h-2 bg-yellow-400 rounded-full" />
        )}
      </button>

      {/* Settings panel */}
      {settingsOpen && (
        <AlertSettings
          onClose={() => setSettingsOpen(false)}
          onRequestPermission={requestPermission}
          notifPermission={notifPermission}
        />
      )}

      {/* Toast stack — fixed bottom-right */}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 end-6 z-[200] flex flex-col gap-3 items-end pointer-events-none">
          {toasts.map(toast => (
            <div key={toast.id} className="pointer-events-auto">
              <ShockToast toast={toast} onDismiss={dismissToast} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
