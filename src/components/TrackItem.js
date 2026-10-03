// LocalTunes TrackItem Component
import { icons } from '../utils/icons.js';
import { formatDuration } from '../utils/formatters.js';
import { getArtworkSrc } from '../utils/artworkGenerator.js';
import { player } from '../services/player.js';
import { isFavorite, toggleFavorite, deleteTrack, getPlaylists, addTrackToPlaylist, removeTrackFromPlaylist } from '../services/musicStorage.js';
import { modal } from './Modal.js';
import { toast } from './Toast.js';

let activeMenuDropdown = null;

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  if (activeMenuDropdown && !activeMenuDropdown.contains(e.target) && !e.target.closest('.track-menu-trigger')) {
    closeActiveMenu();
  }
});

function closeActiveMenu() {
  if (activeMenuDropdown) {
    activeMenuDropdown.remove();
    activeMenuDropdown = null;
  }
}

export function renderTrackItem(track, options = {}) {
  const {
    index = null,
    contextQueue = null,
    showAlbum = true,
    playlistId = null,
    onTrackRemoved = null,
    onFavoriteChanged = null,
  } = options;

  const isCurrent = player.currentTrack && player.currentTrack.id === track.id;
  const isPlaying = isCurrent && player.isPlaying;
  const artworkSrc = getArtworkSrc(track);

  const row = document.createElement('div');
  row.className = `track-item-row group flex items-center gap-3 p-2.5 rounded-xl transition-all duration-150 cursor-pointer ${
    isCurrent ? 'bg-cyan-500/10 border border-cyan-500/20' : 'hover:bg-white/5 border border-transparent'
  }`;
  row.dataset.trackId = track.id;

  row.innerHTML = `
    <!-- Index / Play Indicator -->
    <div class="w-8 flex items-center justify-center flex-shrink-0 text-xs font-medium text-slate-400">
      ${isCurrent && isPlaying ? `
        <div class="flex items-end gap-0.5 h-4">
          <span class="w-1 bg-cyan-400 rounded-full bar-1"></span>
          <span class="w-1 bg-cyan-400 rounded-full bar-2"></span>
          <span class="w-1 bg-cyan-400 rounded-full bar-3"></span>
        </div>
      ` : `
        <span class="group-hover:hidden">${index !== null ? index + 1 : ''}</span>
        <button class="hidden group-hover:flex items-center justify-center text-cyan-400 focus:outline-none" aria-label="Play song">
          ${icons.play('w-4 h-4')}
        </button>
      `}
    </div>

    <!-- Artwork Thumbnail -->
    <div class="track-thumb-box relative w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-dark-surface shadow-sm">
      <img src="${artworkSrc}" alt="${escapeHtml(track.title)}" class="w-full h-full object-cover" loading="lazy" />
      ${isCurrent && isPlaying ? `
        <div class="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div class="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></div>
        </div>
      ` : ''}
    </div>

    <!-- Title and Artist/Album -->
    <div class="flex-1 min-w-0 pr-2">
      <div class="font-medium text-sm truncate ${isCurrent ? 'text-cyan-400 font-semibold' : 'text-slate-100 group-hover:text-white'}">
        ${escapeHtml(track.title || track.fileName || 'Untitled')}
      </div>
      <div class="text-xs text-slate-400 truncate mt-0.5 flex items-center gap-1.5">
        <span>${escapeHtml(track.artist || 'Unknown Artist')}</span>
        ${showAlbum && track.album && track.album !== 'Unknown Album' ? `
          <span class="inline-block w-1 h-1 rounded-full bg-slate-600"></span>
          <span class="text-slate-400">${escapeHtml(track.album)}</span>
        ` : ''}
      </div>
    </div>

    <!-- Duration -->
    <div class="hidden sm:block text-xs text-slate-400 font-mono flex-shrink-0">
      ${formatDuration(track.duration)}
    </div>

    <!-- Favorite Quick Button -->
    <button class="fav-quick-btn p-1.5 text-slate-500 hover:text-rose-500 transition-colors rounded-lg flex-shrink-0 focus:outline-none" aria-label="Toggle favorite">
      ${icons.heart('w-4 h-4')}
    </button>

    <!-- Three-dot Menu Trigger -->
    <button class="track-menu-trigger p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors rounded-lg flex-shrink-0 focus:outline-none" aria-label="More options">
      ${icons.moreVertical('w-4 h-4')}
    </button>
  `;

  // Check initial favorite status
  isFavorite(track.id).then(fav => {
    const favBtn = row.querySelector('.fav-quick-btn');
    if (favBtn && fav) {
      favBtn.innerHTML = icons.heartFilled('w-4 h-4 text-rose-500');
      favBtn.classList.remove('text-slate-500');
    }
  });

  // Row click -> Play
  row.addEventListener('click', (e) => {
    // Ignore clicks on buttons
    if (e.target.closest('button')) return;
    if (contextQueue) {
      player.playTrack(track, contextQueue);
    } else {
      player.playTrack(track);
    }
  });

  // Favorite button click
  const favBtn = row.querySelector('.fav-quick-btn');
  favBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    const isNowFav = await toggleFavorite(track.id);
    if (isNowFav) {
      favBtn.innerHTML = icons.heartFilled('w-4 h-4 text-rose-500');
      favBtn.classList.remove('text-slate-500');
      toast.show({ message: `Added "${track.title}" to Favorites`, type: 'success' });
    } else {
      favBtn.innerHTML = icons.heart('w-4 h-4');
      favBtn.classList.add('text-slate-500');
      toast.show({ message: `Removed "${track.title}" from Favorites`, type: 'info' });
    }
    if (onFavoriteChanged) onFavoriteChanged(track, isNowFav);
  });

  // Three-dot menu button click
  const menuTrigger = row.querySelector('.track-menu-trigger');
  menuTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    openTrackMenu(e, track, { playlistId, onTrackRemoved, onFavoriteChanged, contextQueue });
  });

  return row;
}

