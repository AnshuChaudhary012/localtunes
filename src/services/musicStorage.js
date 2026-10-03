// LocalTunes Music Storage Service
import {
  getFromStore,
  getAllFromStore,
  putInStore,
  deleteFromStore,
  openDB
} from './db.js';

// Tracks Management
export async function saveTrack(track) {
  if (!track || !track.id) {
    throw new Error('Invalid track data');
  }

  // Ensure default fields
  const trackToSave = {
    id: track.id,
    title: track.title || 'Unknown Title',
    artist: track.artist || 'Unknown Artist',
    album: track.album || 'Unknown Album',
    duration: typeof track.duration === 'number' && !isNaN(track.duration) ? track.duration : 0,
    audioBlob: track.audioBlob, // Blob
    artworkBlob: track.artworkBlob || null, // Blob
    artworkUrl: track.artworkUrl || null, // Optional cached data URI or null
    fileType: track.fileType || 'audio/mpeg',
    fileName: track.fileName || 'track.mp3',
    fileSize: track.fileSize || (track.audioBlob ? track.audioBlob.size : 0),
    dateAdded: track.dateAdded || Date.now(),
    playCount: track.playCount || 0,
    lastPlayed: track.lastPlayed || 0,
  };

  await putInStore('tracks', trackToSave);
  return trackToSave;
}

export async function getAllTracks() {
  const tracks = await getAllFromStore('tracks');
  // Sort by date added descending (newest first)
  return tracks.sort((a, b) => (b.dateAdded || 0) - (a.dateAdded || 0));
}

export async function getTrackById(id) {
  if (!id) return null;
  return await getFromStore('tracks', id);
}

export async function deleteTrack(id) {
  if (!id) return false;

  // 1. Delete from tracks store
  await deleteFromStore('tracks', id);

  // 2. Remove from favorites
  await deleteFromStore('favorites', id);

  // 3. Remove from all playlists
  const playlists = await getAllFromStore('playlists');
  for (const playlist of playlists) {
    if (playlist.trackIds && playlist.trackIds.includes(id)) {
      playlist.trackIds = playlist.trackIds.filter(tId => tId !== id);
      playlist.updatedAt = Date.now();
      await putInStore('playlists', playlist);
    }
  }

  // 4. Clean up from appState recently played
  const state = await loadAppState();
  if (state.recentlyPlayed && state.recentlyPlayed.includes(id)) {
    state.recentlyPlayed = state.recentlyPlayed.filter(tId => tId !== id);
    await saveAppState(state);
  }

  return true;
}

// Favorites Management
export async function getFavoriteIds() {
  const favRecords = await getAllFromStore('favorites');
  return favRecords.map(f => f.trackId);
}

export async function isFavorite(trackId) {
  if (!trackId) return false;
  const fav = await getFromStore('favorites', trackId);
  return !!fav;
}

export async function toggleFavorite(trackId) {
  if (!trackId) return false;
  const exists = await isFavorite(trackId);
  if (exists) {
    await deleteFromStore('favorites', trackId);
    return false;
  } else {
    await putInStore('favorites', { trackId, addedAt: Date.now() });
    return true;
  }
}

export async function getFavoriteTracks() {
  const favIds = await getFavoriteIds();
  if (favIds.length === 0) return [];

  const allTracks = await getAllTracks();
  const favSet = new Set(favIds);
  return allTracks.filter(track => favSet.has(track.id));
}

export async function clearAllFavorites() {
  const favRecords = await getAllFromStore('favorites');
  for (const fav of favRecords) {
    if (fav.trackId) {
      await deleteFromStore('favorites', fav.trackId);
    }
  }
  return true;
}

