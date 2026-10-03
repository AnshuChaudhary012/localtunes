// LocalTunes Settings Page
import { settingsService, ACCENT_COLORS } from '../services/settingsService.js';
import { player } from '../services/player.js';
import { icons } from '../utils/icons.js';
import { toast } from '../components/Toast.js';
import { modal } from '../components/Modal.js';
import {
  getStorageUsage,
  getAllTracks,
  clearRecentlyPlayed,
  clearAllFavorites
} from '../services/musicStorage.js';

export async function renderSettingsPage(container, { onNavigate }) {
  const settings = settingsService.getAll();
  const effectiveTheme = settingsService.getEffectiveTheme();
  let storageInfo = await getStorageUsage();
  let allTracks = await getAllTracks();

  function buildHtml() {
    return `
      <div class="space-y-8 pb-20 max-w-4xl mx-auto">
        <!-- Page Header -->
        <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-dark-border/60">
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <span class="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-glow">
                ${icons.settings('w-6 h-6')}
              </span>
              <span>Settings</span>
            </h1>
            <p class="text-xs sm:text-sm text-slate-400 mt-1">
              Personalize your listening experience, interface theme, audio behavior, and storage.
            </p>
          </div>

          <div class="flex items-center gap-2">
            <button id="settings-reset-btn" class="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold border border-white/5 transition-all flex items-center gap-1.5 focus:outline-none">
              ${icons.refresh('w-3.5 h-3.5')}
              <span>Reset Defaults</span>
            </button>
          </div>
        </header>

        <!-- SECTION 1: APPEARANCE -->
        <section class="space-y-4">
          <div class="flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-slate-400">
            ${icons.palette('w-4 h-4 text-cyan-400')}
            <span>Appearance & Themes</span>
          </div>

          <div class="p-5 rounded-2xl bg-dark-card/60 border border-dark-border/60 space-y-6">
            <!-- Theme Selection (Light / Dark / System) -->
            <div>
              <div class="flex items-center justify-between mb-3">
                <div>
                  <h3 class="text-sm font-semibold text-white">Interface Theme</h3>
                  <p class="text-xs text-slate-400">Choose your preferred appearance or sync with your device OS</p>
                </div>
                <span class="text-[11px] font-mono px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Active: ${effectiveTheme.toUpperCase()}
                </span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3" id="theme-selector-group">
                <!-- System Option -->
                <button
                  type="button"
                  data-theme-val="system"
                  class="theme-card relative p-4 rounded-xl border text-left transition-all focus:outline-none flex flex-col justify-between gap-3 ${
                    settings.theme === 'system'
                      ? 'bg-cyan-500/10 border-cyan-500/40 shadow-glow'
                      : 'bg-dark-bg/60 border-dark-border hover:border-slate-700'
                  }"
                >
                  <div class="flex items-center justify-between">
                    <div class="p-2 rounded-lg bg-white/5 text-slate-300">
                      ${icons.monitor('w-5 h-5')}
                    </div>
                    ${
                      settings.theme === 'system'
                        ? `<span class="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center text-xs font-bold">${icons.check('w-3.5 h-3.5')}</span>`
                        : ''
                    }
                  </div>
                  <div>
                    <div class="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>System</span>
                    </div>
                    <p class="text-[11px] text-slate-400 mt-0.5">Automatically follows iOS/macOS/Windows mode</p>
                  </div>
                </button>

                <!-- Dark Option -->
                <button
                  type="button"
                  data-theme-val="dark"
                  class="theme-card relative p-4 rounded-xl border text-left transition-all focus:outline-none flex flex-col justify-between gap-3 ${
                    settings.theme === 'dark'
                      ? 'bg-cyan-500/10 border-cyan-500/40 shadow-glow'
                      : 'bg-dark-bg/60 border-dark-border hover:border-slate-700'
                  }"
                >
                  <div class="flex items-center justify-between">
                    <div class="p-2 rounded-lg bg-white/5 text-slate-300">
                      ${icons.moon('w-5 h-5')}
                    </div>
                    ${
                      settings.theme === 'dark'
                        ? `<span class="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center text-xs font-bold">${icons.check('w-3.5 h-3.5')}</span>`
                        : ''
                    }
                  </div>
                  <div>
                    <div class="text-sm font-bold text-white">Dark</div>
                    <p class="text-[11px] text-slate-400 mt-0.5">Deep charcoal with subtle neon glows</p>
                  </div>
                </button>

                <!-- Light Option -->
                <button
                  type="button"
                  data-theme-val="light"
                  class="theme-card relative p-4 rounded-xl border text-left transition-all focus:outline-none flex flex-col justify-between gap-3 ${
                    settings.theme === 'light'
                      ? 'bg-cyan-500/10 border-cyan-500/40 shadow-glow'
                      : 'bg-dark-bg/60 border-dark-border hover:border-slate-700'
                  }"
                >
                  <div class="flex items-center justify-between">
                    <div class="p-2 rounded-lg bg-white/5 text-slate-300">
                      ${icons.sun('w-5 h-5')}
                    </div>
                    ${
                      settings.theme === 'light'
                        ? `<span class="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center text-xs font-bold">${icons.check('w-3.5 h-3.5')}</span>`
                        : ''
                    }
                  </div>
                  <div>
                    <div class="text-sm font-bold text-white">Light</div>
                    <p class="text-[11px] text-slate-400 mt-0.5">Crisp, clean high-contrast daylight</p>
                  </div>
                </button>
              </div>
            </div>

            <!-- Accent Color Selection -->
            <div class="pt-4 border-t border-dark-border/40">
              <div class="mb-3">
                <h3 class="text-sm font-semibold text-white">Accent Palette</h3>
                <p class="text-xs text-slate-400">Customizes sliders, glowing playback progress, and active controls</p>
              </div>

              <div class="grid grid-cols-2 sm:grid-cols-6 gap-2.5" id="accent-selector-group">
                ${ACCENT_COLORS.map(
                  (col) => `
                  <button
                    type="button"
                    data-accent-val="${col.id}"
                    class="accent-pill p-2.5 rounded-xl border transition-all flex items-center gap-2.5 text-left focus:outline-none ${
                      settings.accentColor === col.id
                        ? 'border-white/40 bg-white/10 shadow-sm'
                        : 'border-dark-border/60 bg-dark-bg/40 hover:bg-white/5'
                    }"
                  >
                    <span class="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center shadow-md" style="background-color: ${col.hex};">
                      ${settings.accentColor === col.id ? `<svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>` : ''}
                    </span>
                    <span class="text-xs font-medium text-slate-200 truncate">${col.name}</span>
                  </button>
                `
                ).join('')}
              </div>
            </div>

            <!-- Layout Density & Artwork Toggles -->
            <div class="pt-4 border-t border-dark-border/40 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Layout Density -->
              <div class="p-3.5 rounded-xl bg-dark-bg/40 border border-dark-border/60 flex items-center justify-between">
                <div>
                  <h4 class="text-xs font-semibold text-white">Layout Density</h4>
                  <p class="text-[11px] text-slate-400">Compact or spacious rows</p>
                </div>
                <div class="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/5" id="layout-toggle-group">
                  <button
                    type="button"
                    data-layout-val="comfortable"
                    class="px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                      settings.layout === 'comfortable'
                        ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }"
                  >
                    Comfortable
                  </button>
                  <button
                    type="button"
                    data-layout-val="compact"
                    class="px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                      settings.layout === 'compact'
                        ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }"
                  >
                    Compact
                  </button>
                </div>
              </div>

              <!-- Show Artwork Toggle -->
              <div class="p-3.5 rounded-xl bg-dark-bg/40 border border-dark-border/60 flex items-center justify-between">
                <div>
                  <h4 class="text-xs font-semibold text-white">Show Artwork</h4>
                  <p class="text-[11px] text-slate-400">Thumbnails in song lists</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" id="setting-toggle-artwork" class="sr-only peer" ${
                    settings.showArtwork ? 'checked' : ''
                  }>
                  <div class="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>
            </div>
          </div>
        </section>

        <!-- SECTION 2: PLAYBACK BEHAVIOR -->
        <section class="space-y-4">
          <div class="flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-slate-400">
            ${icons.play('w-4 h-4 text-cyan-400')}
            <span>Playback Engine</span>
          </div>

          <div class="p-5 rounded-2xl bg-dark-card/60 border border-dark-border/60 space-y-4">
            <!-- Autoplay Next Track -->
            <div class="flex items-center justify-between py-1">
              <div class="pr-4">
                <h3 class="text-sm font-semibold text-white">Autoplay Next Song</h3>
                <p class="text-xs text-slate-400">Automatically start the next song when current track finishes</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input type="checkbox" id="setting-toggle-autoplay" class="sr-only peer" ${
                  settings.autoplay ? 'checked' : ''
                }>
                <div class="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
              </label>
            </div>

            <!-- Remember Last Played Song -->
            <div class="pt-3 border-t border-dark-border/40 flex items-center justify-between py-1">
              <div class="pr-4">
                <h3 class="text-sm font-semibold text-white">Remember Active Song</h3>
                <p class="text-xs text-slate-400">Restore last active track and queue when opening the web player</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input type="checkbox" id="setting-toggle-remember-track" class="sr-only peer" ${
                  settings.rememberLastTrack ? 'checked' : ''
                }>
                <div class="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
              </label>
            </div>

            <!-- Remember Playback Position -->
            <div class="pt-3 border-t border-dark-border/40 flex items-center justify-between py-1">
              <div class="pr-4">
                <h3 class="text-sm font-semibold text-white">Remember Playback Timestamp</h3>
                <p class="text-xs text-slate-400">Resume paused tracks from where you left off</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input type="checkbox" id="setting-toggle-remember-pos" class="sr-only peer" ${
                  settings.rememberPlaybackPosition ? 'checked' : ''
                }>
                <div class="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
              </label>
            </div>
          </div>
        </section>

        <!-- SECTION 3: PLAYER & LOCK SCREEN -->
        <section class="space-y-4">
          <div class="flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-slate-400">
            ${icons.sliders('w-4 h-4 text-cyan-400')}
            <span>Player & Lock-Screen Controls</span>
          </div>

          <div class="p-5 rounded-2xl bg-dark-card/60 border border-dark-border/60 space-y-4">
            <!-- Media Session API / Lock Screen Widget -->
            <div class="flex items-center justify-between py-1">
              <div class="pr-4">
                <h3 class="text-sm font-semibold text-white">Lock-Screen & Headphone Controls</h3>
                <p class="text-xs text-slate-400">Enable Media Session API for iPhone lock-screen, Apple Watch, and AirPods</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input type="checkbox" id="setting-toggle-mediasession" class="sr-only peer" ${
                  settings.enableMediaSession ? 'checked' : ''
                }>
                <div class="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
              </label>
            </div>

            <!-- Show Remaining Countdown Time -->
            <div class="pt-3 border-t border-dark-border/40 flex items-center justify-between py-1">
              <div class="pr-4">
                <h3 class="text-sm font-semibold text-white">Show Remaining Time</h3>
                <p class="text-xs text-slate-400">Display remaining countdown (-02:45) instead of total track length</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input type="checkbox" id="setting-toggle-remaining-time" class="sr-only peer" ${
                  settings.showRemainingTime ? 'checked' : ''
                }>
                <div class="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
              </label>
            </div>

            <!-- Mini Player Progress Bar -->
            <div class="pt-3 border-t border-dark-border/40 flex items-center justify-between py-1">
              <div class="pr-4">
                <h3 class="text-sm font-semibold text-white">Mini Player Progress Indicator</h3>
                <p class="text-xs text-slate-400">Display top slim progress line on the bottom mini player</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input type="checkbox" id="setting-toggle-mini-bar" class="sr-only peer" ${
                  settings.showMiniProgressBar ? 'checked' : ''
                }>
                <div class="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
              </label>
            </div>
          </div>
        </section>

        <!-- SECTION 4: LIBRARY & SORTING -->
        <section class="space-y-4">
          <div class="flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-slate-400">
            ${icons.library('w-4 h-4 text-cyan-400')}
            <span>Library Defaults</span>
          </div>

          <div class="p-5 rounded-2xl bg-dark-card/60 border border-dark-border/60">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 class="text-sm font-semibold text-white">Default Library Sort Order</h3>
                <p class="text-xs text-slate-400">Choose how songs are ordered when browsing your library</p>
              </div>

              <select id="setting-library-sort" class="px-3.5 py-2 rounded-xl bg-dark-bg border border-dark-border text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer">
                <option value="dateAdded" ${settings.defaultLibrarySort === 'dateAdded' ? 'selected' : ''}>Recently Added</option>
                <option value="title" ${settings.defaultLibrarySort === 'title' ? 'selected' : ''}>Song Title (A-Z)</option>
                <option value="artist" ${settings.defaultLibrarySort === 'artist' ? 'selected' : ''}>Artist Name (A-Z)</option>
                <option value="album" ${settings.defaultLibrarySort === 'album' ? 'selected' : ''}>Album Name (A-Z)</option>
                <option value="duration" ${settings.defaultLibrarySort === 'duration' ? 'selected' : ''}>Duration</option>
              </select>
            </div>
          </div>
        </section>

        <!-- SECTION 5: DATA & STORAGE MANAGEMENT -->
        <section class="space-y-4">
          <div class="flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-slate-400">
            ${icons.database('w-4 h-4 text-cyan-400')}
            <span>Offline Storage & Data</span>
          </div>

          <div class="p-5 rounded-2xl bg-dark-card/60 border border-dark-border/60 space-y-5">
            <!-- Storage Gauge -->
            <div>
              <div class="flex items-center justify-between text-xs text-slate-300 font-medium">
                <span>Browser IndexedDB Usage</span>
                <span class="font-mono text-cyan-400">${storageInfo.formattedUsage} / ${storageInfo.formattedQuota}</span>
              </div>
              <div class="w-full bg-white/10 rounded-full h-2 mt-2 overflow-hidden">
                <div class="bg-gradient-to-r from-cyan-400 to-purple-500 h-full rounded-full transition-all duration-300" style="width: ${Math.max(3, storageInfo.percent)}%"></div>
              </div>
              <div class="text-[11px] text-slate-500 mt-1.5 flex items-center justify-between">
                <span>${allTracks.length} song${allTracks.length === 1 ? '' : 's'} stored offline in your device</span>
                <span>${storageInfo.percent}% quota utilized</span>
              </div>
            </div>

            <!-- Danger Zone Actions -->
            <div class="pt-4 border-t border-dark-border/40 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button id="btn-clear-recents" class="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 hover:text-white border border-white/5 transition-all flex items-center justify-center gap-2 focus:outline-none">
                ${icons.refresh('w-3.5 h-3.5')}
                <span>Clear Recently Played</span>
              </button>

              <button id="btn-clear-favorites" class="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-xs font-semibold text-rose-400 hover:text-rose-300 border border-rose-500/20 transition-all flex items-center justify-center gap-2 focus:outline-none">
                ${icons.trash('w-3.5 h-3.5')}
                <span>Clear All Favorites</span>
              </button>
            </div>
          </div>
        </section>

        <!-- SECTION 6: PRIVACY & SYSTEM INFO -->
        <footer class="p-5 rounded-2xl bg-dark-card/40 border border-dark-border/40 text-center space-y-1.5">
          <div class="flex items-center justify-center gap-2 text-xs font-semibold text-slate-300">
            <span>LocalTunes Web Player</span>
            <span class="w-1 h-1 rounded-full bg-slate-500"></span>
            <span class="font-mono text-cyan-400">v1.2.0</span>
          </div>
          <p class="text-[11px] text-slate-500 max-w-md mx-auto">
            100% private, client-side offline audio engine. All songs, artwork, and preferences remain solely on your device.
          </p>
        </footer>
      </div>
    `;
  }

  container.innerHTML = buildHtml();
  bindEvents();

  function bindEvents() {
    // 1. Theme Card Click Handlers
    container.querySelectorAll('.theme-card').forEach((btn) => {
      btn.addEventListener('click', () => {
        const themeVal = btn.dataset.themeVal;
        settingsService.set('theme', themeVal);

        toast.show({
          message: `Theme set to ${themeVal.charAt(0).toUpperCase() + themeVal.slice(1)}`,
          type: 'success',
          duration: 1500,
        });

        // Re-render page to update checkmarks and active states
        renderSettingsPage(container, { onNavigate });
      });
    });

    // 2. Accent Color Click Handlers
    container.querySelectorAll('.accent-pill').forEach((btn) => {
      btn.addEventListener('click', () => {
        const accentVal = btn.dataset.accentVal;
        settingsService.set('accentColor', accentVal);

        toast.show({
          message: `Accent color changed to ${accentVal.charAt(0).toUpperCase() + accentVal.slice(1)}`,
          type: 'success',
          duration: 1500,
        });

        renderSettingsPage(container, { onNavigate });
      });
    });

    // 3. Layout Density
    container.querySelectorAll('#layout-toggle-group button').forEach((btn) => {
      btn.addEventListener('click', () => {
        const layoutVal = btn.dataset.layoutVal;
        settingsService.set('layout', layoutVal);
        renderSettingsPage(container, { onNavigate });
      });
    });

    // 4. Show Artwork Toggle
    const toggleArtwork = container.querySelector('#setting-toggle-artwork');
    if (toggleArtwork) {
      toggleArtwork.addEventListener('change', (e) => {
        settingsService.set('showArtwork', e.target.checked);
      });
    }

    // 5. Autoplay Next Track
    const toggleAutoplay = container.querySelector('#setting-toggle-autoplay');
    if (toggleAutoplay) {
      toggleAutoplay.addEventListener('change', (e) => {
        settingsService.set('autoplay', e.target.checked);
      });
    }

    // 6. Remember Last Active Song
    const toggleRememberTrack = container.querySelector('#setting-toggle-remember-track');
    if (toggleRememberTrack) {
      toggleRememberTrack.addEventListener('change', (e) => {
        settingsService.set('rememberLastTrack', e.target.checked);
      });
    }

    // 7. Remember Playback Position
    const toggleRememberPos = container.querySelector('#setting-toggle-remember-pos');
    if (toggleRememberPos) {
      toggleRememberPos.addEventListener('change', (e) => {
        settingsService.set('rememberPlaybackPosition', e.target.checked);
      });
    }

    // 8. Lock-screen / MediaSession Controls
    const toggleMediaSession = container.querySelector('#setting-toggle-mediasession');
    if (toggleMediaSession) {
      toggleMediaSession.addEventListener('change', (e) => {
        settingsService.set('enableMediaSession', e.target.checked);
        if (e.target.checked) {
          player.initMediaSession();
          if (player.currentTrack) {
            player.updateMediaSessionMetadata(player.currentTrack);
          }
        }
      });
    }

    // 9. Show Remaining Time
    const toggleRemaining = container.querySelector('#setting-toggle-remaining-time');
    if (toggleRemaining) {
      toggleRemaining.addEventListener('change', (e) => {
        settingsService.set('showRemainingTime', e.target.checked);
      });
    }

    // 10. Mini Player Progress Line
    const toggleMiniBar = container.querySelector('#setting-toggle-mini-bar');
    if (toggleMiniBar) {
      toggleMiniBar.addEventListener('change', (e) => {
        settingsService.set('showMiniProgressBar', e.target.checked);
      });
    }

    // 11. Library Default Sort
    const selectSort = container.querySelector('#setting-library-sort');
    if (selectSort) {
      selectSort.addEventListener('change', (e) => {
        settingsService.set('defaultLibrarySort', e.target.value);
        toast.show({ message: 'Default library sort order saved', type: 'info', duration: 1500 });
      });
    }

    // 12. Clear Recently Played
    const btnClearRecents = container.querySelector('#btn-clear-recents');
    if (btnClearRecents) {
      btnClearRecents.addEventListener('click', async () => {
        await clearRecentlyPlayed();
        toast.show({ message: 'Recently played history cleared', type: 'success' });
      });
    }

    // 13. Clear All Favorites
    const btnClearFavs = container.querySelector('#btn-clear-favorites');
    if (btnClearFavs) {
      btnClearFavs.addEventListener('click', () => {
        modal.show({
          title: 'Clear All Favorites?',
          contentHtml: '<p class="text-sm text-slate-300">Are you sure you want to remove all songs from your Favorites? Your offline audio files will not be deleted.</p>',
          confirmText: 'Clear Favorites',
          confirmClass: 'bg-rose-600 hover:bg-rose-500 text-white',
          onConfirm: async () => {
            await clearAllFavorites();
            toast.show({ message: 'All favorites have been cleared', type: 'info' });
          },
        });
      });
    }

    // 14. Reset All Settings
    const btnReset = container.querySelector('#settings-reset-btn');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        modal.show({
          title: 'Reset All Settings?',
          contentHtml: '<p class="text-sm text-slate-300">This will restore default theme, accent color, and playback behaviors. Your songs and playlists will remain untouched.</p>',
          confirmText: 'Reset to Defaults',
          confirmClass: 'bg-cyan-600 hover:bg-cyan-500 text-white',
          onConfirm: () => {
            settingsService.reset();
            toast.show({ message: 'Settings restored to default', type: 'success' });
            renderSettingsPage(container, { onNavigate });
          },
        });
      });
    }
  }
}
