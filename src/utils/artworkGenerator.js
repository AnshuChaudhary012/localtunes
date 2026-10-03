// LocalTunes Dynamic Artwork & Gradient Generator

const GRADIENTS = [
  { from: '#06b6d4', to: '#3b82f6', bg: '#083344', glow: 'rgba(6, 182, 212, 0.4)' },
  { from: '#8b5cf6', to: '#ec4899', bg: '#2e1065', glow: 'rgba(139, 92, 246, 0.4)' },
  { from: '#f97316', to: '#db2777', bg: '#431407', glow: 'rgba(249, 115, 22, 0.4)' },
  { from: '#10b981', to: '#06b6d4', bg: '#064e3b', glow: 'rgba(16, 185, 129, 0.4)' },
  { from: '#e11d48', to: '#8b5cf6', bg: '#4c0519', glow: 'rgba(225, 29, 72, 0.4)' },
  { from: '#6366f1', to: '#14b8a6', bg: '#1e1b4b', glow: 'rgba(99, 102, 241, 0.4)' },
  { from: '#f59e0b', to: '#ef4444', bg: '#451a03', glow: 'rgba(245, 158, 11, 0.4)' },
  { from: '#a855f7', to: '#3b82f6', bg: '#3b0764', glow: 'rgba(168, 85, 247, 0.4)' },
];

// Simple hash function for consistent color selection
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getTrackTheme(track) {
  const seed = (track.title || 'Local') + (track.artist || 'Tunes');
  const index = hashString(seed) % GRADIENTS.length;
  return GRADIENTS[index];
}

