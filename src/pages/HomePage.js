// LocalTunes Home Page
import { getAllTracks, getRecentlyPlayed, getRecentlyAdded, getFavoriteTracks, saveTrack } from '../services/musicStorage.js';
import { player } from '../services/player.js';
import { getGreeting, formatDuration } from '../utils/formatters.js';
import { icons } from '../utils/icons.js';
import { getArtworkSrc } from '../utils/artworkGenerator.js';
import { renderTrackItem } from '../components/TrackItem.js';
import { modal } from '../components/Modal.js';

export async function renderHomePage(container, { onNavigate, onAddMusic }) {
  const allTracks = await getAllTracks();
  const recentlyPlayed = await getRecentlyPlayed(8);
  const recentlyAdded = await getRecentlyAdded(8);
  const favorites = await getFavoriteTracks();

  if (allTracks.length === 0) {
    // Empty state
    container.innerHTML = `
      <div class="flex-1 flex flex-col items-center justify-center min-h-[75vh] px-6 text-center animate-fadeIn">
        <div class="relative w-28 h-28 mb-6 flex items-center justify-center rounded-3xl bg-gradient-to-tr from-cyan-500/20 via-purple-500/20 to-blue-500/20 border border-white/10 shadow-glow">
          <div class="text-cyan-400">
            ${icons.music('w-14 h-14')}
          </div>
          <div class="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-white shadow-md">
            ${icons.plus('w-5 h-5')}
          </div>
        </div>

        <h2 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
          Your library is empty
        </h2>
        <p class="text-slate-400 max-w-md text-sm sm:text-base mb-8">
          Add your first song to start listening. LocalTunes plays your local audio files directly in the browser with full offline playback.
        </p>

        <div class="flex flex-col sm:flex-row items-center gap-3">
          <button id="home-empty-add-btn" class="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm shadow-glow flex items-center gap-2.5 transition-all transform hover:scale-105 active:scale-95">
            ${icons.upload('w-5 h-5')}
            <span>Add Music</span>
          </button>
          <button id="home-demo-track-btn" class="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-200 text-sm font-medium flex items-center gap-2 transition-colors">
            ${icons.sparkles('w-4 h-4 text-cyan-400')}
            <span>Try Demo Track</span>
          </button>
        </div>

        <div class="mt-8 flex items-center gap-2 text-xs text-slate-500">
          <span>Supported: MP3, M4A, WAV, AAC, FLAC, OGG</span>
        </div>
      </div>
    `;

    container.querySelector('#home-empty-add-btn').addEventListener('click', onAddMusic);

    const demoBtn = container.querySelector('#home-demo-track-btn');
    if (demoBtn) {
      demoBtn.addEventListener('click', async () => {
        demoBtn.disabled = true;
        demoBtn.innerHTML = 'Generating...';
        const { generateDemoAudioBlob } = await import('../utils/demoAudioGenerator.js');
        const blob = generateDemoAudioBlob();
        const demoTrack = {
          id: 'trk_demo_' + Date.now(),
          title: 'Sunset Neon Waves',
          artist: 'LocalTunes Demo Lab',
          album: 'Ambient Sessions',
          duration: 12,
          audioBlob: blob,
          artworkBlob: null,
          fileType: 'audio/wav',
          fileName: 'Sunset Neon Waves.wav',
          fileSize: blob.size,
          dateAdded: Date.now(),
        };
        await saveTrack(demoTrack);
        renderHomePage(container, { onNavigate, onAddMusic });
      });
    }
    return;
  }

  // Last played track for Continue Listening hero
  const continueTrack = recentlyPlayed[0] || allTracks[0];

  container.innerHTML = `
    <div class="space-y-8 pb-12 animate-fadeIn">
      <!-- Greeting & Top Banner -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">${getGreeting()}</h2>
          <p class="text-sm text-slate-400 mt-1">Here is what's ready to play in your local collection</p>
        </div>

        <!-- Quick Actions Bar -->
        <div class="flex items-center gap-2 flex-wrap">
          <button id="home-shuffle-all-btn" class="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center gap-2 transition-all">
            ${icons.shuffle('w-4 h-4 text-cyan-400')}
            <span>Shuffle Library</span>
          </button>
          <button id="home-add-music-quick" class="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-2 transition-all">
            ${icons.upload('w-4 h-4')}
            <span>Add Music</span>
          </button>
          <button id="home-shortcuts-btn" class="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs transition-colors" title="Keyboard Shortcuts">
            ${icons.info('w-4 h-4')}
          </button>
        </div>
      </div>

      <!-- Continue Listening Hero Card -->
      ${continueTrack ? `
        <div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-dark-card via-dark-surface to-dark-card border border-dark-border p-6 shadow-xl">
          <div class="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div class="flex items-center gap-4">
              <div class="relative w-20 h-20 rounded-2xl overflow-hidden shadow-lg flex-shrink-0 group cursor-pointer" id="hero-play-art">
                <img src="${getArtworkSrc(continueTrack)}" alt="${escapeHtml(continueTrack.title)}" class="w-full h-full object-cover" />
                <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div class="w-10 h-10 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shadow-glow">
                    ${icons.play('w-5 h-5 ml-0.5')}
                  </div>
                </div>
              </div>
              <div>
                <div class="text-xs uppercase tracking-wider font-semibold text-cyan-400">Continue Listening</div>
                <h3 class="text-lg sm:text-xl font-bold text-white mt-0.5 max-w-md truncate">${escapeHtml(continueTrack.title || continueTrack.fileName)}</h3>
                <p class="text-xs sm:text-sm text-slate-400 mt-0.5">${escapeHtml(continueTrack.artist || 'Unknown Artist')} &bull; ${escapeHtml(continueTrack.album || 'Local')}</p>
              </div>
            </div>

            <button id="hero-continue-play-btn" class="px-6 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-glow flex items-center gap-2.5 transition-all transform active:scale-95">
              ${icons.play('w-5 h-5')}
              <span>Play Now</span>
            </button>
          </div>
        </div>
      ` : ''}

      <!-- Recently Played Section -->
      ${recentlyPlayed.length > 0 ? `
        <div>
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Recently Played</span>
            </h3>
          </div>
          <!-- Horizontal Scroll / Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
            ${recentlyPlayed.slice(0, 6).map(track => `
              <div class="recent-card group p-3 rounded-2xl bg-dark-card/60 hover:bg-dark-card border border-dark-border/60 hover:border-dark-border transition-all cursor-pointer" data-id="${track.id}">
                <div class="relative aspect-square rounded-xl overflow-hidden mb-2.5 shadow-md">
                  <img src="${getArtworkSrc(track)}" alt="${escapeHtml(track.title)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                  <div class="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <div class="w-9 h-9 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shadow-glow">
                      ${icons.play('w-4 h-4 ml-0.5')}
                    </div>
                  </div>
                </div>
                <div class="font-medium text-xs text-white truncate">${escapeHtml(track.title || track.fileName)}</div>
                <div class="text-[11px] text-slate-400 truncate mt-0.5">${escapeHtml(track.artist || 'Unknown Artist')}</div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Recently Added Tracks List -->
      <div>
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-lg font-bold text-white tracking-tight">Recently Added</h3>
            <p class="text-xs text-slate-400 mt-0.5">Your latest imported local audio</p>
          </div>
          <button id="home-view-all-library" class="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
            See all in Library &rarr;
          </button>
        </div>

        <div class="space-y-1" id="home-recent-list"></div>
      </div>
    </div>
  `;

  // Render recently added track items
  const recentList = container.querySelector('#home-recent-list');
  recentlyAdded.slice(0, 8).forEach((track, idx) => {
    const item = renderTrackItem(track, {
      index: idx,
      contextQueue: allTracks,
      onTrackRemoved: () => renderHomePage(container, { onNavigate, onAddMusic }),
    });
    recentList.appendChild(item);
  });

  // Bind Buttons
  container.querySelector('#home-shuffle-all-btn').addEventListener('click', () => {
    if (allTracks.length > 0) {
      player.shuffle = true;
      player.setQueue(allTracks, Math.floor(Math.random() * allTracks.length), true);
    }
  });

  container.querySelector('#home-add-music-quick').addEventListener('click', onAddMusic);

  const heroPlayArt = container.querySelector('#hero-play-art');
  const heroPlayBtn = container.querySelector('#hero-continue-play-btn');
  const handleHeroPlay = () => {
    if (continueTrack) player.playTrack(continueTrack, allTracks);
  };
  if (heroPlayArt) heroPlayArt.addEventListener('click', handleHeroPlay);
  if (heroPlayBtn) heroPlayBtn.addEventListener('click', handleHeroPlay);

  container.querySelectorAll('.recent-card').forEach(card => {
    card.addEventListener('click', () => {
      const trackId = card.dataset.id;
      const track = allTracks.find(t => t.id === trackId);
      if (track) player.playTrack(track, allTracks);
    });
  });

  const viewAllBtn = container.querySelector('#home-view-all-library');
  if (viewAllBtn) {
    viewAllBtn.addEventListener('click', () => onNavigate('library'));
  }

  // Keyboard shortcuts dialog
  const shortcutsBtn = container.querySelector('#home-shortcuts-btn');
  if (shortcutsBtn) {
    shortcutsBtn.addEventListener('click', () => {
      modal.show({
        title: 'Desktop Keyboard Shortcuts',
        contentHtml: `
          <div class="space-y-2.5 text-xs text-slate-300">
            <div class="flex justify-between items-center py-1 border-b border-white/5">
              <span>Play / Pause</span>
              <kbd class="px-2 py-1 bg-white/10 rounded font-mono text-cyan-400">Space</kbd>
            </div>
            <div class="flex justify-between items-center py-1 border-b border-white/5">
              <span>Next Track</span>
              <kbd class="px-2 py-1 bg-white/10 rounded font-mono text-cyan-400">Shift + &rarr;</kbd>
            </div>
            <div class="flex justify-between items-center py-1 border-b border-white/5">
              <span>Previous Track</span>
              <kbd class="px-2 py-1 bg-white/10 rounded font-mono text-cyan-400">Shift + &larr;</kbd>
            </div>
            <div class="flex justify-between items-center py-1 border-b border-white/5">
              <span>Seek Forward 5s</span>
              <kbd class="px-2 py-1 bg-white/10 rounded font-mono text-cyan-400">&rarr;</kbd>
            </div>
            <div class="flex justify-between items-center py-1 border-b border-white/5">
              <span>Seek Backward 5s</span>
              <kbd class="px-2 py-1 bg-white/10 rounded font-mono text-cyan-400">&larr;</kbd>
            </div>
            <div class="flex justify-between items-center py-1 border-b border-white/5">
              <span>Volume Up / Down</span>
              <kbd class="px-2 py-1 bg-white/10 rounded font-mono text-cyan-400">&uarr; / &darr;</kbd>
            </div>
            <div class="flex justify-between items-center py-1 border-b border-white/5">
              <span>Mute / Unmute</span>
              <kbd class="px-2 py-1 bg-white/10 rounded font-mono text-cyan-400">M</kbd>
            </div>
            <div class="flex justify-between items-center py-1 border-b border-white/5">
              <span>Toggle Shuffle</span>
              <kbd class="px-2 py-1 bg-white/10 rounded font-mono text-cyan-400">S</kbd>
            </div>
            <div class="flex justify-between items-center py-1">
              <span>Toggle Repeat</span>
              <kbd class="px-2 py-1 bg-white/10 rounded font-mono text-cyan-400">R</kbd>
            </div>
          </div>
        `,
        showCancel: false,
        confirmText: 'Got it'
      });
    });
  }
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