async function openTrackMenu(e, track, options = {}) {
  closeActiveMenu();

  const isFav = await isFavorite(track.id);
  const triggerRect = e.currentTarget.getBoundingClientRect();

  const dropdown = document.createElement('div');
  dropdown.className = 'fixed z-50 w-52 py-1.5 rounded-xl glass-dropdown shadow-glass text-sm text-slate-200 animate-fadeIn';

  // Calculate position (keep inside screen bounds)
  let top = triggerRect.bottom + 6;
  let left = triggerRect.right - 208; // 208px is w-52
  if (left < 10) left = 10;
  if (top + 280 > window.innerHeight) {
    top = triggerRect.top - 260;
  }

  dropdown.style.top = `${top}px`;
  dropdown.style.left = `${left}px`;

  dropdown.innerHTML = `
    <button class="menu-action w-full flex items-center gap-3 px-3.5 py-2 text-left hover:bg-white/10 transition-colors" data-action="play">
      ${icons.play('w-4 h-4 text-cyan-400')}
      <span>Play Now</span>
    </button>
    <button class="menu-action w-full flex items-center gap-3 px-3.5 py-2 text-left hover:bg-white/10 transition-colors" data-action="playNext">
      ${icons.skipForward('w-4 h-4 text-cyan-400')}
      <span>Play Next</span>
    </button>
    <button class="menu-action w-full flex items-center gap-3 px-3.5 py-2 text-left hover:bg-white/10 transition-colors" data-action="addToQueue">
      ${icons.queue('w-4 h-4 text-cyan-400')}
      <span>Add to Queue</span>
    </button>
    <div class="h-px bg-white/10 my-1"></div>
    <button class="menu-action w-full flex items-center gap-3 px-3.5 py-2 text-left hover:bg-white/10 transition-colors" data-action="toggleFav">
      ${isFav ? icons.heartFilled('w-4 h-4 text-rose-500') : icons.heart('w-4 h-4')}
      <span>${isFav ? 'Remove Favorite' : 'Add to Favorites'}</span>
    </button>
    <button class="menu-action w-full flex items-center gap-3 px-3.5 py-2 text-left hover:bg-white/10 transition-colors" data-action="addToPlaylist">
      ${icons.playlists('w-4 h-4 text-purple-400')}
      <span>Add to Playlist...</span>
    </button>
    ${options.playlistId ? `
      <button class="menu-action w-full flex items-center gap-3 px-3.5 py-2 text-left hover:bg-rose-500/20 text-rose-400 transition-colors" data-action="removeFromPlaylist">
        ${icons.trash('w-4 h-4')}
        <span>Remove from Playlist</span>
      </button>
    ` : ''}
    <div class="h-px bg-white/10 my-1"></div>
    <button class="menu-action w-full flex items-center gap-3 px-3.5 py-2 text-left hover:bg-rose-500/20 text-rose-400 transition-colors" data-action="delete">
      ${icons.trash('w-4 h-4')}
      <span>Delete from Library</span>
    </button>
  `;

  document.body.appendChild(dropdown);
  activeMenuDropdown = dropdown;

  dropdown.addEventListener('click', async (evt) => {
    const actionBtn = evt.target.closest('.menu-action');
    if (!actionBtn) return;
    const action = actionBtn.dataset.action;
    closeActiveMenu();

    if (action === 'play') {
      if (options.contextQueue) {
        player.playTrack(track, options.contextQueue);
      } else {
        player.playTrack(track);
      }
    } else if (action === 'playNext') {
      if (player.queue.length === 0) {
        player.setQueue([track], 0, true);
      } else {
        player.queue.splice(player.currentIndex + 1, 0, track);
        player.unshuffledQueue.push(track);
        player.emit('queueChange', { queue: player.queue, currentIndex: player.currentIndex });
        toast.show({ message: `"${track.title}" will play next`, type: 'info' });
      }
    } else if (action === 'addToQueue') {
      if (player.queue.length === 0) {
        player.setQueue([track], 0, false);
      } else {
        player.queue.push(track);
        player.unshuffledQueue.push(track);
        player.emit('queueChange', { queue: player.queue, currentIndex: player.currentIndex });
      }
      toast.show({ message: `Added "${track.title}" to Queue`, type: 'info' });
    } else if (action === 'toggleFav') {
      const nowFav = await toggleFavorite(track.id);
      toast.show({
        message: nowFav ? `Added "${track.title}" to Favorites` : `Removed "${track.title}" from Favorites`,
        type: nowFav ? 'success' : 'info'
      });
      if (options.onFavoriteChanged) options.onFavoriteChanged(track, nowFav);
    } else if (action === 'addToPlaylist') {
      openAddToPlaylistDialog(track);
    } else if (action === 'removeFromPlaylist' && options.playlistId) {
      await removeTrackFromPlaylist(options.playlistId, track.id);
      toast.show({ message: `Removed "${track.title}" from playlist`, type: 'info' });
      if (options.onTrackRemoved) options.onTrackRemoved(track);
    } else if (action === 'delete') {
      confirmDeleteTrack(track, options.onTrackRemoved);
    }
  });
}

