// LocalTunes Player Bar (Responsive MiniPlayer on Mobile, Full Player Bar on Desktop)
import { player } from '../services/player.js';
import { icons } from '../utils/icons.js';
import { getArtworkSrc } from '../utils/artworkGenerator.js';
import { isFavorite, toggleFavorite } from '../services/musicStorage.js';
import { formatDuration } from '../utils/formatters.js';

export class MiniPlayer {
  constructor(container, onOpenFullPlayer, onOpenQueue) {
    this.container = container;
    this.onOpenFullPlayer = onOpenFullPlayer;
    this.onOpenQueue = onOpenQueue;
    this.element = null;
    this.mobileProgressBar = null;
    this.desktopSeekSlider = null;
    this.isDesktopScrubbing = false;

    this.init();
    this.bindPlayerEvents();
  }

  init() {
    this.element = document.createElement('div');
    this.element.id = 'mini-player';
    this.element.className = 'w-full bg-dark-card/95 backdrop-blur-xl border-t border-dark-border/80 shadow-glass transition-transform duration-300 transform translate-y-full';
    this.container.appendChild(this.element);

    this.render();
  }

  render() {
    const track = player.currentTrack;

    if (!track) {
      this.element.classList.add('translate-y-full');
      this.element.classList.remove('translate-y-0');
      this.element.innerHTML = '';
      return;
    }

    const isPlaying = player.isPlaying;
    const artworkSrc = getArtworkSrc(track);

    const currentSec = player.currentTime || 0;
    const totalSec = isFinite(player.duration) && player.duration > 0 ? player.duration : 100;
    const seekPercent = player.duration > 0 ? Math.min(100, Math.max(0, (currentSec / totalSec) * 100)) : 0;
    const currentVol = player.isMuted ? 0 : (typeof player.volume === 'number' ? player.volume : 0.8);
    const volumePercent = Math.min(100, Math.max(0, currentVol * 100));

    this.element.innerHTML = `
      <!-- ==================== MOBILE MINI PLAYER (< md) ==================== -->
      <div class="md:hidden flex flex-col">
        <!-- Slim Top Progress Indicator Line -->
        <div class="w-full h-1 bg-white/10 relative overflow-hidden cursor-pointer" id="mini-progress-track">
          <div id="mini-progress-fill" class="h-full bg-gradient-to-r from-cyan-400 to-purple-500 w-0 transition-all duration-100" style="width: ${seekPercent}%;"></div>
        </div>

        <div class="px-3.5 py-2.5 flex items-center justify-between gap-3">
          <!-- Track info (Click opens Full Player) -->
          <div class="flex items-center gap-3 flex-1 min-w-0 cursor-pointer" id="mini-player-clickable">
            <div class="relative w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 shadow-md bg-dark-surface">
              <img id="mini-artwork" src="${artworkSrc}" alt="${escapeHtml(track.title)}" class="w-full h-full object-cover" />
              ${isPlaying ? `
                <div class="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-cyan-400 shadow-glow animate-pulse"></div>
              ` : ''}
            </div>
            <div class="min-w-0 flex-1">
              <div id="mini-title" class="font-medium text-sm text-white truncate">
                ${escapeHtml(track.title || track.fileName || 'Untitled')}
              </div>
              <div id="mini-artist" class="text-xs text-slate-400 truncate mt-0.5">
                ${escapeHtml(track.artist || 'Unknown Artist')}
              </div>
            </div>
          </div>

          <!-- Mobile Quick Controls -->
          <div class="flex items-center gap-1 flex-shrink-0">
            <!-- Favorite button -->
            <button id="mini-fav-btn" class="p-2 text-slate-400 hover:text-rose-500 transition-colors rounded-xl focus:outline-none" aria-label="Favorite">
              ${icons.heart('w-5 h-5')}
            </button>

            <!-- Play / Pause -->
            <button id="mini-play-btn" class="w-10 h-10 flex items-center justify-center rounded-full bg-white text-slate-950 hover:scale-105 active:scale-95 transition-all shadow-glow focus:outline-none" aria-label="Play or Pause">
              ${isPlaying ? icons.pause('w-5 h-5') : icons.play('w-5 h-5 ml-0.5')}
            </button>

            <!-- Next -->
            <button id="mini-next-btn" class="p-2 text-slate-300 hover:text-white transition-colors rounded-xl focus:outline-none" aria-label="Next track">
              ${icons.skipForward('w-5 h-5')}
            </button>
          </div>
        </div>
      </div>

      <!-- ==================== DESKTOP PLAYER BAR (>= md) ==================== -->
      <div class="hidden md:block w-full">
        <div class="max-w-7xl mx-auto px-6 py-2.5 flex items-center justify-between gap-6">
          
          <!-- Desktop Left: Track Info & Favorite -->
          <div class="w-1/4 min-w-[200px] flex items-center gap-3.5">
            <div class="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 shadow-md bg-dark-surface cursor-pointer group" id="desktop-artwork-click">
              <img id="desktop-artwork" src="${artworkSrc}" alt="${escapeHtml(track.title)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div class="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                ${icons.expand('w-4 h-4 text-white')}
              </div>
            </div>

            <div class="min-w-0 flex-1 cursor-pointer" id="desktop-info-click">
              <div id="desktop-title" class="font-semibold text-sm text-white truncate hover:underline" title="${escapeHtml(track.title || track.fileName)}">
                ${escapeHtml(track.title || track.fileName || 'Untitled')}
              </div>
              <div id="desktop-artist" class="text-xs text-slate-400 truncate mt-0.5" title="${escapeHtml(track.artist || 'Unknown Artist')}">
                ${escapeHtml(track.artist || 'Unknown Artist')}
              </div>
            </div>

            <button id="desktop-fav-btn" class="p-2 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-white/5 transition-all flex-shrink-0 focus:outline-none" aria-label="Favorite">
              ${icons.heart('w-5 h-5')}
            </button>
          </div>

          <!-- Desktop Center: Playback Controls & Timeline Seeker -->
          <div class="flex-1 max-w-2xl flex flex-col items-center gap-1.5 px-2">
            <!-- Buttons row -->
            <div class="flex items-center gap-3">
              <!-- Shuffle -->
              <button id="desktop-shuffle-btn" class="p-1.5 rounded-lg transition-all focus:outline-none ${player.shuffle ? 'text-cyan-400 bg-cyan-400/10' : 'text-slate-400 hover:text-white'}" aria-label="Shuffle" title="Shuffle">
                ${icons.shuffle('w-4 h-4')}
              </button>

              <!-- Previous -->
              <button id="desktop-prev-btn" class="p-1.5 text-slate-300 hover:text-white hover:scale-110 active:scale-95 transition-all focus:outline-none" aria-label="Previous track" title="Previous">
                ${icons.skipBack('w-5 h-5')}
              </button>

              <!-- Play/Pause -->
              <button id="desktop-play-btn" class="w-9 h-9 flex items-center justify-center rounded-full bg-white text-slate-950 hover:scale-105 active:scale-95 transition-all shadow-glow focus:outline-none" aria-label="Play or pause" title="${isPlaying ? 'Pause' : 'Play'}">
                ${isPlaying ? icons.pause('w-4 h-4') : icons.play('w-4 h-4 ml-0.5')}
              </button>

              <!-- Next -->
              <button id="desktop-next-btn" class="p-1.5 text-slate-300 hover:text-white hover:scale-110 active:scale-95 transition-all focus:outline-none" aria-label="Next track" title="Next">
                ${icons.skipForward('w-5 h-5')}
              </button>

              <!-- Repeat -->
              <button id="desktop-repeat-btn" class="p-1.5 rounded-lg transition-all focus:outline-none ${player.repeat !== 'off' ? 'text-cyan-400 bg-cyan-400/10' : 'text-slate-400 hover:text-white'}" aria-label="Repeat mode" title="Repeat">
                ${player.repeat === 'one' ? icons.repeatOne('w-4 h-4') : icons.repeat('w-4 h-4')}
              </button>
            </div>

            <!-- Timeline Seeker row -->
            <div class="w-full flex items-center gap-2.5">
              <span id="desktop-current-time" class="text-[11px] font-mono text-slate-400 w-10 text-right select-none">${formatDuration(currentSec)}</span>
              <div class="flex-1 relative py-1 flex items-center">
                <input
                  type="range"
                  id="desktop-seek-slider"
                  min="0"
                  max="${totalSec}"
                  value="${currentSec}"
                  step="0.1"
                  style="--progress: ${seekPercent}%;"
                  class="w-full slider-progress cursor-pointer"
                  aria-label="Seek track"
                />
              </div>
              <span id="desktop-total-time" class="text-[11px] font-mono text-slate-400 w-10 text-left select-none">${formatDuration(player.duration)}</span>
            </div>
          </div>

          <!-- Desktop Right: Volume, Queue & Expand -->
          <div class="w-1/4 min-w-[200px] flex items-center justify-end gap-3">
            <!-- Queue Button -->
            <button id="desktop-queue-btn" class="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all focus:outline-none" aria-label="Up next queue" title="Play Queue">
              ${icons.queue('w-5 h-5')}
            </button>

            <!-- Volume Control -->
            <div class="flex items-center gap-2">
              <button id="desktop-volume-btn" class="text-slate-400 hover:text-white transition-colors focus:outline-none" aria-label="Mute or unmute" title="Mute/Unmute">
                ${player.isMuted || player.volume === 0 ? icons.volumeMute('w-4 h-4') : icons.volume('w-4 h-4')}
              </button>
              <input
                type="range"
                id="desktop-volume-slider"
                min="0"
                max="1"
                step="0.01"
                value="${currentVol}"
                style="--progress: ${volumePercent}%;"
                class="w-20 lg:w-24 slider-progress cursor-pointer"
                aria-label="Volume slider"
              />
            </div>

            <!-- Expand / Full Player Button -->
            <button id="desktop-expand-btn" class="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all focus:outline-none" aria-label="Open full player" title="Full Player">
              ${icons.expand('w-4 h-4')}
            </button>
          </div>

        </div>
      </div>
    `;

    this.mobileProgressBar = this.element.querySelector('#mini-progress-fill');
    this.desktopSeekSlider = this.element.querySelector('#desktop-seek-slider');

    // Make visible
    this.element.classList.remove('translate-y-full');
    this.element.classList.add('translate-y-0');

    this.bindEvents(track);
  }

