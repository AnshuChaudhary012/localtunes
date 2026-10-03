// LocalTunes Real-Time Search Page
import { getAllTracks } from '../services/musicStorage.js';
import { icons } from '../utils/icons.js';
import { renderTrackItem } from '../components/TrackItem.js';
import { getArtworkSrc } from '../utils/artworkGenerator.js';
import { player } from '../services/player.js';

export async function renderSearchPage(container, { onNavigate }) {
  const allTracks = await getAllTracks();
  let query = '';
  let activeFilter = 'all'; // 'all' | 'songs' | 'artists' | 'albums'

  container.innerHTML = `
    <div class="space-y-6 pb-12 animate-fadeIn">
      <!-- Search Header & Input -->
      <div>
        <h2 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-4">Search</h2>

        <div class="relative max-w-xl">
          <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            ${icons.search('w-5 h-5')}
          </div>
          <input
            type="text"
            id="search-input"
            placeholder="Search songs, artists, or albums..."
            autofocus
            class="w-full pl-12 pr-10 py-3.5 bg-dark-card border border-dark-border rounded-2xl text-white placeholder-slate-500 text-sm sm:text-base focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 shadow-glass transition-all"
          />
          <button id="search-clear-btn" class="hidden absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white" aria-label="Clear search">
            ${icons.x('w-5 h-5')}
          </button>
        </div>

        <!-- Filter Pills -->
        <div class="flex items-center gap-2 mt-4 overflow-x-auto pb-1">
          <button class="search-pill-btn px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${activeFilter === 'all' ? 'bg-cyan-500 text-slate-950' : 'bg-dark-card text-slate-400 hover:text-white border border-dark-border'}" data-filter="all">
            All
          </button>
          <button class="search-pill-btn px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${activeFilter === 'songs' ? 'bg-cyan-500 text-slate-950' : 'bg-dark-card text-slate-400 hover:text-white border border-dark-border'}" data-filter="songs">
            Songs
          </button>
          <button class="search-pill-btn px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${activeFilter === 'artists' ? 'bg-cyan-500 text-slate-950' : 'bg-dark-card text-slate-400 hover:text-white border border-dark-border'}" data-filter="artists">
            Artists
          </button>
          <button class="search-pill-btn px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${activeFilter === 'albums' ? 'bg-cyan-500 text-slate-950' : 'bg-dark-card text-slate-400 hover:text-white border border-dark-border'}" data-filter="albums">
            Albums
          </button>
        </div>
      </div>

      <!-- Search Results Area -->
      <div id="search-results-area"></div>
    </div>
  `;

  const inputEl = container.querySelector('#search-input');
  const clearBtn = container.querySelector('#search-clear-btn');
  const resultsArea = container.querySelector('#search-results-area');

  function renderResults() {
    const q = query.trim().toLowerCase();

    if (!q) {
      clearBtn.classList.add('hidden');
      resultsArea.innerHTML = `
        <div class="py-20 text-center text-slate-400 text-sm">
          <div class="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3 text-slate-500">
            ${icons.search('w-6 h-6')}
          </div>
          <p class="font-medium text-white mb-1">Search Your Music</p>
          <p class="text-xs text-slate-500">Type a song title, artist, or album name to find matches instantly.</p>
        </div>
      `;
      return;
    }

    clearBtn.classList.remove('hidden');

    // Filter matches
    const matchingSongs = allTracks.filter(t => (t.title || '').toLowerCase().includes(q));
    const matchingArtists = allTracks.filter(t => (t.artist || '').toLowerCase().includes(q));
    const matchingAlbums = allTracks.filter(t => (t.album || '').toLowerCase().includes(q));

    // Combine for 'all'
    const allMatchesMap = new Map();
    [...matchingSongs, ...matchingArtists, ...matchingAlbums].forEach(t => allMatchesMap.set(t.id, t));
    const allMatches = Array.from(allMatchesMap.values());

    let displayTracks = [];
    if (activeFilter === 'songs') displayTracks = matchingSongs;
    else if (activeFilter === 'artists') displayTracks = matchingArtists;
    else if (activeFilter === 'albums') displayTracks = matchingAlbums;
    else displayTracks = allMatches;

    if (displayTracks.length === 0) {
      resultsArea.innerHTML = `
        <div class="py-16 text-center text-slate-400 text-sm">
          <p class="font-medium text-white mb-1">No results for "${escapeHtml(query)}"</p>
          <p class="text-xs text-slate-500">Check for typos or try searching with another keyword.</p>
        </div>
      `;
      return;
    }

    resultsArea.innerHTML = `
      <div class="space-y-4">
        <div class="text-xs text-slate-400 font-medium">Found ${displayTracks.length} match${displayTracks.length === 1 ? '' : 'es'}</div>
        <div class="space-y-1" id="search-tracks-list"></div>
      </div>
    `;

    const listEl = resultsArea.querySelector('#search-tracks-list');
    displayTracks.forEach((track, index) => {
      const item = renderTrackItem(track, {
        index,
        contextQueue: displayTracks,
      });
      listEl.appendChild(item);
    });
  }

  inputEl.addEventListener('input', (e) => {
    query = e.target.value;
    renderResults();
  });

  clearBtn.addEventListener('click', () => {
    inputEl.value = '';
    query = '';
    inputEl.focus();
    renderResults();
  });

  container.querySelectorAll('.search-pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeFilter = btn.dataset.filter;
      container.querySelectorAll('.search-pill-btn').forEach(b => {
        if (b.dataset.filter === activeFilter) {
          b.className = 'search-pill-btn px-4 py-1.5 rounded-full text-xs font-semibold transition-all bg-cyan-500 text-slate-950';
        } else {
          b.className = 'search-pill-btn px-4 py-1.5 rounded-full text-xs font-semibold transition-all bg-dark-card text-slate-400 hover:text-white border border-dark-border';
        }
      });
      renderResults();
    });
  });

  renderResults();
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
