// LocalTunes Full-Screen / Mobile-Friendly Now Playing Player
import { player } from '../services/player.js';
import { icons } from '../utils/icons.js';
import { formatDuration } from '../utils/formatters.js';
import { getArtworkSrc, getTrackTheme } from '../utils/artworkGenerator.js';
import { isFavorite, toggleFavorite } from '../services/musicStorage.js';
import { AudioVisualizer } from './Visualizer.js';
import { toast } from './Toast.js';
import { settingsService } from '../services/settingsService.js';

export class FullPlayer {
  constructor(onOpenQueue) {
    this.onOpenQueue = onOpenQueue;
    this.element = null;
    this.isOpen = false;
    this.visualizer = null;
    this.isScrubbing = false;

    this.init();
    this.bindPlayerEvents();
  }

  init() {
    this.element = document.createElement('div');
    this.element.id = 'full-player-overlay';
    this.element.className = 'fixed inset-0 z-40 bg-dark-bg flex flex-col justify-between overflow-hidden transform translate-y-full transition-transform duration-300 ease-out pb-safe pt-safe';
    document.body.appendChild(this.element);

    this.render();
  }

  open() {
    if (!player.currentTrack) return;
    this.isOpen = true;
    this.render();
    this.element.classList.remove('translate-y-full');
    this.element.classList.add('translate-y-0');

    // Start visualizer
    const canvas = this.element.querySelector('#player-visualizer-canvas');
    if (canvas) {
      if (!this.visualizer) {
        this.visualizer = new AudioVisualizer(canvas);
      }
      this.visualizer.start();
    }
  }

  close() {
    this.isOpen = false;
    this.element.classList.add('translate-y-full');
    this.element.classList.remove('translate-y-0');

    if (this.visualizer) {
      this.visualizer.stop();
    }
  }