async function openAddToPlaylistDialog(track) {
  const playlists = await getPlaylists();

  if (playlists.length === 0) {
    modal.show({
      title: 'No Playlists Found',
      contentHtml: `
        <p class="text-slate-300">You don't have any playlists yet. Would you like to create one now?</p>
      `,
      confirmText: 'Create Playlist',
      onConfirm: () => {
        window.location.hash = '#playlists';
      }
    });
    return;
  }

  const listHtml = playlists.map(pl => `
    <button class="pl-select-btn w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/10 transition-colors border border-transparent hover:border-white/10 text-left" data-id="${pl.id}">
      <div>
        <div class="font-medium text-white text-sm">${escapeHtml(pl.name)}</div>
        <div class="text-xs text-slate-400 mt-0.5">${pl.trackIds ? pl.trackIds.length : 0} songs</div>
      </div>
      ${icons.plus('w-4 h-4 text-cyan-400')}
    </button>
  `).join('');

  const modalEl = modal.show({
    title: 'Add to Playlist',
    contentHtml: `
      <p class="text-xs text-slate-400 mb-3">Choose a playlist to add "${escapeHtml(track.title)}":</p>
      <div class="flex flex-col gap-1 max-h-60 overflow-y-auto pr-1">
        ${listHtml}
      </div>
    `,
    showCancel: true,
    cancelText: 'Cancel'
  });

  const buttons = modalEl.querySelectorAll('.pl-select-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', async () => {
      const plId = btn.dataset.id;
      const targetPl = playlists.find(p => p.id === plId);
      await addTrackToPlaylist(plId, track.id);
      modal.close();
      toast.show({ message: `Added to "${targetPl.name}"`, type: 'success' });
    });
  });
}

function confirmDeleteTrack(track, onTrackRemoved) {
  modal.show({
    title: 'Delete from Library',
    contentHtml: `
      <p class="text-slate-300">Are you sure you want to delete <span class="font-semibold text-white">"${escapeHtml(track.title)}"</span>?</p>
      <p class="text-xs text-slate-400 mt-2">This will remove the audio file from your browser's local storage and all playlists.</p>
    `,
    confirmText: 'Delete',
    confirmStyle: 'danger',
    onConfirm: async () => {
      // If currently playing, stop
      if (player.currentTrack && player.currentTrack.id === track.id) {
        player.pause();
        player.currentTrack = null;
      }
      await deleteTrack(track.id);
      toast.show({ message: `Deleted "${track.title}"`, type: 'info' });
      if (onTrackRemoved) onTrackRemoved(track);
    }
  });
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
