'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

export type AlertProfile = 'all' | 'critical' | 'geo' | 'market';
export type TopicPreference = 'middle-east' | 'ukraine' | 'us-politics' | 'iran' | 'china' | 'energy' | 'tech';

export interface DashboardPreferences {
  topics: TopicPreference[];           // empty = show all
  hiddenSections: string[];            // section IDs to collapse
  alertProfile: AlertProfile;
  compactMode: boolean;                // denser card layout
}

const DEFAULT: DashboardPreferences = {
  topics: [],
  hiddenSections: [],
  alertProfile: 'all',
  compactMode: false,
};

interface PreferencesContextValue {
  prefs: DashboardPreferences;
  setTopics: (t: TopicPreference[]) => void;
  toggleSection: (id: string) => void;
  setAlertProfile: (p: AlertProfile) => void;
  toggleCompact: () => void;
  resetPrefs: () => void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<DashboardPreferences>(DEFAULT);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('signal-prefs');
      if (saved) setPrefs({ ...DEFAULT, ...JSON.parse(saved) });
    } catch { /* ignore */ }
  }, []);

  const save = useCallback((next: DashboardPreferences) => {
    setPrefs(next);
    localStorage.setItem('signal-prefs', JSON.stringify(next));
  }, []);

  return (
    <PreferencesContext.Provider value={{
      prefs,
      setTopics: (topics) => save({ ...prefs, topics }),
      toggleSection: (id) => save({
        ...prefs,
        hiddenSections: prefs.hiddenSections.includes(id)
          ? prefs.hiddenSections.filter(s => s !== id)
          : [...prefs.hiddenSections, id],
      }),
      setAlertProfile: (alertProfile) => save({ ...prefs, alertProfile }),
      toggleCompact: () => save({ ...prefs, compactMode: !prefs.compactMode }),
      resetPrefs: () => save(DEFAULT),
    }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used within PreferencesProvider');
  return ctx;
}