  render() {
    const track = player.currentTrack;
    if (!track) {
      this.element.innerHTML = '';
      return;
    }

    const theme = getTrackTheme(track);
    const artworkSrc = getArtworkSrc(track);
    const isPlaying = player.isPlaying;

    const currentSec = player.currentTime || 0;
    const totalSec = isFinite(player.duration) && player.duration > 0 ? player.duration : 100;
    const seekPercent = player.duration > 0 ? Math.min(100, Math.max(0, (currentSec / totalSec) * 100)) : 0;
    const currentVol = player.isMuted ? 0 : (typeof player.volume === 'number' ? player.volume : 0.8);
    const volumePercent = Math.min(100, Math.max(0, currentVol * 100));
    const showRemaining = settingsService.get('showRemainingTime');
    const remainingTimeSec = Math.max(0, (player.duration || 0) - currentSec);
    const durationText = showRemaining && isFinite(player.duration) && player.duration > 0
      ? `-${formatDuration(remainingTimeSec)}`
      : formatDuration(player.duration);

    this.element.innerHTML = `
      <!-- Ambient Dynamic Glowing Backdrop -->
      <div class="absolute inset-0 pointer-events-none overflow-hidden opacity-40">
        <div class="ambient-glow -top-32 -left-32 w-96 h-96" style="background: ${theme.from};"></div>
        <div class="ambient-glow -bottom-32 -right-32 w-96 h-96" style="background: ${theme.to};"></div>
        <div class="absolute inset-0 bg-dark-bg/80 backdrop-blur-3xl"></div>
      </div>

      <!-- Top Header Navigation -->
      <header class="relative z-10 flex items-center justify-between px-6 pt-4 pb-2">
        <button id="full-player-collapse-btn" class="p-2 -ml-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors focus:outline-none" aria-label="Collapse player">
          ${icons.chevronDown('w-7 h-7')}
        </button>

        <div class="text-center">
          <div class="text-xs uppercase tracking-widest font-semibold text-slate-400">Playing from Library</div>
          <div class="text-xs text-cyan-400 font-medium truncate max-w-[200px] sm:max-w-xs mt-0.5">${escapeHtml(track.album || 'LocalTunes')}</div>
        </div>

        <button id="full-player-queue-top-btn" class="p-2 -mr-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors focus:outline-none" aria-label="Open queue">
          ${icons.queue('w-6 h-6')}
        </button>
      </header>

      <!-- Center: Large Artwork & Visualizer -->
      <main class="relative z-10 flex-1 flex flex-col items-center justify-center px-8 py-2 min-h-0">
        <div class="relative w-full max-w-[340px] sm:max-w-[380px] aspect-square rounded-3xl overflow-hidden shadow-2xl border border-white/10 group transition-all duration-300">
          <img id="full-artwork-img" src="${artworkSrc}" alt="${escapeHtml(track.title)}" class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
          
          <!-- Subtle Vinyl Center Hole Reflection -->
          <div class="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/10 pointer-events-none"></div>

          ${isPlaying ? `
            <div class="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
              <span class="text-[11px] font-medium text-cyan-300">PLAYING</span>
            </div>
          ` : ''}
        </div>

        <!-- Live Audio Spectrum Visualizer Canvas -->
        <div class="w-full max-w-[340px] sm:max-w-[380px] h-10 mt-4 flex items-center justify-center">
          <canvas id="player-visualizer-canvas" class="w-full h-full opacity-90"></canvas>
        </div>
      </main>

      <!-- Bottom Controls Area -->
      <footer class="relative z-10 w-full max-w-lg mx-auto px-6 sm:px-8 pb-2 pt-2 flex flex-col gap-4">
        <!-- Title, Artist & Favorite -->
        <div class="flex items-center justify-between gap-4">
          <div class="min-w-0 flex-1">
            <h2 id="full-track-title" class="text-xl sm:text-2xl font-bold text-white truncate tracking-tight">
              ${escapeHtml(track.title || track.fileName || 'Untitled')}
            </h2>
            <p id="full-track-artist" class="text-sm sm:text-base text-slate-400 truncate mt-0.5">
              ${escapeHtml(track.artist || 'Unknown Artist')}
            </p>
          </div>

          <button id="full-fav-btn" class="p-2 text-slate-400 hover:text-rose-500 rounded-full hover:bg-white/5 transition-all focus:outline-none flex-shrink-0" aria-label="Favorite">
            ${icons.heart('w-7 h-7')}
          </button>
        </div>

        <!-- Interactive Progress Bar -->
        <div class="flex flex-col gap-1.5">
          <div class="relative w-full py-1">
            <input
              type="range"
              id="full-seek-slider"
              min="0"
              max="${totalSec}"
              value="${currentSec}"
              step="0.1"
              style="--progress: ${seekPercent}%;"
              class="w-full slider-progress cursor-pointer"
              aria-label="Seek track"
            />
          </div>
          <div class="flex items-center justify-between text-xs font-mono text-slate-400">
            <span id="full-current-time">${formatDuration(currentSec)}</span>
            <button id="full-total-duration" class="hover:text-cyan-400 transition-colors focus:outline-none" title="Toggle elapsed / remaining time">${durationText}</button>
          </div>
        </div>

        <!-- Main Playback Controls: Shuffle, Prev, Play/Pause, Next, Repeat -->
        <div class="flex items-center justify-between pt-1">
          <!-- Shuffle Button -->
          <button id="full-shuffle-btn" class="p-3 rounded-full transition-all focus:outline-none ${player.shuffle ? 'text-cyan-400 bg-cyan-400/10 shadow-glow' : 'text-slate-400 hover:text-white'}" aria-label="Shuffle">
            ${icons.shuffle('w-6 h-6')}
          </button>

          <!-- Previous Button -->
          <button id="full-prev-btn" class="p-3 text-slate-200 hover:text-white hover:scale-110 active:scale-95 transition-all focus:outline-none" aria-label="Previous track">
            ${icons.skipBack('w-8 h-8')}
          </button>

          <!-- Play/Pause Button -->
          <button id="full-play-btn" class="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-white text-slate-950 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-glow focus:outline-none" aria-label="Play or pause">
            ${isPlaying ? icons.pause('w-8 h-8') : icons.play('w-8 h-8 ml-1')}
          </button>

          <!-- Next Button -->
          <button id="full-next-btn" class="p-3 text-slate-200 hover:text-white hover:scale-110 active:scale-95 transition-all focus:outline-none" aria-label="Next track">
            ${icons.skipForward('w-8 h-8')}
          </button>

          <!-- Repeat Button -->
          <button id="full-repeat-btn" class="p-3 rounded-full transition-all focus:outline-none ${player.repeat !== 'off' ? 'text-cyan-400 bg-cyan-400/10 shadow-glow' : 'text-slate-400 hover:text-white'}" aria-label="Repeat mode">
            ${player.repeat === 'one' ? icons.repeatOne('w-6 h-6') : icons.repeat('w-6 h-6')}
          </button>
        </div>

        <!-- Volume & Bottom Actions (Desktop & Mobile) -->
        <div class="flex items-center justify-between gap-4 pt-2">
          <!-- Volume Slider -->
          <div class="flex items-center gap-2 flex-1 max-w-[220px]">
            <button id="full-volume-btn" class="text-slate-400 hover:text-white transition-colors focus:outline-none" aria-label="Mute or unmute">
              ${player.isMuted || player.volume === 0 ? icons.volumeMute('w-5 h-5') : icons.volume('w-5 h-5')}
            </button>
            <input
              type="range"
              id="full-volume-slider"
              min="0"
              max="1"
              step="0.01"
              value="${currentVol}"
              style="--progress: ${volumePercent}%;"
              class="w-full slider-progress cursor-pointer"
              aria-label="Volume slider"
            />
          </div>

          <!-- Queue Drawer Toggle -->
          <button id="full-queue-bottom-btn" class="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 hover:text-white transition-colors border border-white/5" aria-label="Up next queue">
            ${icons.queue('w-4 h-4 text-cyan-400')}
            <span>Up Next</span>
          </button>
        </div>
      </footer>
    `;

    this.bindEvents(track);
  }

