// LocalTunes Playlist Detail View
import { getPlaylistById, getAllTracks, removeTrackFromPlaylist, deletePlaylist, renamePlaylist, addTrackToPlaylist } from '../services/musicStorage.js';
import { player } from '../services/player.js';
import { icons } from '../utils/icons.js';
import { renderTrackItem } from '../components/TrackItem.js';
import { formatDuration } from '../utils/formatters.js';
import { getArtworkSrc } from '../utils/artworkGenerator.js';
import { modal } from '../components/Modal.js';
import { toast } from '../components/Toast.js';

export async function renderPlaylistDetailPage(container, playlistId, { onBack, onNavigate }) {
  async function refresh() {
    const playlist = await getPlaylistById(playlistId);
    if (!playlist) {
      onBack();
      return;
    }

    const allTracks = await getAllTracks();
    const trackMap = new Map(allTracks.map(t => [t.id, t]));

    const playlistTracks = (playlist.trackIds || [])
      .map(id => trackMap.get(id))
      .filter(Boolean);

    const totalSecs = playlistTracks.reduce((sum, t) => sum + (t.duration || 0), 0);
    const firstTrack = playlistTracks[0];

    container.innerHTML = `
      <div class="space-y-6 pb-12 animate-fadeIn">
        <!-- Back Button -->
        <button id="pldetail-back-btn" class="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Playlists</span>
        </button>

        <!-- Playlist Hero Banner -->
        <div class="flex flex-col sm:flex-row items-center sm:items-end gap-6 p-6 rounded-3xl bg-gradient-to-r from-purple-950/40 via-dark-card to-dark-surface border border-purple-500/20">
          <div class="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden shadow-2xl flex-shrink-0 bg-dark-surface border border-white/10 flex items-center justify-center">
            ${firstTrack ? `
              <img src="${getArtworkSrc(firstTrack)}" class="w-full h-full object-cover" />
            ` : `
              <div class="text-purple-400">
                ${icons.playlists('w-16 h-16')}
              </div>
            `}
          </div>

          <div class="text-center sm:text-left flex-1 min-w-0">
            <div class="text-xs uppercase tracking-widest font-semibold text-purple-400">Custom Playlist</div>
            <h2 class="text-2xl sm:text-3xl font-extrabold text-white mt-1 truncate">${escapeHtml(playlist.name)}</h2>
            ${playlist.description ? `
              <p class="text-xs text-slate-300 mt-1 max-w-lg">${escapeHtml(playlist.description)}</p>
            ` : ''}
            <p class="text-xs sm:text-sm text-slate-400 mt-1">${playlistTracks.length} song${playlistTracks.length === 1 ? '' : 's'} &bull; ${formatDuration(totalSecs)}</p>

            <div class="flex items-center justify-center sm:justify-start gap-2.5 mt-4 flex-wrap">
              ${playlistTracks.length > 0 ? `
                <button id="pldetail-play-all-btn" class="px-5 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-500/25 transition-all">
                  ${icons.play('w-4 h-4')}
                  <span>Play</span>
                </button>
                <button id="pldetail-shuffle-btn" class="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs flex items-center gap-2 transition-all">
                  ${icons.shuffle('w-4 h-4 text-purple-400')}
                  <span>Shuffle</span>
                </button>
              ` : ''}

              <button id="pldetail-add-tracks-btn" class="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-medium text-xs flex items-center gap-1.5 transition-colors border border-white/5">
                ${icons.plus('w-4 h-4 text-cyan-400')}
                <span>Add Songs</span>
              </button>

              <button id="pldetail-rename-btn" class="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors" title="Rename Playlist">
                ${icons.edit('w-4 h-4')}
              </button>

              <button id="pldetail-delete-btn" class="p-2.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors" title="Delete Playlist">
                ${icons.trash('w-4 h-4')}
              </button>
            </div>
          </div>
        </div>

        <!-- Tracks List -->
        <div id="pldetail-tracks-container"></div>
      </div>
    `;

    const tracksContainer = container.querySelector('#pldetail-tracks-container');

    if (playlistTracks.length === 0) {
      tracksContainer.innerHTML = `
        <div class="py-16 text-center text-slate-400 text-sm">
          <p class="font-medium text-white mb-1">This playlist is empty</p>
          <p class="text-xs text-slate-500 mb-5">Add songs from your library to this playlist.</p>
          <button id="pldetail-empty-add-btn" class="px-5 py-2.5 rounded-xl bg-purple-500 text-white font-semibold text-xs shadow-glow">
            Add Songs
          </button>
        </div>
      `;
      tracksContainer.querySelector('#pldetail-empty-add-btn').addEventListener('click', () => {
        openAddTracksToPlaylistModal(playlist, allTracks, () => refresh());
      });
    } else {
      const listEl = document.createElement('div');
      listEl.className = 'space-y-1';
      playlistTracks.forEach((track, index) => {
        const item = renderTrackItem(track, {
          index,
          playlistId: playlist.id,
          contextQueue: playlistTracks,
          onTrackRemoved: () => refresh(),
        });
        listEl.appendChild(item);
      });
      tracksContainer.appendChild(listEl);
    }

    // Bind Hero Actions
    container.querySelector('#pldetail-back-btn').addEventListener('click', onBack);

    const playAllBtn = container.querySelector('#pldetail-play-all-btn');
    if (playAllBtn) {
      playAllBtn.addEventListener('click', () => {
        player.setQueue(playlistTracks, 0, true);
      });
    }

    const shuffleBtn = container.querySelector('#pldetail-shuffle-btn');
    if (shuffleBtn) {
      shuffleBtn.addEventListener('click', () => {
        player.shuffle = true;
        player.setQueue(playlistTracks, Math.floor(Math.random() * playlistTracks.length), true);
      });
    }

    container.querySelector('#pldetail-add-tracks-btn').addEventListener('click', () => {
      openAddTracksToPlaylistModal(playlist, allTracks, () => refresh());
    });

    container.querySelector('#pldetail-rename-btn').addEventListener('click', () => {
      openRenamePlaylistModal(playlist, () => refresh());
    });

    container.querySelector('#pldetail-delete-btn').addEventListener('click', () => {
      confirmDeletePlaylist(playlist, onBack);
    });
  }

  await refresh();
}

