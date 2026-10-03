// LocalTunes Favorites Page
import { getFavoriteTracks } from '../services/musicStorage.js';
import { player } from '../services/player.js';
import { icons } from '../utils/icons.js';
import { renderTrackItem } from '../components/TrackItem.js';
import { formatDuration } from '../utils/formatters.js';

export async function renderFavoritesPage(container, { onNavigate }) {
  async function refresh() {
    const favoriteTracks = await getFavoriteTracks();
    const totalSecs = favoriteTracks.reduce((sum, t) => sum + (t.duration || 0), 0);

    container.innerHTML = `
      <div class="space-y-6 pb-12 animate-fadeIn">
        <!-- Header Banner -->
        <div class="flex flex-col sm:flex-row items-center sm:items-end gap-6 p-6 rounded-3xl bg-gradient-to-r from-rose-950/40 via-dark-card to-dark-surface border border-rose-500/20">
          <div class="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl bg-gradient-to-tr from-rose-600 to-pink-500 flex items-center justify-center text-white shadow-2xl flex-shrink-0">
            ${icons.heartFilled('w-16 h-16 text-white')}
          </div>

          <div class="text-center sm:text-left flex-1 min-w-0">
            <div class="text-xs uppercase tracking-widest font-semibold text-rose-400">Playlist</div>
            <h2 class="text-2xl sm:text-4xl font-extrabold text-white mt-1">Favorites</h2>
            <p class="text-xs sm:text-sm text-slate-400 mt-1">${favoriteTracks.length} song${favoriteTracks.length === 1 ? '' : 's'} &bull; ${formatDuration(totalSecs)}</p>

            ${favoriteTracks.length > 0 ? `
              <div class="flex items-center justify-center sm:justify-start gap-3 mt-4">
                <button id="fav-play-all-btn" class="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-500/20 transition-all">
                  ${icons.play('w-4 h-4')}
                  <span>Play All</span>
                </button>
                <button id="fav-shuffle-btn" class="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs flex items-center gap-2 transition-all">
                  ${icons.shuffle('w-4 h-4 text-rose-400')}
                  <span>Shuffle</span>
                </button>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Songs Content -->
        <div id="favorites-content"></div>
      </div>
    `;

    const content = container.querySelector('#favorites-content');

    if (favoriteTracks.length === 0) {
      content.innerHTML = `
        <div class="py-16 text-center text-slate-400 text-sm">
          <div class="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3 text-slate-500">
            ${icons.heart('w-6 h-6')}
          </div>
          <p class="font-medium text-white mb-1">No favorites yet</p>
          <p class="text-xs text-slate-500 max-w-xs mx-auto mb-5">Tap the heart icon on any song in your library to add it to your favorites.</p>
          <button id="fav-goto-lib" class="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white font-medium transition-colors">
            Browse Library
          </button>
        </div>
      `;

      content.querySelector('#fav-goto-lib').addEventListener('click', () => onNavigate('library'));
      return;
    }

    const listEl = document.createElement('div');
    listEl.className = 'space-y-1';
    favoriteTracks.forEach((track, index) => {
      const item = renderTrackItem(track, {
        index,
        contextQueue: favoriteTracks,
        onFavoriteChanged: () => refresh(),
        onTrackRemoved: () => refresh(),
      });
      listEl.appendChild(item);
    });
    content.appendChild(listEl);

    // Bind Play All / Shuffle
    const playAllBtn = container.querySelector('#fav-play-all-btn');
    if (playAllBtn) {
      playAllBtn.addEventListener('click', () => {
        player.setQueue(favoriteTracks, 0, true);
      });
    }

    const shuffleBtn = container.querySelector('#fav-shuffle-btn');
    if (shuffleBtn) {
      shuffleBtn.addEventListener('click', () => {
        player.shuffle = true;
        player.setQueue(favoriteTracks, Math.floor(Math.random() * favoriteTracks.length), true);
      });
    }
  }

  await refresh();
}