  bindEvents(track) {
    // Collapse
    const collapseBtn = this.element.querySelector('#full-player-collapse-btn');
    collapseBtn.addEventListener('click', () => this.close());

    // Queue buttons
    const queueBtnTop = this.element.querySelector('#full-player-queue-top-btn');
    const queueBtnBottom = this.element.querySelector('#full-queue-bottom-btn');
    const handleQueueClick = () => {
      if (this.onOpenQueue) this.onOpenQueue();
    };
    if (queueBtnTop) queueBtnTop.addEventListener('click', handleQueueClick);
    if (queueBtnBottom) queueBtnBottom.addEventListener('click', handleQueueClick);

    // Favorite Button
    const favBtn = this.element.querySelector('#full-fav-btn');
    isFavorite(track.id).then(fav => {
      if (fav) favBtn.innerHTML = icons.heartFilled('w-7 h-7 text-rose-500');
    });

    favBtn.addEventListener('click', async () => {
      const isNowFav = await toggleFavorite(track.id);
      favBtn.innerHTML = isNowFav ? icons.heartFilled('w-7 h-7 text-rose-500') : icons.heart('w-7 h-7');
      toast.show({
        message: isNowFav ? `Added "${track.title}" to Favorites` : `Removed "${track.title}" from Favorites`,
        type: isNowFav ? 'success' : 'info'
      });
    });

    // Seek Slider
    const seekSlider = this.element.querySelector('#full-seek-slider');
    const currTimeLabel = this.element.querySelector('#full-current-time');

    seekSlider.addEventListener('input', (e) => {
      this.isScrubbing = true;
      const targetSec = parseFloat(e.target.value);
      currTimeLabel.textContent = formatDuration(targetSec);
      const max = parseFloat(seekSlider.max) || 100;
      const pct = max > 0 ? Math.min(100, Math.max(0, (targetSec / max) * 100)) : 0;
      seekSlider.style.setProperty('--progress', `${pct}%`);
    });

    seekSlider.addEventListener('change', (e) => {
      const targetSec = parseFloat(e.target.value);
      player.seek(targetSec);
      this.isScrubbing = false;
      const max = parseFloat(seekSlider.max) || 100;
      const pct = max > 0 ? Math.min(100, Math.max(0, (targetSec / max) * 100)) : 0;
      seekSlider.style.setProperty('--progress', `${pct}%`);
    });

    const totalDurBtn = this.element.querySelector('#full-total-duration');
    if (totalDurBtn) {
      totalDurBtn.addEventListener('click', () => {
        const curr = settingsService.get('showRemainingTime');
        settingsService.set('showRemainingTime', !curr);
      });
    }

    // Playback buttons
    const playBtn = this.element.querySelector('#full-play-btn');
    playBtn.addEventListener('click', () => player.togglePlay());

    const prevBtn = this.element.querySelector('#full-prev-btn');
    prevBtn.addEventListener('click', () => player.previous());

    const nextBtn = this.element.querySelector('#full-next-btn');
    nextBtn.addEventListener('click', () => player.next());

    const shuffleBtn = this.element.querySelector('#full-shuffle-btn');
    shuffleBtn.addEventListener('click', () => player.toggleShuffle());

    const repeatBtn = this.element.querySelector('#full-repeat-btn');
    repeatBtn.addEventListener('click', () => player.toggleRepeat());

    // Volume
    const volumeBtn = this.element.querySelector('#full-volume-btn');
    const volumeSlider = this.element.querySelector('#full-volume-slider');

    volumeBtn.addEventListener('click', () => {
      player.toggleMute();
      const val = player.isMuted ? 0 : player.volume;
      volumeSlider.value = val;
      volumeSlider.style.setProperty('--progress', `${val * 100}%`);
      volumeBtn.innerHTML = player.isMuted || player.volume === 0 ? icons.volumeMute('w-5 h-5') : icons.volume('w-5 h-5');
    });

    volumeSlider.addEventListener('input', (e) => {
      const vol = parseFloat(e.target.value);
      player.setVolume(vol);
      volumeSlider.style.setProperty('--progress', `${vol * 100}%`);
      volumeBtn.innerHTML = vol === 0 ? icons.volumeMute('w-5 h-5') : icons.volume('w-5 h-5');
    });

    // Swipe down to dismiss on mobile
    let touchStartY = 0;
    this.element.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    this.element.addEventListener('touchend', (e) => {
      const touchEndY = e.changedTouches[0].clientY;
      if (touchEndY - touchStartY > 100) {
        // Swiped down > 100px
        this.close();
      }
    }, { passive: true });
  }

