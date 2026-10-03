// LocalTunes Centralized Settings Service
// Manages theme (Light / Dark / System), accent colors, playback behaviors, layout density, and persistence.

const SETTINGS_STORAGE_KEY = 'localtunes_settings';

export const ACCENT_COLORS = [
  { id: 'cyan', name: 'Cyan', hex: '#06b6d4', glow: 'rgba(6, 182, 212, 0.4)' },
  { id: 'purple', name: 'Purple', hex: '#a855f7', glow: 'rgba(168, 85, 247, 0.4)' },
  { id: 'emerald', name: 'Emerald', hex: '#10b981', glow: 'rgba(168, 85, 129, 0.4)' },
  { id: 'rose', name: 'Rose', hex: '#f43f5e', glow: 'rgba(244, 63, 94, 0.4)' },
  { id: 'amber', name: 'Amber', hex: '#f59e0b', glow: 'rgba(245, 158, 11, 0.4)' },
  { id: 'blue', name: 'Blue', hex: '#3b82f6', glow: 'rgba(59, 130, 246, 0.4)' },
];

export const DEFAULT_SETTINGS = {
  // Appearance
  theme: 'system', // 'light' | 'dark' | 'system'
  accentColor: 'cyan', // 'cyan' | 'purple' | 'emerald' | 'rose' | 'amber' | 'blue'
  layout: 'comfortable', // 'comfortable' | 'compact'
  showArtwork: true, // boolean

  // Playback
  autoplay: true, // boolean
  shuffle: false, // boolean
  repeat: 'off', // 'off' | 'all' | 'one'
  rememberLastTrack: true, // boolean
  rememberPlaybackPosition: true, // boolean

  // Player
  showMiniProgressBar: true, // boolean
  showRemainingTime: false, // boolean
  enableMediaSession: true, // boolean

  // Library
  defaultLibrarySort: 'dateAdded', // 'dateAdded' | 'title' | 'artist' | 'album' | 'duration'
};

class SettingsService {
  constructor() {
    this.settings = this.loadSettings();
    this.listeners = new Map();
    this.mediaQuery = null;

    if (typeof window !== 'undefined') {
      this.initSystemThemeListener();
      this.applyAll();
    }
  }

  // --- PUB / SUB SYSTEM ---
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.listeners.get(event).delete(callback);
  }

  emit(event, payload) {
    if (this.listeners.has(event)) {
      for (const cb of this.listeners.get(event)) {
        try {
          cb(payload);
        } catch (e) {
          console.error(`Error in settings listener for ${event}:`, e);
        }
      }
    }
  }

  // --- STORAGE & GETTERS/SETTERS ---
  loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (e) {
      console.warn('Failed to parse settings from localStorage:', e);
    }
    return { ...DEFAULT_SETTINGS };
  }

  saveSettings() {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.settings));
    } catch (e) {
      console.warn('Failed to save settings to localStorage:', e);
    }
  }

  get(key) {
    return this.settings[key] !== undefined ? this.settings[key] : DEFAULT_SETTINGS[key];
  }

  getAll() {
    return { ...this.settings };
  }

  set(key, value) {
    const oldValue = this.settings[key];
    if (oldValue === value) return;

    this.settings[key] = value;
    this.saveSettings();

    // Side-effects for appearance
    if (key === 'theme') {
      this.applyTheme();
    } else if (key === 'accentColor') {
      this.applyAccentColor();
    } else if (key === 'layout' || key === 'showArtwork') {
      this.applyLayout();
    }

    this.emit('change', { key, value, oldValue, settings: { ...this.settings } });
    this.emit(`change:${key}`, value);
  }

  update(partial) {
    let appearanceChanged = false;
    for (const [key, value] of Object.entries(partial)) {
      this.settings[key] = value;
      if (['theme', 'accentColor', 'layout', 'showArtwork'].includes(key)) {
        appearanceChanged = true;
      }
    }
    this.saveSettings();
    if (appearanceChanged) {
      this.applyAll();
    }
    this.emit('change', { partial, settings: { ...this.settings } });
  }

  reset() {
    this.settings = { ...DEFAULT_SETTINGS };
    try {
      localStorage.removeItem(SETTINGS_STORAGE_KEY);
    } catch (e) {}
    this.saveSettings();
    this.applyAll();
    this.emit('reset', { ...this.settings });
    this.emit('change', { key: 'all', settings: { ...this.settings } });
  }

  // --- THEME & APPEARANCE SYSTEM ---
  initSystemThemeListener() {
    if (window.matchMedia) {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e) => {
        if (this.settings.theme === 'system') {
          this.applyTheme();
          this.emit('systemThemeChange', e.matches ? 'dark' : 'light');
        }
      };

      if (this.mediaQuery.addEventListener) {
        this.mediaQuery.addEventListener('change', handler);
      } else if (this.mediaQuery.addListener) {
        this.mediaQuery.addListener(handler);
      }
    }
  }

  getEffectiveTheme() {
    if (this.settings.theme === 'light') return 'light';
    if (this.settings.theme === 'dark') return 'dark';

    // System mode: inspect prefers-color-scheme
    if (this.mediaQuery) {
      return this.mediaQuery.matches ? 'dark' : 'light';
    }
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  }

  applyTheme() {
    if (typeof document === 'undefined') return;

    const effective = this.getEffectiveTheme();
    const isDark = effective === 'dark';

    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.setAttribute('data-theme', effective);

    // Update meta theme-color tag to match browser header bar
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', isDark ? '#0a0d14' : '#f8fafc');
    }
  }

  applyAccentColor() {
    if (typeof document === 'undefined') return;
    const accent = this.settings.accentColor || 'cyan';
    document.documentElement.setAttribute('data-accent', accent);
  }

  applyLayout() {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('layout-compact', this.settings.layout === 'compact');
    document.documentElement.classList.toggle('hide-artwork', !this.settings.showArtwork);
  }

  applyAll() {
    this.applyTheme();
    this.applyAccentColor();
    this.applyLayout();
  }
}

export const settingsService = new SettingsService();