  bindEvents(track) {
    // --- Mobile Clicks ---
    const mobileClickable = this.element.querySelector('#mini-player-clickable');
    if (mobileClickable) {
      mobileClickable.addEventListener('click', () => {
        if (this.onOpenFullPlayer) this.onOpenFullPlayer();
      });
    }

    const mobilePlayBtn = this.element.querySelector('#mini-play-btn');
    if (mobilePlayBtn) {
      mobilePlayBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        player.togglePlay();
      });
    }

    const mobileNextBtn = this.element.querySelector('#mini-next-btn');
    if (mobileNextBtn) {
      mobileNextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        player.next();
      });
    }

    const mobileFavBtn = this.element.querySelector('#mini-fav-btn');
    const desktopFavBtn = this.element.querySelector('#desktop-fav-btn');

    const updateFavIcons = (fav) => {
      const iconHtml = fav ? icons.heartFilled('w-5 h-5 text-rose-500') : icons.heart('w-5 h-5');
      if (mobileFavBtn) mobileFavBtn.innerHTML = iconHtml;
      if (desktopFavBtn) desktopFavBtn.innerHTML = iconHtml;
    };

    isFavorite(track.id).then(fav => updateFavIcons(fav));

    const handleFavToggle = async (e) => {
      e.stopPropagation();
      const isNowFav = await toggleFavorite(track.id);
      updateFavIcons(isNowFav);
    };

    if (mobileFavBtn) mobileFavBtn.addEventListener('click', handleFavToggle);
    if (desktopFavBtn) desktopFavBtn.addEventListener('click', handleFavToggle);

    // Mobile progress line click
    const mobileProgressTrack = this.element.querySelector('#mini-progress-track');
    if (mobileProgressTrack) {
      mobileProgressTrack.addEventListener('click', (e) => {
        e.stopPropagation();
        const rect = mobileProgressTrack.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const pct = (clickX / rect.width) * 100;
        player.seekPercent(pct);
      });
    }

    // --- Desktop Clicks ---
    const desktopArtClick = this.element.querySelector('#desktop-artwork-click');
    const desktopInfoClick = this.element.querySelector('#desktop-info-click');
    const desktopExpandBtn = this.element.querySelector('#desktop-expand-btn');

    const handleOpenFull = () => {
      if (this.onOpenFullPlayer) this.onOpenFullPlayer();
    };

    if (desktopArtClick) desktopArtClick.addEventListener('click', handleOpenFull);
    if (desktopInfoClick) desktopInfoClick.addEventListener('click', handleOpenFull);
    if (desktopExpandBtn) desktopExpandBtn.addEventListener('click', handleOpenFull);

    const desktopPlayBtn = this.element.querySelector('#desktop-play-btn');
    if (desktopPlayBtn) {
      desktopPlayBtn.addEventListener('click', () => player.togglePlay());
    }

    const desktopPrevBtn = this.element.querySelector('#desktop-prev-btn');
    if (desktopPrevBtn) {
      desktopPrevBtn.addEventListener('click', () => player.previous());
    }

    const desktopNextBtn = this.element.querySelector('#desktop-next-btn');
    if (desktopNextBtn) {
      desktopNextBtn.addEventListener('click', () => player.next());
    }

    const desktopShuffleBtn = this.element.querySelector('#desktop-shuffle-btn');
    if (desktopShuffleBtn) {
      desktopShuffleBtn.addEventListener('click', () => player.toggleShuffle());
    }

    const desktopRepeatBtn = this.element.querySelector('#desktop-repeat-btn');
    if (desktopRepeatBtn) {
      desktopRepeatBtn.addEventListener('click', () => player.toggleRepeat());
    }

    const desktopQueueBtn = this.element.querySelector('#desktop-queue-btn');
    if (desktopQueueBtn) {
      desktopQueueBtn.addEventListener('click', () => {
        if (this.onOpenQueue) {
          this.onOpenQueue();
        } else {
          // Fallback trigger if queue drawer passed via app
          const qd = document.getElementById('queue-drawer');
          if (qd) {
            qd.classList.remove('pointer-events-none', 'opacity-0');
            const panel = qd.querySelector('.queue-panel');
            if (panel) panel.classList.remove('translate-x-full');
          }
        }
      });
    }

    // Desktop Seek Slider
    const seekSlider = this.element.querySelector('#desktop-seek-slider');
    const currTimeLabel = this.element.querySelector('#desktop-current-time');

    if (seekSlider) {
      seekSlider.addEventListener('input', (e) => {
        this.isDesktopScrubbing = true;
        const targetSec = parseFloat(e.target.value);
        if (currTimeLabel) currTimeLabel.textContent = formatDuration(targetSec);
        const max = parseFloat(seekSlider.max) || 100;
        const pct = max > 0 ? Math.min(100, Math.max(0, (targetSec / max) * 100)) : 0;
        seekSlider.style.setProperty('--progress', `${pct}%`);
      });

      seekSlider.addEventListener('change', (e) => {
        const targetSec = parseFloat(e.target.value);
        player.seek(targetSec);
        this.isDesktopScrubbing = false;
        const max = parseFloat(seekSlider.max) || 100;
        const pct = max > 0 ? Math.min(100, Math.max(0, (targetSec / max) * 100)) : 0;
        seekSlider.style.setProperty('--progress', `${pct}%`);
      });
    }

    // Desktop Volume Slider
    const volumeBtn = this.element.querySelector('#desktop-volume-btn');
    const volumeSlider = this.element.querySelector('#desktop-volume-slider');

    if (volumeBtn && volumeSlider) {
      volumeBtn.addEventListener('click', () => {
        player.toggleMute();
        const val = player.isMuted ? 0 : player.volume;
        volumeSlider.value = val;
        volumeSlider.style.setProperty('--progress', `${val * 100}%`);
        volumeBtn.innerHTML = player.isMuted || player.volume === 0 ? icons.volumeMute('w-4 h-4') : icons.volume('w-4 h-4');
      });

      volumeSlider.addEventListener('input', (e) => {
        const vol = parseFloat(e.target.value);
        player.setVolume(vol);
        volumeSlider.style.setProperty('--progress', `${vol * 100}%`);
        volumeBtn.innerHTML = vol === 0 ? icons.volumeMute('w-4 h-4') : icons.volume('w-4 h-4');
      });
    }
  }

  bindPlayerEvents() {
    player.on('trackChange', () => {
      this.render();
    });

    player.on('playbackChange', (isPlaying) => {
      const mobilePlayBtn = this.element.querySelector('#mini-play-btn');
      if (mobilePlayBtn) {
        mobilePlayBtn.innerHTML = isPlaying ? icons.pause('w-5 h-5') : icons.play('w-5 h-5 ml-0.5');
      }

      const desktopPlayBtn = this.element.querySelector('#desktop-play-btn');
      if (desktopPlayBtn) {
        desktopPlayBtn.innerHTML = isPlaying ? icons.pause('w-4 h-4') : icons.play('w-4 h-4 ml-0.5');
        desktopPlayBtn.title = isPlaying ? 'Pause' : 'Play';
      }
    });

    player.on('timeUpdate', ({ currentTime, duration, percent }) => {
      // Mobile slim bar
      if (this.mobileProgressBar) {
        this.mobileProgressBar.style.width = `${Math.min(100, Math.max(0, percent))}%`;
      }

      // Desktop Seeker & Timestamps
      if (this.desktopSeekSlider && !this.isDesktopScrubbing) {
        if (isFinite(duration) && duration > 0) {
          this.desktopSeekSlider.max = duration;
          this.desktopSeekSlider.value = currentTime;
          const pct = typeof percent === 'number' ? percent : (currentTime / duration) * 100;
          this.desktopSeekSlider.style.setProperty('--progress', `${pct}%`);
        }

        const currLabel = this.element.querySelector('#desktop-current-time');
        const totalLabel = this.element.querySelector('#desktop-total-time');

        if (currLabel) currLabel.textContent = formatDuration(currentTime);
        if (totalLabel && isFinite(duration) && duration > 0) totalLabel.textContent = formatDuration(duration);
      }
    });

    player.on('modeChange', ({ shuffle, repeat }) => {
      const desktopShuffleBtn = this.element.querySelector('#desktop-shuffle-btn');
      if (desktopShuffleBtn) {
        if (shuffle) {
          desktopShuffleBtn.className = 'p-1.5 rounded-lg transition-all focus:outline-none text-cyan-400 bg-cyan-400/10';
        } else {
          desktopShuffleBtn.className = 'p-1.5 rounded-lg transition-all focus:outline-none text-slate-400 hover:text-white';
        }
      }

      const desktopRepeatBtn = this.element.querySelector('#desktop-repeat-btn');
      if (desktopRepeatBtn) {
        if (repeat !== 'off') {
          desktopRepeatBtn.className = 'p-1.5 rounded-lg transition-all focus:outline-none text-cyan-400 bg-cyan-400/10';
          desktopRepeatBtn.innerHTML = repeat === 'one' ? icons.repeatOne('w-4 h-4') : icons.repeat('w-4 h-4');
        } else {
          desktopRepeatBtn.className = 'p-1.5 rounded-lg transition-all focus:outline-none text-slate-400 hover:text-white';
          desktopRepeatBtn.innerHTML = icons.repeat('w-4 h-4');
        }
      }
    });

    player.on('volumeChange', ({ volume, isMuted }) => {
      const volumeBtn = this.element.querySelector('#desktop-volume-btn');
      const volumeSlider = this.element.querySelector('#desktop-volume-slider');
      const val = isMuted ? 0 : volume;

      if (volumeSlider) {
        volumeSlider.value = val;
        volumeSlider.style.setProperty('--progress', `${val * 100}%`);
      }
      if (volumeBtn) {
        volumeBtn.innerHTML = isMuted || volume === 0 ? icons.volumeMute('w-4 h-4') : icons.volume('w-4 h-4');
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