  bindPlayerEvents() {
    player.on('trackChange', (track) => {
      if (this.isOpen) {
        this.render();
        const canvas = this.element.querySelector('#player-visualizer-canvas');
        if (canvas) {
          if (!this.visualizer) {
            this.visualizer = new AudioVisualizer(canvas);
          }
          this.visualizer.start();
        }
      }
    });

    player.on('playbackChange', (isPlaying) => {
      const playBtn = this.element.querySelector('#full-play-btn');
      if (playBtn) {
        playBtn.innerHTML = isPlaying ? icons.pause('w-8 h-8') : icons.play('w-8 h-8 ml-1');
      }
    });

    player.on('timeUpdate', ({ currentTime, duration, percent }) => {
      if (!this.isOpen || this.isScrubbing) return;

      const seekSlider = this.element.querySelector('#full-seek-slider');
      const currTimeLabel = this.element.querySelector('#full-current-time');
      const totalDurLabel = this.element.querySelector('#full-total-duration');

      if (seekSlider && isFinite(duration) && duration > 0) {
        seekSlider.max = duration;
        seekSlider.value = currentTime;
        const pct = typeof percent === 'number' ? percent : (currentTime / duration) * 100;
        seekSlider.style.setProperty('--progress', `${pct}%`);
      }
      if (currTimeLabel) currTimeLabel.textContent = formatDuration(currentTime);
      if (totalDurLabel && isFinite(duration) && duration > 0) {
        const showRemaining = settingsService.get('showRemainingTime');
        totalDurLabel.textContent = showRemaining
          ? `-${formatDuration(Math.max(0, duration - currentTime))}`
          : formatDuration(duration);
      }
    });

    settingsService.on('change', ({ key }) => {
      if (key === 'showRemainingTime' && this.isOpen) {
        const totalDurLabel = this.element.querySelector('#full-total-duration');
        if (totalDurLabel && isFinite(player.duration) && player.duration > 0) {
          const showRemaining = settingsService.get('showRemainingTime');
          const currentSec = player.currentTime || 0;
          totalDurLabel.textContent = showRemaining
            ? `-${formatDuration(Math.max(0, player.duration - currentSec))}`
            : formatDuration(player.duration);
        }
      }
    });

    player.on('modeChange', ({ shuffle, repeat }) => {
      const shuffleBtn = this.element.querySelector('#full-shuffle-btn');
      if (shuffleBtn) {
        if (shuffle) {
          shuffleBtn.className = 'p-3 rounded-full transition-all focus:outline-none text-cyan-400 bg-cyan-400/10 shadow-glow';
        } else {
          shuffleBtn.className = 'p-3 rounded-full transition-all focus:outline-none text-slate-400 hover:text-white';
        }
      }

      const repeatBtn = this.element.querySelector('#full-repeat-btn');
      if (repeatBtn) {
        if (repeat !== 'off') {
          repeatBtn.className = 'p-3 rounded-full transition-all focus:outline-none text-cyan-400 bg-cyan-400/10 shadow-glow';
          repeatBtn.innerHTML = repeat === 'one' ? icons.repeatOne('w-6 h-6') : icons.repeat('w-6 h-6');
        } else {
          repeatBtn.className = 'p-3 rounded-full transition-all focus:outline-none text-slate-400 hover:text-white';
          repeatBtn.innerHTML = icons.repeat('w-6 h-6');
        }
      }
    });

    player.on('volumeChange', ({ volume, isMuted }) => {
      const volumeBtn = this.element.querySelector('#full-volume-btn');
      const volumeSlider = this.element.querySelector('#full-volume-slider');
      const val = isMuted ? 0 : volume;
      if (volumeSlider) {
        volumeSlider.value = val;
        volumeSlider.style.setProperty('--progress', `${val * 100}%`);
      }
      if (volumeBtn) {
        volumeBtn.innerHTML = isMuted || volume === 0 ? icons.volumeMute('w-5 h-5') : icons.volume('w-5 h-5');
      }
    });
  }
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
