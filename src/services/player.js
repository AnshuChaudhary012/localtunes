// LocalTunes Core Audio Player Service
import { recordTrackPlayed, saveAppState, loadAppState } from './musicStorage.js';
import { getArtworkSrc } from '../utils/artworkGenerator.js';

class PlayerService {
  constructor() {
    this.audio = new Audio();
    this.audio.preload = 'auto';

    // State
    this.currentTrack = null;
    this.isPlaying = false;
    this.duration = 0;
    this.currentTime = 0;
    this.volume = 0.8;
    this.isMuted = false;
    this.previousVolume = 0.8;
    this.shuffle = false;
    this.repeat = 'off'; // 'off' | 'all' | 'one'

    // Queue
    this.queue = [];
    this.currentIndex = -1;
    this.unshuffledQueue = []; // Backup of original order when shuffle is active

    // Object URL Tracking for memory cleanup
    this.activeObjectUrl = null;

    // Web Audio API for Live Visualizer
    this.audioContext = null;
    this.analyser = null;
    this.audioSourceNode = null;
    this.isAudioContextReady = false;

    // Event listeners
    this.listeners = new Map();

    this.initAudioEvents();
    this.initMediaSession();
  }

  // --- PUB / SUB SYSTEM ---
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.listeners.get(event).delete(callback);
  }

  emit(event, payload) {
    if (this.listeners.has(event)) {
      for (const cb of this.listeners.get(event)) {
        try {
          cb(payload);
        } catch (e) {
          console.error(`Error in player listener for ${event}:`, e);
        }
      }
    }
  }

  // --- AUDIO ELEMENT SETUP ---
  initAudioEvents() {
    this.audio.addEventListener('play', () => {
      this.isPlaying = true;
      this.emit('playbackChange', true);
      this.updateMediaSessionState();
      this.setupWebAudio();
    });

    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
      this.emit('playbackChange', false);
      this.updateMediaSessionState();
    });

    this.audio.addEventListener('timeupdate', () => {
      this.currentTime = this.audio.currentTime || 0;
      this.duration = this.audio.duration || (this.currentTrack ? this.currentTrack.duration : 0);
      const percent = this.duration > 0 ? (this.currentTime / this.duration) * 100 : 0;

      this.emit('timeUpdate', {
        currentTime: this.currentTime,
        duration: this.duration,
        percent,
      });

      this.updateMediaSessionPosition();
    });

    this.audio.addEventListener('loadedmetadata', () => {
      if (this.audio.duration && isFinite(this.audio.duration)) {
        this.duration = this.audio.duration;
        this.emit('timeUpdate', {
          currentTime: this.audio.currentTime,
          duration: this.duration,
          percent: 0,
        });
      }
    });

    this.audio.addEventListener('ended', () => {
      this.handleTrackEnded();
    });

    this.audio.addEventListener('error', (e) => {
      console.error('Audio playback error:', e, this.audio.error);
      const code = this.audio.error ? this.audio.error.code : 'UNKNOWN';
      const msg = this.getAudioErrorMessage(code);
      this.emit('error', msg);
      this.isPlaying = false;
      this.emit('playbackChange', false);
    });

    // Load saved volume
    this.audio.volume = this.volume;
  }

  getAudioErrorMessage(code) {
    switch (code) {
      case 1: return 'Audio playback aborted';
      case 2: return 'Network error while loading audio';
      case 3: return 'Audio decoding failed (corrupted file)';
      case 4: return 'Audio format not supported by this browser';
      default: return 'Playback error encountered';
    }
  }

  // Web Audio Analyser setup
  setupWebAudio() {
    if (this.isAudioContextReady) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64; // 32 frequency bins
      this.analyser.smoothingTimeConstant = 0.8;

      this.audioSourceNode = this.audioContext.createMediaElementSource(this.audio);
      this.audioSourceNode.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);

      this.isAudioContextReady = true;
    } catch (e) {
      // Browsers may block if not user triggered, or if already connected
      // It will gracefully fall back
    }
  }

  getFrequencyData() {
    if (!this.analyser) return null;
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }

  // --- QUEUE & PLAYBACK CONTROLS ---
  async setQueue(tracks, startIndex = 0, autoPlay = true) {
    if (!tracks || tracks.length === 0) return;

    this.unshuffledQueue = [...tracks];

    if (this.shuffle) {
      // Keep selected track at index 0, shuffle remainder
      const chosenTrack = tracks[startIndex];
      const remainder = tracks.filter((_, idx) => idx !== startIndex);
      this.shuffleArray(remainder);
      this.queue = [chosenTrack, ...remainder];
      this.currentIndex = 0;
    } else {
      this.queue = [...tracks];
      this.currentIndex = Math.max(0, Math.min(startIndex, this.queue.length - 1));
    }

    this.emit('queueChange', {
      queue: this.queue,
      currentIndex: this.currentIndex,
    });

    await this.loadTrackAtIndex(this.currentIndex, autoPlay);
    this.persistState();
  }

  async playTrack(track, queueContext = null) {
    if (queueContext && Array.isArray(queueContext)) {
      const idx = queueContext.findIndex(t => t.id === track.id);
      await this.setQueue(queueContext, idx !== -1 ? idx : 0, true);
    } else {
      // If single track played, insert into queue
      const existingIdx = this.queue.findIndex(t => t.id === track.id);
      if (existingIdx !== -1) {
        this.currentIndex = existingIdx;
        await this.loadTrackAtIndex(this.currentIndex, true);
      } else {
        this.queue.splice(this.currentIndex + 1, 0, track);
        this.unshuffledQueue.push(track);
        this.currentIndex += 1;
        this.emit('queueChange', { queue: this.queue, currentIndex: this.currentIndex });
        await this.loadTrackAtIndex(this.currentIndex, true);
      }
    }
  }

  async loadTrackAtIndex(index, autoPlay = true) {
    if (index < 0 || index >= this.queue.length) return;

    this.currentIndex = index;
    const track = this.queue[this.currentIndex];
    this.currentTrack = track;

    // Revoke previous object URL to avoid memory leaks
    if (this.activeObjectUrl) {
      URL.revokeObjectURL(this.activeObjectUrl);
      this.activeObjectUrl = null;
    }

    if (!track.audioBlob) {
      this.emit('error', 'Audio file data missing from storage');
      return;
    }

    try {
      this.activeObjectUrl = URL.createObjectURL(track.audioBlob);
      this.audio.src = this.activeObjectUrl;
      this.audio.load();

      this.emit('trackChange', track);
      this.emit('queueChange', { queue: this.queue, currentIndex: this.currentIndex });
      this.updateMediaSessionMetadata(track);

      if (autoPlay) {
        await this.play();
      }

      // Record play count and last played in DB
      recordTrackPlayed(track.id);
      this.persistState();
    } catch (err) {
      console.error('Error loading track:', err);
      this.emit('error', 'Unable to play this track');
    }
  }

  async play() {
    if (!this.currentTrack && this.queue.length > 0) {
      await this.loadTrackAtIndex(0, true);
      return;
    }

    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (e) {}
    }

    try {
      await this.audio.play();
    } catch (err) {
      // Autoplay policy or abort
      console.warn('Playback play request was prevented:', err);
      this.isPlaying = false;
      this.emit('playbackChange', false);
    }
  }

  pause() {
    this.audio.pause();
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  seek(seconds) {
    if (!isFinite(seconds) || seconds < 0) return;
    const target = Math.min(seconds, this.duration || 0);
    this.audio.currentTime = target;
    this.currentTime = target;
  }

  seekPercent(percent) {
    if (this.duration > 0) {
      const target = (Math.max(0, Math.min(100, percent)) / 100) * this.duration;
      this.seek(target);
    }
  }

  async next() {
    if (this.queue.length === 0) return;

    if (this.currentIndex < this.queue.length - 1) {
      await this.loadTrackAtIndex(this.currentIndex + 1, true);
    } else {
      // At end of queue
      if (this.repeat === 'all') {
        await this.loadTrackAtIndex(0, true);
      } else {
        // Stop playback
        this.pause();
        this.seek(0);
      }
    }
  }

  async previous() {
    if (this.queue.length === 0) return;

    // Standard player rule: If song has played for more than 3 seconds, restart it
    if (this.audio.currentTime > 3) {
      this.seek(0);
      return;
    }

    if (this.currentIndex > 0) {
      await this.loadTrackAtIndex(this.currentIndex - 1, true);
    } else {
      if (this.repeat === 'all') {
        await this.loadTrackAtIndex(this.queue.length - 1, true);
      } else {
        this.seek(0);
      }
    }
  }

  handleTrackEnded() {
    if (this.repeat === 'one') {
      this.seek(0);
      this.play();
    } else {
      this.next();
    }
  }

  // --- REPEAT & SHUFFLE MODES ---
  toggleRepeat() {
    // Cycles: off -> all -> one -> off
    if (this.repeat === 'off') {
      this.repeat = 'all';
    } else if (this.repeat === 'all') {
      this.repeat = 'one';
    } else {
      this.repeat = 'off';
    }

    this.emit('modeChange', { shuffle: this.shuffle, repeat: this.repeat });
    this.persistState();
  }

  toggleShuffle() {
    this.shuffle = !this.shuffle;

    if (this.shuffle) {
      // Shuffle upcoming queue keeping current track
      if (this.queue.length > 0 && this.currentIndex !== -1) {
        const current = this.queue[this.currentIndex];
        const rest = this.unshuffledQueue.filter(t => t.id !== current.id);
        this.shuffleArray(rest);
        this.queue = [current, ...rest];
        this.currentIndex = 0;
      }
    } else {
      // Restore original queue order
      if (this.currentTrack) {
        this.queue = [...this.unshuffledQueue];
        const newIdx = this.queue.findIndex(t => t.id === this.currentTrack.id);
        this.currentIndex = newIdx !== -1 ? newIdx : 0;
      }
    }

    this.emit('modeChange', { shuffle: this.shuffle, repeat: this.repeat });
    this.emit('queueChange', { queue: this.queue, currentIndex: this.currentIndex });
    this.persistState();
  }

  shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // --- VOLUME CONTROLS ---
  setVolume(vol) {
    const clamped = Math.max(0, Math.min(1, vol));
    this.volume = clamped;
    this.audio.volume = clamped;
    this.isMuted = clamped === 0;

    this.emit('volumeChange', { volume: this.volume, isMuted: this.isMuted });
    this.persistState();
  }

  toggleMute() {
    if (this.isMuted) {
      this.setVolume(this.previousVolume > 0 ? this.previousVolume : 0.8);
      this.isMuted = false;
    } else {
      this.previousVolume = this.volume;
      this.setVolume(0);
      this.isMuted = true;
    }
  }

  // --- QUEUE REORDER & REMOVE ---
  removeFromQueue(index) {
    if (index < 0 || index >= this.queue.length) return;

    if (index === this.currentIndex) {
      // Removing currently playing track
      if (this.queue.length === 1) {
        this.queue = [];
        this.currentIndex = -1;
        this.currentTrack = null;
        this.pause();
        this.audio.src = '';
      } else {
        this.next();
        this.queue.splice(index, 1);
        if (this.currentIndex > index) this.currentIndex--;
      }
    } else {
      this.queue.splice(index, 1);
      if (this.currentIndex > index) {
        this.currentIndex--;
      }
    }

    this.emit('queueChange', { queue: this.queue, currentIndex: this.currentIndex });
  }

  clearQueue() {
    this.pause();
    this.queue = [];
    this.unshuffledQueue = [];
    this.currentIndex = -1;
    this.currentTrack = null;
    this.audio.src = '';
    this.emit('queueChange', { queue: [], currentIndex: -1 });
    this.emit('trackChange', null);
  }

  // --- SYSTEM MEDIA SESSION API ---
  initMediaSession() {
    if (!('mediaSession' in navigator)) return;

    navigator.mediaSession.setActionHandler('play', () => this.play());
    navigator.mediaSession.setActionHandler('pause', () => this.pause());
    navigator.mediaSession.setActionHandler('previoustrack', () => this.previous());
    navigator.mediaSession.setActionHandler('nexttrack', () => this.next());
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined) {
        this.seek(details.seekTime);
      }
    });
    navigator.mediaSession.setActionHandler('seekbackward', (details) => {
      this.seek(this.currentTime - (details.seekOffset || 10));
    });
    navigator.mediaSession.setActionHandler('seekforward', (details) => {
      this.seek(this.currentTime + (details.seekOffset || 10));
    });
    navigator.mediaSession.setActionHandler('stop', () => {
      this.pause();
      this.seek(0);
    });
  }

  updateMediaSessionMetadata(track) {
    if (!('mediaSession' in navigator) || !track) return;

    const artworkSrc = getArtworkSrc(track);

    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title || 'Unknown Title',
      artist: track.artist || 'Unknown Artist',
      album: track.album || 'LocalTunes',
      artwork: [
        { src: artworkSrc, sizes: '192x192', type: 'image/png' },
        { src: artworkSrc, sizes: '512x512', type: 'image/png' },
      ],
    });
  }

  updateMediaSessionState() {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = this.isPlaying ? 'playing' : 'paused';
    }
  }

  updateMediaSessionPosition() {
    if ('mediaSession' in navigator && 'setPositionState' in navigator.mediaSession) {
      if (this.duration > 0 && isFinite(this.duration) && isFinite(this.currentTime)) {
        try {
          navigator.mediaSession.setPositionState({
            duration: this.duration,
            playbackRate: this.audio.playbackRate || 1,
            position: Math.min(this.currentTime, this.duration),
          });
        } catch (e) {
          // Ignore transient position state sync errors
        }
      }
    }
  }

  // --- STATE RESTORATION & PERSISTENCE ---
  async restoreSavedState(allTracks) {
    try {
      const state = await loadAppState();
      if (!state) return;

      this.volume = typeof state.volume === 'number' ? state.volume : 0.8;
      this.audio.volume = this.volume;
      this.shuffle = !!state.shuffle;
      this.repeat = state.repeat || 'off';

      this.emit('volumeChange', { volume: this.volume, isMuted: this.volume === 0 });
      this.emit('modeChange', { shuffle: this.shuffle, repeat: this.repeat });

      // If queue was saved
      if (state.queue && state.queue.length > 0 && allTracks && allTracks.length > 0) {
        const trackMap = new Map(allTracks.map(t => [t.id, t]));
        const restoredQueue = state.queue.map(id => trackMap.get(id)).filter(Boolean);

        if (restoredQueue.length > 0) {
          this.queue = restoredQueue;
          this.unshuffledQueue = [...restoredQueue];
          this.currentIndex = Math.max(0, Math.min(state.queueIndex || 0, this.queue.length - 1));
          this.currentTrack = this.queue[this.currentIndex];

          if (this.currentTrack) {
            // Pre-load track without playing
            this.activeObjectUrl = URL.createObjectURL(this.currentTrack.audioBlob);
            this.audio.src = this.activeObjectUrl;
            this.emit('trackChange', this.currentTrack);
            this.emit('queueChange', { queue: this.queue, currentIndex: this.currentIndex });
            this.updateMediaSessionMetadata(this.currentTrack);
          }
        }
      }
    } catch (err) {
      console.warn('Error restoring player state:', err);
    }
  }

  async persistState() {
    try {
      const state = await loadAppState();
      state.volume = this.volume;
      state.shuffle = this.shuffle;
      state.repeat = this.repeat;
      state.currentTrackId = this.currentTrack ? this.currentTrack.id : null;
      state.queue = this.queue.map(t => t.id);
      state.queueIndex = this.currentIndex;
      await saveAppState(state);
    } catch (e) {
      console.warn('Persist state error:', e);
    }
  }
}

// Export singleton player
export const player = new PlayerService();
