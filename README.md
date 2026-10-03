# LocalTunes 🎵

> A complete, production-quality, client-side web music player for your local audio files. Built with vanilla JavaScript, Tailwind CSS, Vite, HTML5 Audio, and IndexedDB. 100% offline, privacy-first, zero backend, and installable as a Progressive Web App (PWA).

![LocalTunes Banner](public/icons/icon-512.png)

---

## 🌟 Overview

**LocalTunes** brings the elegance, fluidity, and premium experience of modern music applications (inspired by Apple Music and Spotify) directly to your web browser—without requiring any cloud servers, account sign-ups, or subscriptions.

Your music stays strictly on your device. LocalTunes utilizes modern browser capabilities to extract embedded ID3/MP4 metadata, cache audio files in local **IndexedDB** storage, and deliver seamless background audio playback with full lock-screen media controls.

---

## ✨ Key Features

- **📂 100% Local File Management**:
  - Multi-file picker and drag-and-drop support.
  - Supported audio formats: **MP3, M4A, WAV, AAC, OGG, and FLAC** (browser-dependent).
  - Graceful error handling for unsupported or corrupted files.
  - Multi-file import progress dialog.

- **🏷️ Pure Client-Side Metadata Extraction**:
  - No external metadata APIs or network requests needed.
  - Parses **ID3v2 (v2.2, v2.3, v2.4)** tags, **ID3v1** footers, **MP4/M4A** atoms (`moov/udta/meta/ilst`), and **FLAC** vorbis comments.
  - Extracts embedded album cover art (JPEG/PNG).
  - Generates deterministic, dynamic gradient vinyl covers with track initials when artwork is missing.
  - Intelligent filename fallback (e.g., `Artist - Title.mp3`).

- **🎧 Audio Engine & Playback Controls**:
  - HTML5 Audio API core with persistent state restoration.
  - Play, Pause, Next, Previous, and smooth scrubbing / seeking.
  - **Shuffle Mode**: Smart randomization avoiding immediate repeats.
  - **Repeat Modes**: Repeat Off, Repeat All, Repeat One.
  - Real-time interactive **Canvas Audio Visualizer** with animated frequency spectrum bars.
  - Memory leak protection: dynamic `URL.createObjectURL()` management and proactive cleanup via `URL.revokeObjectURL()`.

- **📱 Mobile-First & iPhone Optimized UI**:
  - Designed for iPhone, iPad, Android, and Desktop screens.
  - Safe-area insets support (`env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`).
  - Floating **Mini-Player** resting smoothly above bottom navigation.
  - Full-screen **Now Playing** overlay with dynamic ambient backdrops matching the current album art.
  - Touch-friendly controls (minimum 44x44px tap targets).

- **🗂️ Library, Playlists & Favorites**:
  - **Library**: Filter by Songs, Albums, or Artists with sorting options (Recently Added, Title, Artist, Duration).
  - **Playlists**: Create, rename, delete custom playlists; add or remove tracks.
  - **Favorites**: One-tap heart toggle with instant IndexedDB persistence.
  - **Search**: Instant, real-time search across song titles, artists, and albums.
  - **Queue Drawer**: View upcoming tracks, reorder, remove, or clear queue.

- **📻 System Media Session Integration**:
  - Native lock-screen, Dynamic Island, and OS notification center playback controls (`navigator.mediaSession`).
  - Artwork, track title, artist, and timeline scrubbing synchronized with the operating system.

- **⌨️ Desktop Keyboard Shortcuts**:
  - `Space`: Play / Pause
  - `ArrowRight` / `ArrowLeft`: Seek 5 seconds forward / backward
  - `Shift + ArrowRight` / `Shift + ArrowLeft`: Next / Previous track
  - `ArrowUp` / `ArrowDown`: Volume up / down
  - `M`: Mute / Unmute
  - `S`: Toggle Shuffle
  - `R`: Cycle Repeat modes

- **📲 Progressive Web App (PWA)**:
  - Installable on iOS (Safari Add to Home Screen), Android (Chrome install prompt), macOS, and Windows.
  - Offline Service Worker caching the entire application shell.

---

## 🛠️ Tech Stack

- **HTML5** (Semantic structure, Audio API, Canvas API, MediaSession API)
- **Tailwind CSS** (Modern utility-first styling, glassmorphism, responsive safe-area design)
- **Vanilla JavaScript (ES Modules)** (Zero heavyweight UI framework overhead)
- **Vite** (Ultra-fast build tool and dev server)
- **IndexedDB** (`LocalTunesDB` for persisting audio blobs, metadata, favorites, playlists, and settings)
- **Service Worker & Web Manifest** (PWA offline installation)

---

## 🔒 Privacy & Local Files Behavior

1. **Zero Cloud Uploads**: Your music files are **never** transmitted, uploaded, or analyzed on remote servers. All parsing, decoding, and playback occurs locally in your browser.
2. **Browser Sandbox**: Web browsers cannot automatically scan arbitrary directories on your hard drive or iPhone filesystem. Audio files are imported exclusively through the user-initiated browser file picker or drag-and-drop.
3. **Persistent Local Storage**: Imported files and extracted artwork are stored inside your browser's private **IndexedDB** database. Songs remain playable when offline, after refreshing, or across browser restarts (subject to device storage availability).

---

## 🚀 Getting Started Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- `npm` (v9.0.0 or higher)

### Installation
```bash
# Clone the repository
git clone https://github.com/AnshuChaudhary012/localtunes.git

# Navigate to project folder
cd localtunes

# Install dependencies
npm install
```

### Running Development Server
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:3000`.

### Production Build
```bash
npm run build
```
The optimized production output will be generated inside the `dist/` directory.

### Preview Production Build
```bash
npm run preview
```

---

## ☁️ Deployment on Vercel

LocalTunes is a static client-side single page application built with Vite and is ready for one-click deployment on [Vercel](https://vercel.com):

1. **Vercel Settings**:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
2. **CLI Deployment**:
   ```bash
   vercel --prod
   ```

---

## 📂 Project Structure

```
localtunes/
├── public/
│   ├── favicon/
│   │   └── favicon.svg
│   ├── icons/
│   │   ├── icon-192.png
│   │   ├── icon-512.png
│   │   ├── icon-maskable-192.png
│   │   ├── icon-maskable-512.png
│   │   └── icon.svg
│   ├── manifest.webmanifest
│   └── sw.js
├── src/
│   ├── components/
│   │   ├── FullPlayer.js
│   │   ├── MiniPlayer.js
│   │   ├── Modal.js
│   │   ├── Navbar.js
│   │   ├── QueueDrawer.js
│   │   ├── Toast.js
│   │   ├── TrackItem.js
│   │   └── Visualizer.js
│   ├── pages/
│   │   ├── FavoritesPage.js
│   │   ├── HomePage.js
│   │   ├── LibraryPage.js
│   │   ├── PlaylistDetailPage.js
│   │   ├── PlaylistsPage.js
│   │   └── SearchPage.js
│   ├── services/
│   │   ├── db.js
│   │   ├── musicStorage.js
│   │   └── player.js
│   ├── styles/
│   │   └── style.css
│   ├── utils/
│   │   ├── artworkGenerator.js
│   │   ├── demoAudioGenerator.js
│   │   ├── formatters.js
│   │   ├── generateIcons.js
│   │   ├── icons.js
│   │   └── metadataParser.js
│   ├── app.js
│   └── main.js
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
├── README.md
└── .gitignore
```

---

## 📄 License

MIT License. Crafted for music lovers who cherish private, local playback.