// Generates an SVG Data URI for tracks without embedded cover art
export function generateArtworkSvg(track, size = 300) {
  const theme = getTrackTheme(track);
  const initials = getInitials(track.title || track.fileName || 'LT');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
    <defs>
      <linearGradient id="g_${hashString(track.id || track.title)}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${theme.from}" />
        <stop offset="100%" stop-color="${theme.to}" />
      </linearGradient>
      <filter id="blur_${hashString(track.id || track.title)}" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="30" result="b" />
      </filter>
    </defs>
    <!-- Dark textured background -->
    <rect width="${size}" height="${size}" rx="${Math.round(size * 0.12)}" fill="${theme.bg}" />
    <!-- Gradient Blobs for vinyl light reflection -->
    <circle cx="${size * 0.25}" cy="${size * 0.3}" r="${size * 0.4}" fill="url(#g_${hashString(track.id || track.title)})" opacity="0.65" filter="url(#blur_${hashString(track.id || track.title)})" />
    <circle cx="${size * 0.8}" cy="${size * 0.75}" r="${size * 0.35}" fill="${theme.to}" opacity="0.5" filter="url(#blur_${hashString(track.id || track.title)})" />
    
    <!-- Stylized Vinyl Grooves -->
    <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.38}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1.5" />
    <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.30}" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1.5" />
    <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.22}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1.5" />

    <!-- Center Badge -->
    <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.18}" fill="rgba(10, 13, 20, 0.85)" stroke="url(#g_${hashString(track.id || track.title)})" stroke-width="2" />
    
    <!-- Music Note Glyph -->
    <path d="M ${size * 0.46} ${size * 0.42} v ${size * 0.16} a ${size * 0.04} ${size * 0.04} 0 1 1 -${size * 0.04} -${size * 0.04} c ${size * 0.02} 0 ${size * 0.04} ${size * 0.01} ${size * 0.04} ${size * 0.03} v -${size * 0.14} l ${size * 0.1} -${size * 0.03} v ${size * 0.13} a ${size * 0.04} ${size * 0.04} 0 1 1 -${size * 0.04} -${size * 0.04} c ${size * 0.02} 0 ${size * 0.04} ${size * 0.01} ${size * 0.04} ${size * 0.03} v -${size * 0.16} z" fill="url(#g_${hashString(track.id || track.title)})" />

    <!-- Initials text at bottom -->
    <text x="${size / 2}" y="${size * 0.86}" fill="rgba(255,255,255,0.85)" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="700" font-size="${Math.round(size * 0.08)}" text-anchor="middle" letter-spacing="1">${escapeXml(initials)}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function getInitials(title) {
  if (!title) return 'LT';
  const words = title.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return title.slice(0, 2).toUpperCase();
}

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

// Artwork URL Cache to reuse Object URLs and prevent memory leaks
const artworkUrlCache = new Map();
const pngArtworkCache = new Map();

export function getArtworkSrc(track) {
  if (!track) return generateArtworkSvg({ title: 'LocalTunes' });

  // If track has an extracted artwork Blob
  if (track.artworkBlob) {
    if (artworkUrlCache.has(track.id)) {
      return artworkUrlCache.get(track.id);
    }
    const url = URL.createObjectURL(track.artworkBlob);
    artworkUrlCache.set(track.id, url);
    return url;
  }

  // Fallback to generated dynamic cover art
  return generateArtworkSvg(track);
}

// Generate genuine raster PNG data URI for iOS lock screen (iOS rejects SVG in MediaSession)
export function generateArtworkPngDataUrl(track, size = 512) {
  const cacheKey = (track && track.id) || (track ? `${track.title}_${track.artist}` : 'default');
  if (pngArtworkCache.has(cacheKey)) {
    return pngArtworkCache.get(cacheKey);
  }

  try {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const theme = getTrackTheme(track || {});
    const initials = getInitials(track?.title || track?.fileName || 'LT');

    // Background fill
    ctx.fillStyle = theme.bg || '#083344';
    ctx.fillRect(0, 0, size, size);

    // Primary radial glow
    const grad1 = ctx.createRadialGradient(size * 0.25, size * 0.3, 10, size * 0.25, size * 0.3, size * 0.45);
    grad1.addColorStop(0, theme.from || '#06b6d4');
    grad1.addColorStop(1, 'transparent');
    ctx.fillStyle = grad1;
    ctx.fillRect(0, 0, size, size);

    // Secondary radial glow
    const grad2 = ctx.createRadialGradient(size * 0.8, size * 0.75, 10, size * 0.8, size * 0.75, size * 0.4);
    grad2.addColorStop(0, theme.to || '#3b82f6');
    grad2.addColorStop(1, 'transparent');
    ctx.fillStyle = grad2;
    ctx.fillRect(0, 0, size, size);

    // Stylized vinyl grooves
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 2;
    [0.38, 0.30, 0.22].forEach((ratio) => {
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size * ratio, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Center circular vinyl badge
    const centerGrad = ctx.createLinearGradient(0, 0, size, size);
    centerGrad.addColorStop(0, theme.from || '#06b6d4');
    centerGrad.addColorStop(1, theme.to || '#3b82f6');

    ctx.fillStyle = 'rgba(10, 13, 20, 0.92)';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = centerGrad;
    ctx.lineWidth = 4;
    ctx.stroke();

    // Initials in center
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(size * 0.09)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials, size / 2, size / 2);

    const pngUrl = canvas.toDataURL('image/png');
    pngArtworkCache.set(cacheKey, pngUrl);
    return pngUrl;
  } catch (err) {
    console.warn('Canvas PNG generation failed:', err);
    return '';
  }
}

// MediaSession artwork array compliant with iOS Lock Screen specifications
export function getMediaSessionArtwork(track) {
  const origin = typeof window !== 'undefined' && window.location ? window.location.origin : '';
  const result = [];

  if (track && track.artworkBlob) {
    const blobUrl = getArtworkSrc(track);
    const mime = track.artworkBlob.type || 'image/jpeg';
    result.push({ src: blobUrl, sizes: '512x512', type: mime });
  } else {
    const pngDataUrl = generateArtworkPngDataUrl(track, 512);
    if (pngDataUrl) {
      result.push({ src: pngDataUrl, sizes: '512x512', type: 'image/png' });
    }
  }

  // Include absolute PNG fallback icons for Apple Lock Screen / Control Center
  if (origin) {
    result.push(
      { src: `${origin}/icons/icon-512.png`, sizes: '512x512', type: 'image/png' },
      { src: `${origin}/icons/icon-192.png`, sizes: '192x192', type: 'image/png' }
    );
  }

  return result;
}

export function revokeTrackArtwork(trackId) {
  if (artworkUrlCache.has(trackId)) {
    URL.revokeObjectURL(artworkUrlCache.get(trackId));
    artworkUrlCache.delete(trackId);
  }
  if (pngArtworkCache.has(trackId)) {
    pngArtworkCache.delete(trackId);
  }
}

