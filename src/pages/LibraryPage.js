// LocalTunes Library Page
import { getAllTracks } from '../services/musicStorage.js';
import { player } from '../services/player.js';
import { icons } from '../utils/icons.js';
import { getArtworkSrc } from '../utils/artworkGenerator.js';
import { renderTrackItem } from '../components/TrackItem.js';
import { formatDuration } from '../utils/formatters.js';

export async function renderLibraryPage(container, { onNavigate, onAddMusic, initialTab = 'songs' }) {
  let activeTab = initialTab; // 'songs' | 'albums' | 'artists'
  let sortBy = 'dateAdded'; // 'dateAdded' | 'title' | 'artist' | 'duration'
  let subView = null; // null | { type: 'album', name: string } | { type: 'artist', name: string }

  async function refresh() {
    const allTracks = await getAllTracks();

    // Check if subview is active (viewing a specific album or artist)
    if (subView) {
      renderSubView(container, allTracks, subView, () => {
        subView = null;
        refresh();
      });
      return;
    }

    // Grouping
    const albumsMap = new Map();
    const artistsMap = new Map();

    allTracks.forEach(track => {
      const albumName = track.album || 'Unknown Album';
      const artistName = track.artist || 'Unknown Artist';

      if (!albumsMap.has(albumName)) {
        albumsMap.set(albumName, { name: albumName, artist: artistName, tracks: [], firstTrack: track });
      }
      albumsMap.get(albumName).tracks.push(track);

      if (!artistsMap.has(artistName)) {
        artistsMap.set(artistName, { name: artistName, tracks: [], firstTrack: track });
      }
      artistsMap.get(artistName).tracks.push(track);
    });

    const albumsList = Array.from(albumsMap.values());
    const artistsList = Array.from(artistsMap.values());

    // Sort tracks
    const sortedTracks = [...allTracks].sort((a, b) => {
      if (sortBy === 'title') return (a.title || '').localeCompare(b.title || '');
      if (sortBy === 'artist') return (a.artist || '').localeCompare(b.artist || '');
      if (sortBy === 'duration') return (b.duration || 0) - (a.duration || 0);
      return (b.dateAdded || 0) - (a.dateAdded || 0); // dateAdded
    });

    container.innerHTML = `
      <div class="space-y-6 pb-12 animate-fadeIn">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Your Library</h2>
            <p class="text-xs sm:text-sm text-slate-400 mt-1">${allTracks.length} song${allTracks.length === 1 ? '' : 's'} in your offline library</p>
          </div>

          <div class="flex items-center gap-2">
            ${allTracks.length > 0 ? `
              <button id="lib-shuffle-all-btn" class="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center gap-2 transition-all">
                ${icons.shuffle('w-4 h-4 text-cyan-400')}
                <span>Shuffle All</span>
              </button>
            ` : ''}
            <button id="lib-add-music-btn" class="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-glow transition-all">
              ${icons.upload('w-4 h-4')}
              <span>Add Music</span>
            </button>
          </div>
        </div>

        <!-- Segmented Tab Navigation -->
        <div class="flex items-center justify-between border-b border-dark-border pb-3">
          <div class="flex items-center gap-2 p-1 rounded-xl bg-dark-card/80 border border-dark-border">
            <button class="lib-tab-btn px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'songs' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'}" data-tab="songs">
              Songs (${allTracks.length})
            </button>
            <button class="lib-tab-btn px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'albums' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'}" data-tab="albums">
              Albums (${albumsList.length})
            </button>
            <button class="lib-tab-btn px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'artists' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'}" data-tab="artists">
              Artists (${artistsList.length})
            </button>
          </div>

          ${activeTab === 'songs' && allTracks.length > 0 ? `
            <div class="flex items-center gap-2">
              <span class="text-xs text-slate-500 hidden sm:inline">Sort:</span>
              <select id="lib-sort-select" class="bg-dark-card border border-dark-border text-xs text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500">
                <option value="dateAdded" ${sortBy === 'dateAdded' ? 'selected' : ''}>Recently Added</option>
                <option value="title" ${sortBy === 'title' ? 'selected' : ''}>Title (A-Z)</option>
                <option value="artist" ${sortBy === 'artist' ? 'selected' : ''}>Artist (A-Z)</option>
                <option value="duration" ${sortBy === 'duration' ? 'selected' : ''}>Duration</option>
              </select>
            </div>
          ` : ''}
        </div>

        <!-- Content Area -->
        <div id="lib-content-area"></div>
      </div>
    `;

    const contentArea = container.querySelector('#lib-content-area');

    if (allTracks.length === 0) {
      contentArea.innerHTML = `
        <div class="py-16 text-center text-slate-400 text-sm">
          <p class="font-medium text-white mb-2">No music found in your library.</p>
          <p class="text-xs text-slate-500 mb-6">Click "Add Music" to import your audio files.</p>
          <button id="lib-empty-add-btn" class="px-5 py-2.5 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold shadow-glow">
            Add Music
          </button>
        </div>
      `;
      contentArea.querySelector('#lib-empty-add-btn').addEventListener('click', onAddMusic);
      return;
    }

    if (activeTab === 'songs') {
      // Render Songs List
      const listEl = document.createElement('div');
      listEl.className = 'space-y-1';
      sortedTracks.forEach((track, index) => {
        const item = renderTrackItem(track, {
          index,
          contextQueue: sortedTracks,
          onTrackRemoved: () => refresh(),
        });
        listEl.appendChild(item);
      });
      contentArea.appendChild(listEl);
    } else if (activeTab === 'albums') {
      // Render Albums Grid
      contentArea.innerHTML = `
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          ${albumsList.map(album => `
            <div class="album-card group p-3 rounded-2xl bg-dark-card/60 hover:bg-dark-card border border-dark-border/60 hover:border-dark-border transition-all cursor-pointer" data-album="${escapeHtml(album.name)}">
              <div class="relative aspect-square rounded-xl overflow-hidden mb-3 shadow-md">
                <img src="${getArtworkSrc(album.firstTrack)}" alt="${escapeHtml(album.name)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <div class="w-10 h-10 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shadow-glow">
                    ${icons.play('w-5 h-5 ml-0.5')}
                  </div>
                </div>
              </div>
              <div class="font-semibold text-sm text-white truncate">${escapeHtml(album.name)}</div>
              <div class="text-xs text-slate-400 truncate mt-0.5">${escapeHtml(album.artist)}</div>
              <div class="text-[11px] text-slate-500 mt-1">${album.tracks.length} track${album.tracks.length === 1 ? '' : 's'}</div>
            </div>
          `).join('')}
        </div>
      `;

      contentArea.querySelectorAll('.album-card').forEach(card => {
        card.addEventListener('click', () => {
          const albumName = card.dataset.album;
          subView = { type: 'album', name: albumName };
          refresh();
        });
      });
    } else if (activeTab === 'artists') {
      // Render Artists Grid
      contentArea.innerHTML = `
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          ${artistsList.map(artist => `
            <div class="artist-card group p-4 rounded-2xl bg-dark-card/60 hover:bg-dark-card border border-dark-border/60 hover:border-dark-border transition-all cursor-pointer text-center" data-artist="${escapeHtml(artist.name)}">
              <div class="relative w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-full overflow-hidden mb-3 shadow-lg border-2 border-white/5 group-hover:border-cyan-500/40 transition-colors">
                <img src="${getArtworkSrc(artist.firstTrack)}" alt="${escapeHtml(artist.name)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                <div class="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <div class="w-9 h-9 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shadow-glow">
                    ${icons.play('w-4 h-4 ml-0.5')}
                  </div>
                </div>
              </div>
              <div class="font-semibold text-sm text-white truncate">${escapeHtml(artist.name)}</div>
              <div class="text-xs text-slate-400 mt-1">${artist.tracks.length} song${artist.tracks.length === 1 ? '' : 's'}</div>
            </div>
          `).join('')}
        </div>
      `;

      contentArea.querySelectorAll('.artist-card').forEach(card => {
        card.addEventListener('click', () => {
          const artistName = card.dataset.artist;
          subView = { type: 'artist', name: artistName };
          refresh();
        });
      });
    }

    // Bind Tabs
    container.querySelectorAll('.lib-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeTab = btn.dataset.tab;
        refresh();
      });
    });

    // Bind Sort
    const sortSelect = container.querySelector('#lib-sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        sortBy = e.target.value;
        refresh();
      });
    }

    // Bind Add Music & Shuffle
    const addBtn = container.querySelector('#lib-add-music-btn');
    if (addBtn) addBtn.addEventListener('click', onAddMusic);

    const shuffleBtn = container.querySelector('#lib-shuffle-all-btn');
    if (shuffleBtn) {
      shuffleBtn.addEventListener('click', () => {
        if (allTracks.length > 0) {
          player.shuffle = true;
          player.setQueue(allTracks, Math.floor(Math.random() * allTracks.length), true);
        }
      });
    }
  }

  await refresh();
}

