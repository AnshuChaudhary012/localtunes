// LocalTunes Mini Player Component
import { player } from '../services/player.js';
import { icons } from '../utils/icons.js';
import { getArtworkSrc } from '../utils/artworkGenerator.js';
import { isFavorite, toggleFavorite } from '../services/musicStorage.js';
import { settingsService } from '../services/settingsService.js';

export class MiniPlayer {
  constructor(container, onOpenFullPlayer) {
    this.container = container;
    this.onOpenFullPlayer = onOpenFullPlayer;
    this.element = null;
    this.progressBar = null;

    this.init();
    this.bindPlayerEvents();
  }

  init() {
    this.element = document.createElement('div');
    this.element.id = 'mini-player';
    this.element.className = 'w-full bg-dark-card/90 backdrop-blur-xl border-t border-dark-border/80 shadow-glass transition-transform duration-300 transform translate-y-full';
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
    const showProgressBar = settingsService.get('showMiniProgressBar');

    this.element.innerHTML = `
      <!-- Slim Top Progress Indicator Line -->
      <div class="w-full h-1 bg-white/10 relative overflow-hidden cursor-pointer ${showProgressBar ? '' : 'hidden'}" id="mini-progress-track">
        <div id="mini-progress-fill" class="h-full bg-gradient-to-r from-cyan-400 to-purple-500 w-0 transition-all duration-100"></div>
      </div>

      <div class="px-4 py-2.5 flex items-center justify-between gap-3">
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

        <!-- Controls -->
        <div class="flex items-center gap-1 sm:gap-2 flex-shrink-0">
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
    `;

    this.progressBar = this.element.querySelector('#mini-progress-fill');

    // Make visible
    this.element.classList.remove('translate-y-full');
    this.element.classList.add('translate-y-0');

    // Bind clicks
    this.element.querySelector('#mini-player-clickable').addEventListener('click', () => {
      if (this.onOpenFullPlayer) this.onOpenFullPlayer();
    });

    const playBtn = this.element.querySelector('#mini-play-btn');
    playBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      player.togglePlay();
    });

    const nextBtn = this.element.querySelector('#mini-next-btn');
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      player.next();
    });

    const favBtn = this.element.querySelector('#mini-fav-btn');
    isFavorite(track.id).then(fav => {
      if (fav) {
        favBtn.innerHTML = icons.heartFilled('w-5 h-5 text-rose-500');
      }
    });

    favBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const isNowFav = await toggleFavorite(track.id);
      favBtn.innerHTML = isNowFav ? icons.heartFilled('w-5 h-5 text-rose-500') : icons.heart('w-5 h-5');
    });

    // Seek on mini progress track
    const progressTrack = this.element.querySelector('#mini-progress-track');
    progressTrack.addEventListener('click', (e) => {
      e.stopPropagation();
      const rect = progressTrack.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const pct = (clickX / rect.width) * 100;
      player.seekPercent(pct);
    });
  }

  bindPlayerEvents() {
    player.on('trackChange', (track) => {
      this.render();
    });

    player.on('playbackChange', (isPlaying) => {
      const playBtn = this.element.querySelector('#mini-play-btn');
      if (playBtn) {
        playBtn.innerHTML = isPlaying ? icons.pause('w-5 h-5') : icons.play('w-5 h-5 ml-0.5');
      }
    });

    player.on('timeUpdate', ({ percent }) => {
      if (this.progressBar) {
        this.progressBar.style.width = `${Math.min(100, Math.max(0, percent))}%`;
      }
    });

    settingsService.on('change', ({ key, value }) => {
      if (key === 'showMiniProgressBar') {
        const trackBar = this.element.querySelector('#mini-progress-track');
        if (trackBar) {
          if (value) {
            trackBar.classList.remove('hidden');
          } else {
            trackBar.classList.add('hidden');
          }
        }
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