function openAddTracksToPlaylistModal(playlist, allTracks, onDone) {
  const existingSet = new Set(playlist.trackIds || []);
  const availableTracks = allTracks.filter(t => !existingSet.has(t.id));

  if (availableTracks.length === 0) {
    modal.show({
      title: 'Add Songs',
      contentHtml: `<p class="text-sm text-slate-300">All songs from your library are already in this playlist!</p>`,
      showCancel: false,
      confirmText: 'Done'
    });
    return;
  }

  const listHtml = availableTracks.map(t => `
    <div class="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors">
      <div class="flex items-center gap-3 min-w-0 pr-2">
        <img src="${getArtworkSrc(t)}" class="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
        <div class="min-w-0">
          <div class="text-xs font-medium text-white truncate">${escapeHtml(t.title || t.fileName)}</div>
          <div class="text-[11px] text-slate-400 truncate">${escapeHtml(t.artist || 'Unknown Artist')}</div>
        </div>
      </div>
      <button class="add-single-track-btn px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center gap-1 transition-colors flex-shrink-0" data-id="${t.id}">
        ${icons.plus('w-3.5 h-3.5')}
        <span>Add</span>
      </button>
    </div>
  `).join('');

  const modalEl = modal.show({
    title: `Add Songs to "${escapeHtml(playlist.name)}"`,
    contentHtml: `
      <div class="flex flex-col gap-1 max-h-72 overflow-y-auto pr-1">
        ${listHtml}
      </div>
    `,
    showCancel: false,
    confirmText: 'Close',
  });

  modalEl.querySelectorAll('.add-single-track-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const trackId = btn.dataset.id;
      await addTrackToPlaylist(playlist.id, trackId);
      btn.innerHTML = `${icons.check('w-3.5 h-3.5')} Added`;
      btn.classList.remove('bg-cyan-500/20', 'text-cyan-300');
      btn.classList.add('bg-emerald-500/20', 'text-emerald-300');
      btn.disabled = true;
      onDone();
    });
  });
}

function openRenamePlaylistModal(playlist, onDone) {
  modal.show({
    title: 'Rename Playlist',
    contentHtml: `
      <div class="space-y-3">
        <label class="block text-xs font-medium text-slate-300">Playlist Name</label>
        <input type="text" id="rename-playlist-input" value="${escapeHtml(playlist.name)}" class="w-full px-3.5 py-2.5 bg-dark-bg border border-dark-border rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500" />
      </div>
    `,
    confirmText: 'Save',
    onConfirm: async (overlay) => {
      const input = overlay.querySelector('#rename-playlist-input');
      const newName = input.value.trim();
      if (!newName) {
        toast.show({ message: 'Playlist name cannot be empty', type: 'warning' });
        return false;
      }
      await renamePlaylist(playlist.id, newName);
      toast.show({ message: 'Playlist renamed', type: 'success' });
      onDone();
      return true;
    }
  });
}

function confirmDeletePlaylist(playlist, onDone) {
  modal.show({
    title: 'Delete Playlist',
    contentHtml: `
      <p class="text-slate-300">Are you sure you want to delete <span class="font-semibold text-white">"${escapeHtml(playlist.name)}"</span>?</p>
      <p class="text-xs text-slate-400 mt-2">The songs in this playlist will remain safe in your library.</p>
    `,
    confirmText: 'Delete',
    confirmStyle: 'danger',
    onConfirm: async () => {
      await deletePlaylist(playlist.id);
      toast.show({ message: `Deleted playlist "${playlist.name}"`, type: 'info' });
      onDone();
    }
  });
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