function renderSubView(container, allTracks, subView, onBack) {
  const isAlbum = subView.type === 'album';
  const matchingTracks = allTracks.filter(t => isAlbum ? (t.album || 'Unknown Album') === subView.name : (t.artist || 'Unknown Artist') === subView.name);
  const firstTrack = matchingTracks[0] || {};
  const totalSecs = matchingTracks.reduce((sum, t) => sum + (t.duration || 0), 0);

  container.innerHTML = `
    <div class="space-y-6 pb-12 animate-fadeIn">
      <!-- Back button & Banner -->
      <div>
        <button id="subview-back-btn" class="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-4">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Library</span>
        </button>

        <div class="flex flex-col sm:flex-row items-center sm:items-end gap-6 p-6 rounded-3xl bg-gradient-to-r from-dark-card to-dark-surface border border-dark-border">
          <div class="w-36 h-36 sm:w-44 sm:h-44 ${isAlbum ? 'rounded-2xl' : 'rounded-full'} overflow-hidden shadow-2xl flex-shrink-0 border border-white/10">
            <img src="${getArtworkSrc(firstTrack)}" class="w-full h-full object-cover" />
          </div>

          <div class="text-center sm:text-left flex-1 min-w-0">
            <div class="text-xs uppercase tracking-widest font-semibold text-cyan-400">${isAlbum ? 'Album' : 'Artist'}</div>
            <h2 class="text-2xl sm:text-3xl font-extrabold text-white mt-1 truncate">${escapeHtml(subView.name)}</h2>
            <p class="text-sm text-slate-400 mt-1">${matchingTracks.length} song${matchingTracks.length === 1 ? '' : 's'} &bull; ${formatDuration(totalSecs)}</p>

            <div class="flex items-center justify-center sm:justify-start gap-3 mt-4">
              <button id="subview-play-all-btn" class="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-glow">
                ${icons.play('w-4 h-4')}
                <span>Play All</span>
              </button>
              <button id="subview-shuffle-btn" class="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs flex items-center gap-2">
                ${icons.shuffle('w-4 h-4 text-cyan-400')}
                <span>Shuffle</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Tracks List -->
      <div class="space-y-1" id="subview-track-list"></div>
    </div>
  `;

  container.querySelector('#subview-back-btn').addEventListener('click', onBack);

  container.querySelector('#subview-play-all-btn').addEventListener('click', () => {
    player.setQueue(matchingTracks, 0, true);
  });

  container.querySelector('#subview-shuffle-btn').addEventListener('click', () => {
    player.shuffle = true;
    player.setQueue(matchingTracks, Math.floor(Math.random() * matchingTracks.length), true);
  });

  const listEl = container.querySelector('#subview-track-list');
  matchingTracks.forEach((track, index) => {
    const item = renderTrackItem(track, {
      index,
      contextQueue: matchingTracks,
      showAlbum: !isAlbum,
      onTrackRemoved: () => onBack(),
    });
    listEl.appendChild(item);
  });
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
