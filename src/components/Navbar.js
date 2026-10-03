// LocalTunes Desktop Sidebar & Mobile Bottom Navigation
import { icons } from '../utils/icons.js';
import { getStorageUsage, getAllTracks } from '../services/musicStorage.js';

export class Navigation {
  constructor({ onNavigate, onAddMusic, onInstallPwa }) {
    this.onNavigate = onNavigate;
    this.onAddMusic = onAddMusic;
    this.onInstallPwa = onInstallPwa;
    this.currentRoute = 'home';
    this.storageInfo = null;

    this.init();
    this.refreshStorage();
  }

  init() {
    this.sidebarEl = document.getElementById('desktop-sidebar');
    this.mobileNavEl = document.getElementById('mobile-bottom-nav');
    this.render();
  }

  setRoute(route) {
    this.currentRoute = route;
    this.updateActiveStyles();
  }

  async refreshStorage() {
    try {
      this.storageInfo = await getStorageUsage();
      const tracks = await getAllTracks();
      const storageBadge = document.getElementById('sidebar-storage-badge');
      if (storageBadge && this.storageInfo) {
        storageBadge.innerHTML = `
          <div class="text-[11px] font-medium text-slate-400 flex items-center justify-between">
            <span>Local Storage</span>
            <span class="text-cyan-400 font-mono">${this.storageInfo.formattedUsage}</span>
          </div>
          <div class="w-full bg-white/10 rounded-full h-1.5 mt-1.5 overflow-hidden">
            <div class="bg-gradient-to-r from-cyan-400 to-purple-500 h-full rounded-full transition-all duration-500" style="width: ${Math.max(4, this.storageInfo.percent)}%"></div>
          </div>
          <div class="text-[10px] text-slate-500 mt-1">${tracks.length} track${tracks.length === 1 ? '' : 's'} stored offline</div>
        `;
      }
    } catch (e) {
      console.warn('Storage refresh error:', e);
    }
  }

