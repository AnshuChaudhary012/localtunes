// LocalTunes Main Application Orchestrator
import { Navigation } from './components/Navbar.js';
import { MiniPlayer } from './components/MiniPlayer.js';
import { FullPlayer } from './components/FullPlayer.js';
import { QueueDrawer } from './components/QueueDrawer.js';
import { toast } from './components/Toast.js';
import { modal } from './components/Modal.js';
import { player } from './services/player.js';
import { saveTrack, getAllTracks } from './services/musicStorage.js';
import { extractMetadata } from './utils/metadataParser.js';

// Page Renderers
import { renderHomePage } from './pages/HomePage.js';
import { renderLibraryPage } from './pages/LibraryPage.js';
import { renderFavoritesPage } from './pages/FavoritesPage.js';
import { renderPlaylistsPage } from './pages/PlaylistsPage.js';
import { renderSearchPage } from './pages/SearchPage.js';

class App {
  constructor() {
    this.currentRoute = 'home';
    this.navigation = null;
    this.miniPlayer = null;
    this.fullPlayer = null;
    this.queueDrawer = null;
    this.deferredInstallPrompt = null;
  }

  async init() {
    // 1. Setup UI Components
    const playerContainer = document.getElementById('player-container');
    this.queueDrawer = new QueueDrawer();

    this.fullPlayer = new FullPlayer(() => {
      this.queueDrawer.open();
    });

    this.miniPlayer = new MiniPlayer(
      playerContainer,
      () => this.fullPlayer.open(),
      () => this.queueDrawer.open()
    );

    this.navigation = new Navigation({
      onNavigate: (route) => this.navigate(route),
      onAddMusic: () => this.triggerFilePicker(),
      onInstallPwa: () => this.installPwa(),
    });

    // 2. Setup File Input & Drag and Drop
    this.setupFileImport();
    this.setupDragAndDrop();

    // 3. Setup Global Keyboard Shortcuts
    this.setupKeyboardShortcuts();

    // 4. Setup PWA Service Worker & Install Prompt
    this.setupPwa();

    // 5. Mobile Header Brand & Add Button
    const mobileBrand = document.getElementById('mobile-brand-click');
    if (mobileBrand) mobileBrand.addEventListener('click', () => this.navigate('home'));

    const mobileAddBtn = document.getElementById('mobile-add-music-btn');
    if (mobileAddBtn) mobileAddBtn.addEventListener('click', () => this.triggerFilePicker());

    // 6. Restore saved state & tracks
    const allTracks = await getAllTracks();
    await player.restoreSavedState(allTracks);

    // 7. Initial Route
    window.addEventListener('hashchange', () => this.handleHashChange());
    this.handleHashChange();
  }

  handleHashChange() {
    const hash = window.location.hash.replace('#', '') || 'home';
    this.navigate(hash, false);
  }

  async navigate(route, updateHash = true) {
    this.currentRoute = route;
    if (updateHash) {
      window.location.hash = `#${route}`;
    }

    if (this.navigation) {
      this.navigation.setRoute(route);
    }

    const mainContent = document.getElementById('app-main-content');
    if (!mainContent) return;

    // Scroll to top
    mainContent.scrollTop = 0;

    switch (route) {
      case 'library':
        await renderLibraryPage(mainContent, {
          onNavigate: (r) => this.navigate(r),
          onAddMusic: () => this.triggerFilePicker(),
        });
        break;
      case 'favorites':
        await renderFavoritesPage(mainContent, {
          onNavigate: (r) => this.navigate(r),
        });
        break;
      case 'playlists':
        await renderPlaylistsPage(mainContent, {
          onNavigate: (r) => this.navigate(r),
        });
        break;
      case 'search':
        await renderSearchPage(mainContent, {
          onNavigate: (r) => this.navigate(r),
        });
        break;
      case 'home':
      default:
        await renderHomePage(mainContent, {
          onNavigate: (r) => this.navigate(r),
          onAddMusic: () => this.triggerFilePicker(),
        });
        break;
    }
  }

  // --- FILE IMPORT HANDLERS ---
  triggerFilePicker() {
    const fileInput = document.getElementById('audio-file-input');
    if (fileInput) {
      fileInput.value = '';
      fileInput.click();
    }
  }

