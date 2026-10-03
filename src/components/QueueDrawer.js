// LocalTunes Queue Drawer Component
import { player } from '../services/player.js';
import { icons } from '../utils/icons.js';
import { formatDuration } from '../utils/formatters.js';
import { getArtworkSrc } from '../utils/artworkGenerator.js';
import { toast } from './Toast.js';

export class QueueDrawer {
  constructor() {
    this.element = null;
    this.isOpen = false;

    this.init();
    this.bindPlayerEvents();
  }

  init() {
    this.element = document.createElement('div');
    this.element.id = 'queue-drawer';
    this.element.className = 'fixed inset-0 z-50 pointer-events-none opacity-0 transition-opacity duration-200';
    document.body.appendChild(this.element);

    this.render();
  }

  open() {
    this.isOpen = true;
    this.render();
    this.element.classList.remove('pointer-events-none', 'opacity-0');
    const panel = this.element.querySelector('.queue-panel');
    if (panel) panel.classList.remove('translate-x-full');
  }

  close() {
    this.isOpen = false;
    const panel = this.element.querySelector('.queue-panel');
    if (panel) panel.classList.add('translate-x-full');
    this.element.classList.add('opacity-0');
    setTimeout(() => {
      if (!this.isOpen) {
        this.element.classList.add('pointer-events-none');
      }
    }, 200);
  }

  render() {
    const queue = player.queue || [];
    const currentIdx = player.currentIndex;
    const currentTrack = player.currentTrack;
    const upcoming = queue.slice(currentIdx + 1);

    this.element.innerHTML = `
      <!-- Backdrop -->
      <div class="queue-backdrop absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"></div>

      <!-- Slide-in Drawer (Right on desktop, Bottom sheet on mobile) -->
      <div class="queue-panel absolute right-0 top-0 bottom-0 w-full max-w-md bg-dark-surface border-l border-dark-border shadow-2xl flex flex-col transform translate-x-full transition-transform duration-300 ease-out pt-safe pb-safe pointer-events-auto">
        <!-- Header -->
        <div class="p-5 border-b border-dark-border flex items-center justify-between">
          <div>
            <h3 class="text-lg font-bold text-white tracking-wide">Play Queue</h3>
            <p class="text-xs text-slate-400 mt-0.5">${queue.length} track${queue.length === 1 ? '' : 's'} in queue</p>
          </div>
          <div class="flex items-center gap-2">
            ${queue.length > 0 ? `
              <button id="queue-clear-btn" class="px-3 py-1.5 text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors font-medium">
                Clear
              </button>
            ` : ''}
            <button id="queue-close-btn" class="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
              ${icons.x('w-5 h-5')}
            </button>
          </div>
        </div>

        <!-- Scrollable Track List -->
        <div class="flex-1 overflow-y-auto p-4 space-y-5">
          <!-- Currently Playing -->
          ${currentTrack ? `
            <div>
              <div class="text-xs uppercase tracking-wider font-semibold text-cyan-400 mb-2 flex items-center gap-1.5">
                <span>Now Playing</span>
                <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
              </div>
              <div class="flex items-center gap-3 p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
                <img src="${getArtworkSrc(currentTrack)}" class="w-12 h-12 rounded-xl object-cover shadow-md flex-shrink-0" />
                <div class="flex-1 min-w-0">
                  <div class="font-semibold text-white text-sm truncate">${escapeHtml(currentTrack.title || currentTrack.fileName)}</div>
                  <div class="text-xs text-slate-400 truncate mt-0.5">${escapeHtml(currentTrack.artist || 'Unknown Artist')}</div>
                </div>
                <div class="text-xs font-mono text-cyan-400 flex-shrink-0">
                  ${formatDuration(player.currentTime)} / ${formatDuration(player.duration)}
                </div>
              </div>
            </div>
          ` : ''}

          <!-- Up Next -->
          <div>
            <div class="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-2 flex items-center justify-between">
              <span>Up Next (${upcoming.length})</span>
              ${upcoming.length > 1 ? `
                <button id="queue-shuffle-btn" class="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300">
                  ${icons.shuffle('w-3.5 h-3.5')}
                  <span>Shuffle Rest</span>
                </button>
              ` : ''}
            </div>

            ${upcoming.length === 0 ? `
              <div class="py-8 text-center text-slate-500 text-xs">
                No upcoming songs in the queue.
              </div>
            ` : `
              <div class="space-y-1.5" id="queue-upcoming-list">
                ${upcoming.map((t, idx) => {
                  const actualQueueIndex = currentIdx + 1 + idx;
                  return `
                    <div class="group flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer" data-queue-index="${actualQueueIndex}">
                      <span class="text-xs text-slate-500 font-mono w-5 text-center">${idx + 1}</span>
                      <img src="${getArtworkSrc(t)}" class="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      <div class="flex-1 min-w-0">
                        <div class="font-medium text-slate-200 group-hover:text-white text-xs truncate">${escapeHtml(t.title || t.fileName)}</div>
                        <div class="text-[11px] text-slate-400 truncate">${escapeHtml(t.artist || 'Unknown Artist')}</div>
                      </div>
                      <span class="text-[11px] font-mono text-slate-500 group-hover:text-slate-400">${formatDuration(t.duration)}</span>
                      <button class="queue-remove-btn opacity-80 sm:opacity-0 sm:group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-400 transition-opacity rounded-lg" data-remove-index="${actualQueueIndex}" aria-label="Remove from queue">
                        ${icons.trash('w-4 h-4')}
                      </button>
                    </div>
                  `;
                }).join('')}
              </div>
            `}
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const closeBtn = this.element.querySelector('#queue-close-btn');
    const backdrop = this.element.querySelector('.queue-backdrop');
    if (closeBtn) closeBtn.addEventListener('click', () => this.close());
    if (backdrop) backdrop.addEventListener('click', () => this.close());

    const clearBtn = this.element.querySelector('#queue-clear-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        player.clearQueue();
        toast.show({ message: 'Queue cleared', type: 'info' });
        this.render();
      });
    }

    const shuffleRestBtn = this.element.querySelector('#queue-shuffle-btn');
    if (shuffleRestBtn) {
      shuffleRestBtn.addEventListener('click', () => {
        const currentIdx = player.currentIndex;
        const head = player.queue.slice(0, currentIdx + 1);
        const tail = player.queue.slice(currentIdx + 1);
        player.shuffleArray(tail);
        player.queue = [...head, ...tail];
        player.emit('queueChange', { queue: player.queue, currentIndex: player.currentIndex });
        toast.show({ message: 'Shuffled upcoming tracks', type: 'info' });
        this.render();
      });
    }

    // Upcoming list item clicks
    const upcomingList = this.element.querySelector('#queue-upcoming-list');
    if (upcomingList) {
      upcomingList.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('.queue-remove-btn');
        if (removeBtn) {
          e.stopPropagation();
          const removeIdx = parseInt(removeBtn.dataset.removeIndex, 10);
          player.removeFromQueue(removeIdx);
          this.render();
          return;
        }

        const row = e.target.closest('[data-queue-index]');
        if (row) {
          const qIdx = parseInt(row.dataset.queueIndex, 10);
          player.loadTrackAtIndex(qIdx, true);
          this.render();
        }
      });
    }
  }

  bindPlayerEvents() {
    player.on('queueChange', () => {
      if (this.isOpen) this.render();
    });

    player.on('trackChange', () => {
      if (this.isOpen) this.render();
    });
  }
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