// Playlists Management
export async function getPlaylists() {
  const playlists = await getAllFromStore('playlists');
  return playlists.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export async function getPlaylistById(id) {
  if (!id) return null;
  return await getFromStore('playlists', id);
}

export async function createPlaylist(name, description = '') {
  const cleanName = (name || '').trim();
  if (!cleanName) throw new Error('Playlist name cannot be empty');

  const newPlaylist = {
    id: 'pl_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
    name: cleanName,
    description: (description || '').trim(),
    trackIds: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await putInStore('playlists', newPlaylist);
  return newPlaylist;
}

export async function renamePlaylist(id, newName) {
  const cleanName = (newName || '').trim();
  if (!cleanName) throw new Error('Playlist name cannot be empty');

  const playlist = await getPlaylistById(id);
  if (!playlist) throw new Error('Playlist not found');

  playlist.name = cleanName;
  playlist.updatedAt = Date.now();
  await putInStore('playlists', playlist);
  return playlist;
}

export async function deletePlaylist(id) {
  if (!id) return false;
  return await deleteFromStore('playlists', id);
}

export async function addTrackToPlaylist(playlistId, trackId) {
  const playlist = await getPlaylistById(playlistId);
  if (!playlist) throw new Error('Playlist not found');

  if (!playlist.trackIds) playlist.trackIds = [];
  if (!playlist.trackIds.includes(trackId)) {
    playlist.trackIds.push(trackId);
    playlist.updatedAt = Date.now();
    await putInStore('playlists', playlist);
  }
  return playlist;
}

export async function removeTrackFromPlaylist(playlistId, trackId) {
  const playlist = await getPlaylistById(playlistId);
  if (!playlist) throw new Error('Playlist not found');

  if (!playlist.trackIds) playlist.trackIds = [];
  playlist.trackIds = playlist.trackIds.filter(id => id !== trackId);
  playlist.updatedAt = Date.now();
  await putInStore('playlists', playlist);
  return playlist;
}

// Playback history and Recently Played
export async function recordTrackPlayed(trackId) {
  if (!trackId) return;

  const track = await getTrackById(trackId);
  if (track) {
    track.playCount = (track.playCount || 0) + 1;
    track.lastPlayed = Date.now();
    await putInStore('tracks', track);
  }

  // Update appState recently played list
  const state = await loadAppState();
  let recent = state.recentlyPlayed || [];
  recent = recent.filter(id => id !== trackId);
  recent.unshift(trackId);
  if (recent.length > 30) recent = recent.slice(0, 30);

  state.recentlyPlayed = recent;
  await saveAppState(state);
}

export async function clearRecentlyPlayed() {
  const state = await loadAppState();
  state.recentlyPlayed = [];
  await saveAppState(state);
  return true;
}

export async function getRecentlyPlayed(limit = 12) {
  const state = await loadAppState();
  const recentIds = state.recentlyPlayed || [];
  if (recentIds.length === 0) return [];

  const allTracks = await getAllTracks();
  const trackMap = new Map(allTracks.map(t => [t.id, t]));

  const result = [];
  for (const id of recentIds) {
    if (trackMap.has(id)) {
      result.push(trackMap.get(id));
      if (result.length >= limit) break;
    }
  }
  return result;
}

export async function getRecentlyAdded(limit = 12) {
  const allTracks = await getAllTracks();
  return allTracks.slice(0, limit);
}

// App State Persistence (Queue, Volume, Modes)
const APP_STATE_KEY = 'localtunes_global_state';

export async function loadAppState() {
  try {
    const saved = await getFromStore('appState', APP_STATE_KEY);
    return saved ? saved.data : {
      currentTrackId: null,
      playbackTime: 0,
      volume: 0.8,
      shuffle: false,
      repeat: 'off',
      queue: [],
      queueIndex: -1,
      recentlyPlayed: [],
    };
  } catch (err) {
    console.warn('Failed to load app state from IDB, using defaults:', err);
    return {
      currentTrackId: null,
      playbackTime: 0,
      volume: 0.8,
      shuffle: false,
      repeat: 'off',
      queue: [],
      queueIndex: -1,
      recentlyPlayed: [],
    };
  }
}

export async function saveAppState(data) {
  try {
    await putInStore('appState', {
      key: APP_STATE_KEY,
      data,
      updatedAt: Date.now()
    });
  } catch (err) {
    console.warn('Failed to save app state:', err);
  }
}

// Storage Quota Estimate
export async function getStorageUsage() {
  if (navigator.storage && navigator.storage.estimate) {
    try {
      const { usage, quota } = await navigator.storage.estimate();
      return {
        usage: usage || 0,
        quota: quota || 0,
        percent: quota ? Math.min(100, Math.round(((usage || 0) / quota) * 100)) : 0,
        formattedUsage: formatBytes(usage || 0),
        formattedQuota: formatBytes(quota || 0)
      };
    } catch (e) {
      console.warn('Storage estimate failed:', e);
    }
  }
  return {
    usage: 0,
    quota: 0,
    percent: 0,
    formattedUsage: '0 MB',
    formattedQuota: 'Unlimited'
  };
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