  setupFileImport() {
    const fileInput = document.getElementById('audio-file-input');
    if (!fileInput) return;

    fileInput.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        await this.importFiles(files);
      }
    });
  }

  setupDragAndDrop() {
    const overlay = document.getElementById('drag-drop-overlay');
    let dragCounter = 0;

    window.addEventListener('dragenter', (e) => {
      e.preventDefault();
      dragCounter++;
      if (overlay) {
        overlay.classList.remove('opacity-0', 'pointer-events-none');
      }
    });

    window.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter <= 0 && overlay) {
        dragCounter = 0;
        overlay.classList.add('opacity-0', 'pointer-events-none');
      }
    });

    window.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    window.addEventListener('drop', async (e) => {
      e.preventDefault();
      dragCounter = 0;
      if (overlay) {
        overlay.classList.add('opacity-0', 'pointer-events-none');
      }

      const files = Array.from(e.dataTransfer?.files || []);
      const audioFiles = files.filter(f => f.type.startsWith('audio/') || /\.(mp3|m4a|wav|aac|ogg|flac)$/i.test(f.name));

      if (audioFiles.length > 0) {
        await this.importFiles(audioFiles);
      } else if (files.length > 0) {
        toast.show({ message: 'No supported audio files were detected in the drop.', type: 'warning' });
      }
    });
  }

  async importFiles(files) {
    if (!files || files.length === 0) return;

    let successCount = 0;
    let failedCount = 0;
    const total = files.length;

    // Show Progress Modal for multiple files
    let progressModal = null;
    let progressFill = null;
    let progressText = null;

    if (total > 1) {
      progressModal = modal.show({
        title: 'Importing Music',
        contentHtml: `
          <div class="space-y-3 py-2">
            <div class="flex items-center justify-between text-xs text-slate-300">
              <span id="import-progress-label">Processing tracks...</span>
              <span id="import-progress-count" class="font-mono text-cyan-400">0 / ${total}</span>
            </div>
            <div class="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <div id="import-progress-fill" class="bg-gradient-to-r from-cyan-400 to-purple-500 h-full w-0 transition-all duration-150"></div>
            </div>
            <p class="text-[11px] text-slate-500 truncate" id="import-current-filename"></p>
          </div>
        `,
        showCancel: false,
      });

      progressFill = progressModal.querySelector('#import-progress-fill');
      progressText = progressModal.querySelector('#import-progress-count');
    }

    const currentFileLabel = progressModal ? progressModal.querySelector('#import-current-filename') : null;

    for (let i = 0; i < total; i++) {
      const file = files[i];

      if (currentFileLabel) {
        currentFileLabel.textContent = file.name;
      }

      try {
        // Extract metadata without external APIs
        const meta = await extractMetadata(file);

        // Store track with original Audio Blob in IndexedDB
        const trackData = {
          id: 'trk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
          title: meta.title,
          artist: meta.artist,
          album: meta.album,
          duration: meta.duration,
          audioBlob: file, // Store the Blob in IndexedDB!
          artworkBlob: meta.artworkBlob,
          fileType: meta.fileType,
          fileName: meta.fileName,
          fileSize: meta.fileSize,
          dateAdded: Date.now(),
        };

        await saveTrack(trackData);
        successCount++;
      } catch (err) {
        console.error('Failed to import file:', file.name, err);
        failedCount++;
      }

      if (progressFill && progressText) {
        const pct = Math.round(((i + 1) / total) * 100);
        progressFill.style.width = `${pct}%`;
        progressText.textContent = `${i + 1} / ${total}`;
      }
    }

    if (progressModal) {
      modal.close();
    }

    // Refresh UI & Navigation Storage Stats
    if (this.navigation) {
      this.navigation.refreshStorage();
    }
    await this.navigate(this.currentRoute, false);

    if (successCount > 0) {
      toast.show({
        message: `Successfully imported ${successCount} track${successCount === 1 ? '' : 's'}!`,
        type: 'success',
      });
    }

    if (failedCount > 0) {
      toast.show({
        message: `Skipped ${failedCount} corrupted or unsupported file${failedCount === 1 ? '' : 's'}.`,
        type: 'warning',
      });
    }
  }

  // --- KEYBOARD SHORTCUTS ---
  setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Don't intercept when user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          player.togglePlay();
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (e.shiftKey) {
            player.next();
          } else {
            player.seek(player.currentTime + 5);
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (e.shiftKey) {
            player.previous();
          } else {
            player.seek(player.currentTime - 5);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          player.setVolume(player.volume + 0.05);
          break;
        case 'ArrowDown':
          e.preventDefault();
          player.setVolume(player.volume - 0.05);
          break;
        case 'KeyM':
          player.toggleMute();
          break;
        case 'KeyS':
          player.toggleShuffle();
          toast.show({ message: player.shuffle ? 'Shuffle On' : 'Shuffle Off', type: 'info', duration: 1500 });
          break;
        case 'KeyR':
          player.toggleRepeat();
          toast.show({ message: `Repeat: ${player.repeat.toUpperCase()}`, type: 'info', duration: 1500 });
          break;
      }
    });
  }

  // --- PWA SETUP ---
  setupPwa() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then((reg) => {
          console.log('LocalTunes ServiceWorker registered:', reg.scope);
        }).catch((err) => {
          console.warn('ServiceWorker registration failed:', err);
        });
      });
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredInstallPrompt = e;
      if (this.navigation) {
        this.navigation.showInstallButton();
      }
    });
  }

  async installPwa() {
    if (!this.deferredInstallPrompt) {
      toast.show({ message: 'App installation is already complete or not supported in this browser.', type: 'info' });
      return;
    }

    this.deferredInstallPrompt.prompt();
    const { outcome } = await this.deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') {
      toast.show({ message: 'LocalTunes installed successfully!', type: 'success' });
    }
    this.deferredInstallPrompt = null;
  }
}

export const app = new App();
