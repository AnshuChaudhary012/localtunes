# LocalTunes 🎵

> A complete, production-quality, client-side web music player for your local audio files. Built with vanilla JavaScript, Tailwind CSS, Vite, HTML5 Audio, and IndexedDB. 100% offline, privacy-first, zero backend, and installable as a Progressive Web App (PWA).

**Live App**: [https://localtunes-gamma.vercel.app](https://localtunes-gamma.vercel.app)  
**GitHub Repository**: [https://github.com/AnshuChaudhary012/localtunes](https://github.com/AnshuChaudhary012/localtunes)

---

## 🌟 Overview

**LocalTunes** brings the elegance, fluidity, and premium experience of modern music applications (inspired by Apple Music and Spotify) directly to your web browser—without requiring any cloud servers, account sign-ups, or subscriptions.

Your music stays strictly on your device. LocalTunes utilizes modern browser capabilities to extract embedded ID3/MP4/FLAC metadata, cache audio files in local **IndexedDB** storage, and deliver **seamless background audio playback even when your screen is locked or turned off**.

---

## 🌐 How to Use Directly from the Web Link (No Installation Needed)

You do **not** need to install Node.js, clone the repository, or compile any code to use LocalTunes. It is deployed as a fully functional, zero-backend Progressive Web App ready to use on any phone, tablet, or computer.

### Step 1: Open the Web App
Open your browser (Safari, Chrome, Firefox, Edge, Brave, etc.) and navigate to:
👉 **[https://localtunes-gamma.vercel.app](https://localtunes-gamma.vercel.app)**

---

### Step 2: Import Music Files from Your Device
Because web browsers run in a secure sandbox, websites cannot scan your device storage automatically. You import tracks using the built-in file picker:

- **📱 On iPhone / iPad (iOS Safari)**:
  1. Tap the **+ Add** button in the top navigation bar (or **Import Music** on the Home screen).
  2. Tap **Choose Files** to open the iOS **Files** picker.
  3. Browse your folders (e.g., *On My iPhone*, *Downloads*, or *iCloud Drive*).
  4. Select one or multiple audio files (`.mp3`, `.m4a`, `.aac`, `.flac`, `.wav`) and tap **Open** / **Done**.
  5. The import progress dialog will automatically parse album artwork, artist, title, and album tags, saving the audio directly into your browser's private offline database (**IndexedDB**).

- **🤖 On Android (Chrome / Brave / Firefox)**:
  1. Tap the **+ Add** button in the header.
  2. Choose **Audio files** or open your device file manager / SD card.
  3. Select your desired tracks and confirm.
  4. Your tracks will be imported and cached locally on your phone.

- **💻 On Desktop (macOS, Windows, Linux, Chromebook)**:
  1. Click **+ Add Music** in the sidebar or top bar.
  2. Or simply **drag and drop** audio files directly from Finder / File Explorer into the LocalTunes window.
  3. All selected tracks will be processed instantly.

> [!NOTE]
> **No uploads occur!** All audio decoding, artwork extraction, and storage happen 100% locally on your device. Zero bytes leave your device.

---

### Step 3: Install as an App on Your Home Screen (PWA)
For the best full-screen native app experience without browser navigation bars:

- **Apple iOS (iPhone & iPad)**:
  1. Open [https://localtunes-gamma.vercel.app](https://localtunes-gamma.vercel.app) in **Safari**.
  2. Tap the **Share** button (the square with an upward arrow at the bottom of Safari).
  3. Scroll down and tap **"Add to Home Screen"**.
  4. Tap **Add** in the top right corner.
  5. An app icon named **LocalTunes** will appear on your Home Screen. Tap it to launch full-screen!

- **Android (Chrome)**:
  1. Open the link in **Chrome**.
  2. Tap the **three-dots menu** (⋮) in the top-right corner.
  3. Tap **"Install app"** or **"Add to Home screen"**.
  4. Follow the prompt to install the native app shortcut.

- **Desktop (Chrome / Edge / Brave)**:
  1. Look for the **Install** icon in the address bar (a small computer or down arrow icon).
  2. Click **Install LocalTunes** to run it in its own standalone window with taskbar/dock integration.

---

### Step 4: Play in Background & With Screen Off / Locked
LocalTunes is engineered for continuous mobile playback:
1. Tap any song in your Library, Home, or Playlist to begin playback.
2. **Lock your phone or turn off the screen**: the music continues playing without pausing or cutting out.
3. **Switch to other apps**: audio keeps running in the background.
4. **Lock Screen Controls**: use your phone's lock-screen media player, Dynamic Island, Apple Watch, AirPods, or Bluetooth car stereo to:
   - Play / Pause
   - Skip to Next / Previous track
   - Scrub / Seek forward (+10s) or backward (-10s)
   - View album cover artwork, song title, and artist name

---

### Step 5: 100% Offline Playback
Once you have visited the website and imported songs:
- You can turn on **Airplane Mode** or disconnect from Wi-Fi and mobile data.
- Open LocalTunes anytime—your entire library, playlists, favorites, and the app shell remain accessible and fully playable offline.

---

## ✨ Key Features

- **🔒 Background Playback & Screen-Off / Locked Support**:
  - Uninterrupted audio playback when your phone screen turns off, locks, or when multitasking in other apps.
  - Native DOM `<audio>` element with inline execution attributes (`playsinline`) prevents aggressive mobile OS power-management suspension.
  - Full **Media Session API** integration synchronized with lock screen, Dynamic Island, Apple Watch, and Bluetooth remotes.
  - High-resolution dynamic lock screen artwork generator providing multi-density album art (`96x96` up to `512x512`).

- **🎨 Themes & Customization (Dark Mode, Light Mode & Accents)**:
  - **3-Way Theme Switcher**:
    - **Dark**: Deep charcoal backdrop with sleek glowing highlights.
    - **Light**: Crisp, high-contrast daytime interface.
    - **System**: Automatically matches your iOS / Android / Windows appearance setting.
  - **6 Dynamic Accent Palettes**: Cyan, Purple, Emerald, Rose, Amber, and Blue.
  - **Layout Density Options**: Choose between **Comfortable** and **Compact** row spacing.
  - **Artwork Toggle**: Option to hide thumbnail artwork for maximum song list visibility.
  - Zero-flash startup: Instant theme initialization script before DOM rendering prevents white/dark screen flicker.

- **⚙️ Dedicated Settings Hub (`/settings`)**:
  - Convenient access from the sidebar and mobile header shortcut.
  - **Playback Engine Settings**:
    - Autoplay Next Track toggle.
    - Remember Active Track across browser restarts.
    - Remember Playback Position / Timestamp to resume paused tracks.
  - **Player Controls Settings**:
    - Toggle between Elapsed time and **Countdown Remaining Time** (`-MM:SS`).
    - Toggle Mini-Player slim top progress bar.
    - Toggle Lock-Screen & Headphone Controls (Media Session API).
  - **Library Defaults**: Configure default sorting (Recently Added, Title A-Z, Artist A-Z, Album A-Z, Duration).
  - **Storage Management & Data Hygiene**:
    - Real-time IndexedDB gauge displaying MB used vs quota and utilization percentage.
    - Track count indicator.
    - Clear Recently Played history button.
    - Clear All Favorites with confirmation modal.
    - Reset All Settings to factory defaults.

- **📂 100% Local File Management**:
  - Multi-file picker and drag-and-drop support.
  - Supported audio formats: **MP3, M4A, AAC, WAV, OGG, and FLAC** (browser-dependent).
  - Multi-file batch import dialog with real-time parsing progress bar.
  - Graceful error handling for corrupted or unsupported media.

- **🏷️ Pure Client-Side Metadata Extraction**:
  - No external metadata APIs, third-party CDNs, or network requests required.
  - Parses **ID3v2 (v2.2, v2.3, v2.4)** tags, **ID3v1** footers, **MP4/M4A** atoms (`moov/udta/meta/ilst`), and **FLAC** vorbis comments.
  - Extracts embedded album cover art (JPEG/PNG).
  - Generates deterministic, dynamic gradient vinyl covers with track initials when artwork is absent.
  - Intelligent fallback to formatted filenames (e.g., `Artist - Title.mp3`).

- **🎧 Audio Engine & Playback Controls**:
  - HTML5 Audio API core with persistent state restoration.
  - Play, Pause, Next, Previous, and smooth scrubbing / seeking.
  - **Interactive Countdown**: Tap the total duration on the Full Player to toggle between total length and countdown remaining time (`-MM:SS`).
  - **Shuffle Mode**: Smart randomization avoiding immediate repeats.
  - **Repeat Modes**: Repeat Off, Repeat All, Repeat One.
  - Real-time interactive **Canvas Audio Visualizer** with animated frequency spectrum bars.
  - Memory leak protection: dynamic `URL.createObjectURL()` management and proactive cleanup via `URL.revokeObjectURL()`.

- **📱 Mobile-First & iPhone Optimized UI**:
  - Designed for iPhone, iPad, Android, and Desktop screens.
  - Safe-area insets support (`env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`).
  - Floating **Mini-Player** resting smoothly above bottom navigation with expandable **Full Player**.
  - Full-screen **Now Playing** overlay with dynamic ambient backdrops matching the current album art.
  - Touch-friendly controls with generous tap targets (minimum 44x44px).

- **🗂️ Library, Playlists & Favorites**:
  - **Library**: Filter by Songs, Albums, or Artists with multiple sorting options.
  - **Playlists**: Create, rename, delete custom playlists; add or remove tracks.
  - **Favorites**: One-tap heart toggle with instant IndexedDB persistence.
  - **Search**: Instant, real-time search across song titles, artists, and albums.
  - **Queue Drawer**: View upcoming tracks, reorder, remove, or clear queue.

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
- **Tailwind CSS** (Utility-first styling, glassmorphism, responsive safe-area design, custom CSS variable theming)
- **Vanilla JavaScript (ES Modules)** (Ultra-fast, zero framework bundle bloat)
- **Vite** (Next-generation dev server and production bundler)
- **IndexedDB** (`LocalTunesDB` for persisting audio blobs, metadata, favorites, playlists, and settings)
- **Service Worker & Web Manifest** (PWA offline installation)

---

## 🔒 Privacy & Local Files Behavior

1. **Zero Cloud Uploads**: Your music files are **never** transmitted, uploaded, or analyzed on remote servers. All parsing, decoding, and playback occurs locally in your browser.
2. **Browser Sandbox**: Web browsers cannot automatically scan arbitrary directories on your hard drive or iPhone filesystem. Audio files are imported exclusively through the user-initiated browser file picker or drag-and-drop.
3. **Persistent Local Storage**: Imported files and extracted artwork are stored inside your browser's private **IndexedDB** database. Songs remain playable when offline, after refreshing, or across browser restarts (subject to device storage availability).

---

## 🚀 Getting Started Locally (For Developers)

If you wish to modify the code or contribute to LocalTunes, you can run it locally:

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
│   │   ├── FullPlayer.js         # Full-screen Now Playing overlay, scrubbing & controls
│   │   ├── MiniPlayer.js         # Floating bottom mini player with progress indicator
│   │   ├── Modal.js              # Accessible confirmation & action dialogs
│   │   ├── Navbar.js             # Desktop sidebar & mobile bottom navigation bar
│   │   ├── QueueDrawer.js        # Slide-over queue manager with reorder & clear
│   │   ├── Toast.js              # Animated notification alerts
│   │   ├── TrackItem.js          # Reusable track row with artwork & action menus
│   │   └── Visualizer.js         # Real-time Web Audio API canvas frequency visualizer
│   ├── pages/
│   │   ├── FavoritesPage.js      # Hearted tracks view
│   │   ├── HomePage.js           # Recently played, quick picks, import banner
│   │   ├── LibraryPage.js        # Songs, Albums, Artists tabs with sorting
│   │   ├── PlaylistDetailPage.js # Single playlist view with song management
│   │   ├── PlaylistsPage.js      # Custom playlists list & creation modal
│   │   ├── SearchPage.js         # Instant search by title, artist, or album
│   │   └── SettingsPage.js       # Themes, accents, layout density & storage management
│   ├── services/
│   │   ├── db.js                 # Low-level IndexedDB database initialization
│   │   ├── musicStorage.js       # CRUD operations for tracks, playlists, recents & favorites
│   │   ├── player.js             # Core audio engine, background playback & MediaSession
│   │   └── settingsService.js    # Centralized theme, accents & preference state manager
│   ├── styles/
│   │   └── style.css             # Glassmorphism, animations, slider styling & light/dark variables
│   ├── utils/
│   │   ├── artworkGenerator.js   # Dynamic gradient covers & multi-size lock screen artwork
│   │   ├── demoAudioGenerator.js # Built-in synthesizer for instant demo playback
│   │   ├── formatters.js         # Duration and file size format utilities
│   │   ├── generateIcons.js      # Standalone icon generator utility
│   │   ├── icons.js              # Scalable SVG icons library
│   │   └── metadataParser.js     # Pure JS binary parser for ID3, MP4, and FLAC tags
│   ├── app.js                    # Route handling, layout mounting & file import coordinator
│   └── main.js                   # Application entry point & Service Worker registration
├── index.html                    # Root HTML document, SEO meta tags & pre-render theme script
├── package.json                  # Dependencies and build scripts
├── postcss.config.js             # PostCSS plugins configuration
├── tailwind.config.js            # Custom design tokens, colors & safe-area utilities
├── vite.config.js                # Vite build and dev server config
├── vercel.json                   # Vercel SPA routing rewrites configuration
├── README.md                     # Comprehensive documentation & usage guide
└── .gitignore                    # Git ignored files & directories
```

---

## 📄 License

© 2026 Anshu. All rights reserved. Crafted for music lovers who cherish private, local playback.
