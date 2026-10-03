// LocalTunes Playlists Page
import { getPlaylists, createPlaylist, getAllTracks, deletePlaylist, renamePlaylist } from '../services/musicStorage.js';
import { player } from '../services/player.js';
import { icons } from '../utils/icons.js';
import { getArtworkSrc } from '../utils/artworkGenerator.js';
import { modal } from '../components/Modal.js';
import { toast } from '../components/Toast.js';
import { renderPlaylistDetailPage } from './PlaylistDetailPage.js';

export async function renderPlaylistsPage(container, { onNavigate, selectedPlaylistId = null }) {
  let activePlaylistId = selectedPlaylistId;

  async function refresh() {
    if (activePlaylistId) {
      renderPlaylistDetailPage(container, activePlaylistId, {
        onBack: () => {
          activePlaylistId = null;
          refresh();
        },
        onNavigate,
      });
      return;
    }

    const playlists = await getPlaylists();
    const allTracks = await getAllTracks();
    const trackMap = new Map(allTracks.map(t => [t.id, t]));

    container.innerHTML = `
      <div class="space-y-6 pb-12 animate-fadeIn">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Playlists</h2>
            <p class="text-xs sm:text-sm text-slate-400 mt-1">Organize your music collection into custom playlists</p>
          </div>

          <button id="pl-create-btn" class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white font-semibold text-xs flex items-center gap-2 shadow-glow-purple transition-all transform active:scale-95">
            ${icons.plus('w-4 h-4')}
            <span>New Playlist</span>
          </button>
        </div>

        <!-- Playlists Grid -->
        <div id="playlists-grid-area"></div>
      </div>
    `;

    const gridArea = container.querySelector('#playlists-grid-area');

    if (playlists.length === 0) {
      gridArea.innerHTML = `
        <div class="py-16 text-center text-slate-400 text-sm">
          <div class="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto mb-3">
            ${icons.playlists('w-7 h-7')}
          </div>
          <p class="font-semibold text-white mb-1 text-base">No playlists yet</p>
          <p class="text-xs text-slate-500 max-w-xs mx-auto mb-6">Create a playlist to group your songs for parties, workouts, focus, or relaxation.</p>
          <button id="pl-empty-create-btn" class="px-5 py-2.5 rounded-xl bg-purple-500 text-white font-semibold text-xs shadow-glow-purple">
            Create Your First Playlist
          </button>
        </div>
      `;

      gridArea.querySelector('#pl-empty-create-btn').addEventListener('click', () => {
        openCreatePlaylistModal(() => refresh());
      });
    } else {
      const grid = document.createElement('div');
      grid.className = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4';

      playlists.forEach(pl => {
        const firstTrackId = pl.trackIds && pl.trackIds[0];
        const firstTrack = firstTrackId ? trackMap.get(firstTrackId) : null;
        const trackCount = pl.trackIds ? pl.trackIds.length : 0;

        const card = document.createElement('div');
        card.className = 'playlist-card group p-3.5 rounded-2xl bg-dark-card/60 hover:bg-dark-card border border-dark-border/60 hover:border-dark-border transition-all cursor-pointer relative';
        card.dataset.id = pl.id;

        card.innerHTML = `
          <div class="relative aspect-square rounded-xl overflow-hidden mb-3 shadow-md bg-dark-surface flex items-center justify-center border border-white/5">
            ${firstTrack ? `
              <img src="${getArtworkSrc(firstTrack)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            ` : `
              <div class="text-purple-400/80 group-hover:scale-110 transition-transform">
                ${icons.playlists('w-12 h-12')}
              </div>
            `}

            ${trackCount > 0 ? `
              <button class="pl-quick-play-btn absolute bottom-2 right-2 w-10 h-10 rounded-full bg-purple-500 hover:bg-purple-400 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 shadow-glow-purple transition-all transform hover:scale-110" aria-label="Play playlist">
                ${icons.play('w-5 h-5 ml-0.5')}
              </button>
            ` : ''}
          </div>

          <div class="font-bold text-sm text-white truncate">${escapeHtml(pl.name)}</div>
          <div class="text-xs text-slate-400 truncate mt-0.5">${trackCount} song${trackCount === 1 ? '' : 's'}</div>
        `;

        // Card Click -> open detail
        card.addEventListener('click', (e) => {
          if (e.target.closest('.pl-quick-play-btn')) return;
          activePlaylistId = pl.id;
          refresh();
        });

        // Quick play button
        const quickPlay = card.querySelector('.pl-quick-play-btn');
        if (quickPlay) {
          quickPlay.addEventListener('click', (e) => {
            e.stopPropagation();
            const tracks = (pl.trackIds || []).map(id => trackMap.get(id)).filter(Boolean);
            if (tracks.length > 0) {
              player.setQueue(tracks, 0, true);
            }
          });
        }

        grid.appendChild(card);
      });

      gridArea.appendChild(grid);
    }

    container.querySelector('#pl-create-btn').addEventListener('click', () => {
      openCreatePlaylistModal((newPl) => {
        activePlaylistId = newPl.id;
        refresh();
      });
    });
  }

  await refresh();
}

function openCreatePlaylistModal(onCreated) {
  modal.show({
    title: 'Create Playlist',
    contentHtml: `
      <div class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1.5">Playlist Name</label>
          <input type="text" id="new-pl-name" placeholder="e.g. Chill Vibes, Workout Mix" class="w-full px-3.5 py-2.5 bg-dark-bg border border-dark-border rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1.5">Description (Optional)</label>
          <textarea id="new-pl-desc" rows="2" placeholder="What is this playlist about?" class="w-full px-3.5 py-2.5 bg-dark-bg border border-dark-border rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"></textarea>
        </div>
      </div>
    `,
    confirmText: 'Create Playlist',
    confirmStyle: 'cyan',
    onConfirm: async (overlay) => {
      const nameInput = overlay.querySelector('#new-pl-name');
      const descInput = overlay.querySelector('#new-pl-desc');
      const name = nameInput.value.trim();

      if (!name) {
        toast.show({ message: 'Please enter a playlist name', type: 'warning' });
        return false;
      }

      try {
        const newPl = await createPlaylist(name, descInput.value.trim());
        toast.show({ message: `Created playlist "${name}"`, type: 'success' });
        if (onCreated) onCreated(newPl);
        return true;
      } catch (err) {
        toast.show({ message: err.message, type: 'error' });
        return false;
      }
    }
  });
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