  render() {
    // --- DESKTOP SIDEBAR ---
    if (this.sidebarEl) {
      this.sidebarEl.innerHTML = `
        <div class="flex flex-col h-full justify-between p-5">
          <!-- Top: Brand Logo & Main Nav -->
          <div class="space-y-6">
            <!-- Brand Header -->
            <div class="flex items-center gap-3 px-2 cursor-pointer" id="nav-brand-logo">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center shadow-glow">
                <img src="/icons/icon.svg" class="w-7 h-7" alt="LocalTunes Logo" />
              </div>
              <div>
                <h1 class="font-bold text-lg text-white tracking-tight flex items-center gap-1.5">
                  LocalTunes
                  <span class="text-[10px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">Local</span>
                </h1>
                <p class="text-[11px] text-slate-400">Offline Web Music</p>
              </div>
            </div>

            <!-- "Add Music" Primary Action -->
            <button id="sidebar-add-music-btn" class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-sm shadow-glow flex items-center justify-center gap-2 transition-all transform active:scale-98">
              ${icons.upload('w-4 h-4')}
              <span>Add Music</span>
            </button>

            <!-- Navigation Links -->
            <nav class="space-y-1">
              <button class="nav-item w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all" data-route="home">
                ${icons.home('w-5 h-5')}
                <span>Home</span>
              </button>
              <button class="nav-item w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all" data-route="library">
                ${icons.library('w-5 h-5')}
                <span>Library</span>
              </button>
              <button class="nav-item w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all" data-route="favorites">
                ${icons.heart('w-5 h-5')}
                <span>Favorites</span>
              </button>
              <button class="nav-item w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all" data-route="playlists">
                ${icons.playlists('w-5 h-5')}
                <span>Playlists</span>
              </button>
              <button class="nav-item w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all" data-route="search">
                ${icons.search('w-5 h-5')}
                <span>Search</span>
              </button>
              <button class="nav-item w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all" data-route="settings">
                ${icons.settings('w-5 h-5')}
                <span>Settings</span>
              </button>
            </nav>
          </div>

          <!-- Bottom: Storage & PWA Install -->
          <div class="space-y-3 pt-4 border-t border-dark-border/80">
            <!-- PWA Install Button (hidden by default, shown if installable) -->
            <button id="sidebar-install-pwa-btn" class="hidden w-full py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 hover:text-white flex items-center justify-center gap-2 transition-colors border border-white/5">
              ${icons.sparkles('w-3.5 h-3.5 text-cyan-400')}
              <span>Install Web App</span>
            </button>

            <!-- Storage Indicator -->
            <div id="sidebar-storage-badge" class="p-3 rounded-xl bg-dark-card/60 border border-dark-border">
              <div class="text-[11px] font-medium text-slate-400">Local Storage</div>
              <div class="text-[10px] text-slate-500 mt-0.5">Calculating...</div>
            </div>
          </div>
        </div>
      `;

      // Sidebar Event Listeners
      this.sidebarEl.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
          const route = btn.dataset.route;
          if (this.onNavigate) this.onNavigate(route);
        });
      });

      this.sidebarEl.querySelector('#nav-brand-logo').addEventListener('click', () => {
        if (this.onNavigate) this.onNavigate('home');
      });

      this.sidebarEl.querySelector('#sidebar-add-music-btn').addEventListener('click', () => {
        if (this.onAddMusic) this.onAddMusic();
      });

      const installBtn = this.sidebarEl.querySelector('#sidebar-install-pwa-btn');
      installBtn.addEventListener('click', () => {
        if (this.onInstallPwa) this.onInstallPwa();
      });
    }

    // --- MOBILE BOTTOM NAVIGATION ---
    if (this.mobileNavEl) {
      this.mobileNavEl.innerHTML = `
        <div class="flex items-center justify-around px-2 py-2">
          <button class="mobile-nav-item flex flex-col items-center gap-1 py-1 px-2.5 text-xs font-medium transition-colors" data-route="home">
            ${icons.home('w-5 h-5')}
            <span>Home</span>
          </button>
          <button class="mobile-nav-item flex flex-col items-center gap-1 py-1 px-2.5 text-xs font-medium transition-colors" data-route="library">
            ${icons.library('w-5 h-5')}
            <span>Library</span>
          </button>
          <button class="mobile-nav-item flex flex-col items-center gap-1 py-1 px-2.5 text-xs font-medium transition-colors" data-route="search">
            ${icons.search('w-5 h-5')}
            <span>Search</span>
          </button>
          <button class="mobile-nav-item flex flex-col items-center gap-1 py-1 px-2.5 text-xs font-medium transition-colors" data-route="favorites">
            ${icons.heart('w-5 h-5')}
            <span>Favorites</span>
          </button>
          <button class="mobile-nav-item flex flex-col items-center gap-1 py-1 px-2.5 text-xs font-medium transition-colors" data-route="settings">
            ${icons.settings('w-5 h-5')}
            <span>Settings</span>
          </button>
        </div>
      `;

      this.mobileNavEl.querySelectorAll('.mobile-nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
          const route = btn.dataset.route;
          if (this.onNavigate) this.onNavigate(route);
        });
      });
    }

    this.updateActiveStyles();
  }

  updateActiveStyles() {
    // Desktop Nav Items
    if (this.sidebarEl) {
      this.sidebarEl.querySelectorAll('.nav-item').forEach(btn => {
        const route = btn.dataset.route;
        if (route === this.currentRoute) {
          btn.className = 'nav-item w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all bg-[var(--color-accent-badge-bg)] text-[var(--color-accent-primary)] border border-[var(--color-accent-badge-border)] shadow-sm';
        } else {
          btn.className = 'nav-item w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-slate-400 hover:text-white hover:bg-white/5 border border-transparent';
        }
      });
    }

    // Mobile Nav Items
    if (this.mobileNavEl) {
      this.mobileNavEl.querySelectorAll('.mobile-nav-item').forEach(btn => {
        const route = btn.dataset.route;
        if (route === this.currentRoute) {
          btn.className = 'mobile-nav-item flex flex-col items-center gap-1 py-1 px-2.5 text-xs font-semibold text-[var(--color-accent-primary)] transition-colors';
        } else {
          btn.className = 'mobile-nav-item flex flex-col items-center gap-1 py-1 px-2.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors';
        }
      });
    }
  }

  showInstallButton() {
    const installBtn = document.getElementById('sidebar-install-pwa-btn');
    if (installBtn) installBtn.classList.remove('hidden');
  }
}
