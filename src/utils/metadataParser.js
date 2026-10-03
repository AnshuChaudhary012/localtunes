// LocalTunes Metadata Parser
// Pure client-side parsing for MP3 (ID3v1, ID3v2.2/2.3/2.4), M4A/MP4, and FLAC, plus HTML5 Audio duration.

export async function extractMetadata(file) {
  const result = {
    title: '',
    artist: '',
    album: '',
    duration: 0,
    artworkBlob: null,
    artworkUrl: null,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type || getMimeFromExtension(file.name),
  };

  try {
    // 1. Get exact duration using HTML5 Audio element
    result.duration = await getAudioDuration(file);
  } catch (err) {
    console.warn('Could not read duration from audio element:', err);
    result.duration = 0;
  }

  try {
    // 2. Read first 512KB for headers/ID3v2/MP4/FLAC
    const headerBuffer = await readFileSlice(file, 0, Math.min(file.size, 512 * 1024));

    // Check MP3 ID3v2
    if (isID3v2(headerBuffer)) {
      await parseID3v2(file, headerBuffer, result);
    }
    // Check MP4 / M4A
    else if (isMP4(headerBuffer)) {
      await parseMP4(file, result);
    }
    // Check FLAC
    else if (isFLAC(headerBuffer)) {
      await parseFLAC(file, headerBuffer, result);
    }

    // 3. Fallback to ID3v1 at the end of the file if title is still missing
    if (!result.title && file.size > 128) {
      const footerBuffer = await readFileSlice(file, file.size - 128, file.size);
      parseID3v1(footerBuffer, result);
    }
  } catch (err) {
    console.warn('Metadata tag extraction warning for', file.name, err);
  }

  // 4. Fallback to clean filename parsing if title is still missing
  if (!result.title || result.title.trim() === '') {
    const parsed = parseFileName(file.name);
    result.title = parsed.title;
    if (!result.artist && parsed.artist) {
      result.artist = parsed.artist;
    }
  }

  if (!result.artist || result.artist.trim() === '') {
    result.artist = 'Unknown Artist';
  }

  if (!result.album || result.album.trim() === '') {
    result.album = 'Unknown Album';
  }

  return result;
}

// Read slice as ArrayBuffer
function readFileSlice(file, start, end) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    const slice = file.slice(start, end);
    reader.readAsArrayBuffer(slice);
  });
}

// Get duration via HTML5 Audio element
function getAudioDuration(file) {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const audio = new Audio();
    audio.preload = 'metadata';

    const cleanUp = () => {
      URL.revokeObjectURL(objectUrl);
      audio.src = '';
      audio.remove();
    };

    const timer = setTimeout(() => {
      cleanUp();
      resolve(0);
    }, 4000);

    audio.onloadedmetadata = () => {
      clearTimeout(timer);
      const dur = audio.duration;
      cleanUp();
      resolve(isFinite(dur) ? dur : 0);
    };

    audio.onerror = () => {
      clearTimeout(timer);
      cleanUp();
      resolve(0);
    };

    audio.src = objectUrl;
  });
}

// Filename Parser Helper
function parseFileName(fileName) {
  // Strip extension
  let baseName = fileName.replace(/\.[^/.]+$/, '');

  // Remove leading track numbers like "01 - ", "01. ", "1 - "
  baseName = baseName.replace(/^\d+[\s.-]+/, '');

  // Check for "Artist - Title" format
  if (baseName.includes(' - ')) {
    const parts = baseName.split(' - ');
    const artist = parts[0].trim();
    const title = parts.slice(1).join(' - ').trim();
    if (artist && title) {
      return { artist, title };
    }
  }

  // Check for "Artist _ Title"
  if (baseName.includes('_-_')) {
    const parts = baseName.split('_-_');
    const artist = parts[0].trim().replace(/_/g, ' ');
    const title = parts.slice(1).join('_-_').trim().replace(/_/g, ' ');
    if (artist && title) {
      return { artist, title };
    }
  }

  return {
    artist: '',
    title: baseName.replace(/_/g, ' ').trim() || 'Unknown Track',
  };
}

// --- ID3v2 PARSING ---
function isID3v2(buffer) {
  const bytes = new Uint8Array(buffer);
  return bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33; // 'ID3'
}

async function parseID3v2(file, headerBuffer, result) {
  const view = new DataView(headerBuffer);
  const version = view.getUint8(3); // 2 = v2.2, 3 = v2.3, 4 = v2.4
  const flags = view.getUint8(5);

  // Synchsafe size of tag
  const tagSize =
    ((view.getUint8(6) & 0x7f) << 21) |
    ((view.getUint8(7) & 0x7f) << 14) |
    ((view.getUint8(8) & 0x7f) << 7) |
    (view.getUint8(9) & 0x7f);

  let fullBuffer = headerBuffer;
  if (tagSize + 10 > headerBuffer.byteLength && tagSize + 10 <= file.size) {
    // Read the rest of the tag if it exceeds 512KB (e.g. huge artwork)
    const readLimit = Math.min(tagSize + 10, 8 * 1024 * 1024); // max 8MB
    fullBuffer = await readFileSlice(file, 0, readLimit);
  }

  const bytes = new Uint8Array(fullBuffer);
  const totalLength = Math.min(tagSize + 10, bytes.length);
  let offset = 10;

  // Skip extended header if present
  if (flags & 0x40 && version >= 3) {
    const extSize = (version === 4)
      ? ((bytes[offset] & 0x7f) << 21) | ((bytes[offset+1] & 0x7f) << 14) | ((bytes[offset+2] & 0x7f) << 7) | (bytes[offset+3] & 0x7f)
      : (bytes[offset] << 24) | (bytes[offset+1] << 16) | (bytes[offset+2] << 8) | bytes[offset+3];
    offset += extSize;
  }

  if (version === 2) {
    // ID3v2.2 uses 3-character frame IDs and 3-byte lengths
    while (offset + 6 < totalLength) {
      const frameId = String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2]);
      if (bytes[offset] === 0) break;
      const frameSize = (bytes[offset + 3] << 16) | (bytes[offset + 4] << 8) | bytes[offset + 5];
      offset += 6;
      if (frameSize <= 0 || offset + frameSize > totalLength) break;

      const frameData = bytes.subarray(offset, offset + frameSize);
      offset += frameSize;

      if (frameId === 'TT2') result.title = decodeTextFrame(frameData);
      else if (frameId === 'TP1') result.artist = decodeTextFrame(frameData);
      else if (frameId === 'TAL') result.album = decodeTextFrame(frameData);
      else if (frameId === 'PIC' && !result.artworkBlob) {
        parsePicFrameV22(frameData, result);
      }
    }
  } else {
    // ID3v2.3 and ID3v2.4 use 4-character frame IDs
    while (offset + 10 < totalLength) {
      if (bytes[offset] === 0) break; // padding reached

      const frameId = String.fromCharCode(
        bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]
      );

      let frameSize;
      if (version === 4) {
        // ID3v2.4 synchsafe integer
        frameSize =
          ((bytes[offset + 4] & 0x7f) << 21) |
          ((bytes[offset + 5] & 0x7f) << 14) |
          ((bytes[offset + 6] & 0x7f) << 7) |
          (bytes[offset + 7] & 0x7f);
      } else {
        // ID3v2.3 regular 32-bit int
        frameSize =
          (bytes[offset + 4] << 24) |
          (bytes[offset + 5] << 16) |
          (bytes[offset + 6] << 8) |
          bytes[offset + 7];
      }

      offset += 10;
      if (frameSize <= 0 || offset + frameSize > totalLength) break;

      const frameData = bytes.subarray(offset, offset + frameSize);
      offset += frameSize;

      if (frameId === 'TIT2') result.title = decodeTextFrame(frameData);
      else if (frameId === 'TPE1') result.artist = decodeTextFrame(frameData);
      else if (frameId === 'TALB') result.album = decodeTextFrame(frameData);
      else if (frameId === 'APIC' && !result.artworkBlob) {
        parseApicFrame(frameData, result);
      }
    }
  }
}

// Decode ID3 Text Frame with encoding byte
function decodeTextFrame(data) {
  if (!data || data.length <= 1) return '';
  const encoding = data[0];
  const textBytes = data.subarray(1);

  try {
    if (encoding === 0) {
      // ISO-8859-1 (Latin1)
      let str = '';
      for (let i = 0; i < textBytes.length; i++) {
        if (textBytes[i] === 0) break;
        str += String.fromCharCode(textBytes[i]);
      }
      return str.trim();
    } else if (encoding === 1) {
      // UTF-16 with BOM
      return new TextDecoder('utf-16').decode(textBytes).replace(/\0.*$/, '').trim();
    } else if (encoding === 2) {
      // UTF-16BE
      return new TextDecoder('utf-16be').decode(textBytes).replace(/\0.*$/, '').trim();
    } else if (encoding === 3) {
      // UTF-8
      return new TextDecoder('utf-8').decode(textBytes).replace(/\0.*$/, '').trim();
    }
  } catch (e) {
    console.warn('Text decode error:', e);
  }
  return '';
}

// Parse APIC frame (ID3v2.3/2.4 Artwork)
function parseApicFrame(data, result) {
  try {
    const encoding = data[0];
    let offset = 1;

    // MIME type is null-terminated ASCII/Latin1
    let mimeType = '';
    while (offset < data.length && data[offset] !== 0) {
      mimeType += String.fromCharCode(data[offset]);
      offset++;
    }
    offset++; // Skip null byte

    if (!mimeType) mimeType = 'image/jpeg';
    if (mimeType === '-->') return; // URL link picture, skip

    // Picture type (1 byte, e.g. 0x03 = Cover front)
    const picType = data[offset++];

    // Skip description (encoded with encoding)
    if (encoding === 0 || encoding === 3) {
      while (offset < data.length && data[offset] !== 0) offset++;
      offset++;
    } else {
      // UTF-16 (double null byte)
      while (offset + 1 < data.length && !(data[offset] === 0 && data[offset + 1] === 0)) {
        offset += 2;
      }
      offset += 2;
    }

    if (offset < data.length) {
      const imgBytes = data.subarray(offset);
      result.artworkBlob = new Blob([imgBytes], { type: mimeType });
    }
  } catch (err) {
    console.warn('APIC parse error:', err);
  }
}

// Parse PIC frame for ID3v2.2
function parsePicFrameV22(data, result) {
  try {
    const encoding = data[0];
    const imgFormat = String.fromCharCode(data[1], data[2], data[3]).toLowerCase();
    const picType = data[4];
    let offset = 5;

    // Skip description
    if (encoding === 0) {
      while (offset < data.length && data[offset] !== 0) offset++;
      offset++;
    } else {
      while (offset + 1 < data.length && !(data[offset] === 0 && data[offset + 1] === 0)) offset += 2;
      offset += 2;
    }

    if (offset < data.length) {
      const mime = imgFormat === 'png' ? 'image/png' : 'image/jpeg';
      result.artworkBlob = new Blob([data.subarray(offset)], { type: mime });
    }
  } catch (e) {
    console.warn('PIC parse error:', e);
  }
}

// --- ID3v1 PARSING (Fallback) ---
function parseID3v1(buffer, result) {
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 128) return;
  const tag = String.fromCharCode(bytes[0], bytes[1], bytes[2]);
  if (tag !== 'TAG') return;

  const readStr = (start, length) => {
    let str = '';
    for (let i = start; i < start + length; i++) {
      if (bytes[i] === 0) break;
      str += String.fromCharCode(bytes[i]);
    }
    return str.trim();
  };

  const title = readStr(3, 30);
  const artist = readStr(33, 30);
  const album = readStr(63, 30);

  if (title && !result.title) result.title = title;
  if (artist && !result.artist) result.artist = artist;
  if (album && !result.album) result.album = album;
}

// --- MP4 / M4A PARSING ---
function isMP4(buffer) {
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 8) return false;
  const ftyp = String.fromCharCode(bytes[4], bytes[5], bytes[6], bytes[7]);
  return ftyp === 'ftyp' || ftyp === 'moov';
}

async function parseMP4(file, result) {
  // Read first 2MB to find moov and ilst
  const readSize = Math.min(file.size, 2 * 1024 * 1024);
  const buffer = await readFileSlice(file, 0, readSize);
  const bytes = new Uint8Array(buffer);

  function findAtom(parentBytes, name, isMeta = false) {
    let off = isMeta ? 4 : 0;
    while (off + 8 <= parentBytes.length) {
      const size = (parentBytes[off] << 24) | (parentBytes[off + 1] << 16) | (parentBytes[off + 2] << 8) | parentBytes[off + 3];
      const type = String.fromCharCode(parentBytes[off + 4], parentBytes[off + 5], parentBytes[off + 6], parentBytes[off + 7]);

      if (size === 1) break; // 64-bit size not handled for header
      if (size < 8) break;

      if (type === name) {
        return parentBytes.subarray(off + 8, Math.min(off + size, parentBytes.length));
      }
      off += size;
    }
    return null;
  }

  const moov = findAtom(bytes, 'moov');
  if (!moov) return;
  const udta = findAtom(moov, 'udta');
  if (!udta) return;
  const meta = findAtom(udta, 'meta');
  if (!meta) return;
  const ilst = findAtom(meta, 'ilst', true);
  if (!ilst) return;

  // Traverse ilst atoms
  let off = 0;
  while (off + 8 <= ilst.length) {
    const atomSize = (ilst[off] << 24) | (ilst[off + 1] << 16) | (ilst[off + 2] << 8) | ilst[off + 3];
    const atomName = String.fromCharCode(ilst[off + 4], ilst[off + 5], ilst[off + 6], ilst[off + 7]);

    if (atomSize < 8 || off + atomSize > ilst.length) break;

    const atomData = ilst.subarray(off + 8, off + atomSize);
    off += atomSize;

    // Inside atomData, find 'data' atom
    const dataAtom = findAtom(atomData, 'data');
    if (dataAtom && dataAtom.length >= 8) {
      const dataType = (dataAtom[0] << 24) | (dataAtom[1] << 16) | (dataAtom[2] << 8) | dataAtom[3];
      const payload = dataAtom.subarray(8);

      if (atomName === '\u00A9nam') {
        result.title = new TextDecoder('utf-8').decode(payload).trim();
      } else if (atomName === '\u00A9ART' || atomName === 'aART') {
        result.artist = new TextDecoder('utf-8').decode(payload).trim();
      } else if (atomName === '\u00A9alb') {
        result.album = new TextDecoder('utf-8').decode(payload).trim();
      } else if (atomName === 'covr' && !result.artworkBlob) {
        const mime = dataType === 14 ? 'image/png' : 'image/jpeg';
        result.artworkBlob = new Blob([payload], { type: mime });
      }
    }
  }
}

// --- FLAC PARSING ---
function isFLAC(buffer) {
  const bytes = new Uint8Array(buffer);
  return bytes[0] === 0x66 && bytes[1] === 0x4c && bytes[2] === 0x61 && bytes[3] === 0x43; // 'fLaC'
}

async function parseFLAC(file, headerBuffer, result) {
  const bytes = new Uint8Array(headerBuffer);
  let offset = 4;

  while (offset + 4 <= bytes.length) {
    const headerByte = bytes[offset];
    const isLast = (headerByte & 0x80) !== 0;
    const blockType = headerByte & 0x7f;
    const length = (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3];
    offset += 4;

    if (offset + length > bytes.length) break;
    const blockData = bytes.subarray(offset, offset + length);
    offset += length;

    // Block 4: Vorbis comment
    if (blockType === 4) {
      parseVorbisComment(blockData, result);
    }
    // Block 6: Picture
    else if (blockType === 6 && !result.artworkBlob) {
      parseFlacPicture(blockData, result);
    }

    if (isLast) break;
  }
}

function parseVorbisComment(data, result) {
  try {
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    let off = 0;
    const vendorLength = view.getUint32(off, true);
    off += 4 + vendorLength;

    const userCommentCount = view.getUint32(off, true);
    off += 4;

    for (let i = 0; i < userCommentCount && off + 4 <= data.length; i++) {
      const len = view.getUint32(off, true);
      off += 4;
      if (off + len > data.length) break;

      const commentStr = new TextDecoder('utf-8').decode(data.subarray(off, off + len));
      off += len;

      const eqIdx = commentStr.indexOf('=');
      if (eqIdx !== -1) {
        const fieldName = commentStr.substring(0, eqIdx).toUpperCase();
        const fieldValue = commentStr.substring(eqIdx + 1).trim();

        if (fieldName === 'TITLE' && !result.title) result.title = fieldValue;
        else if (fieldName === 'ARTIST' && !result.artist) result.artist = fieldValue;
        else if (fieldName === 'ALBUM' && !result.album) result.album = fieldValue;
      }
    }
  } catch (e) {
    console.warn('Vorbis comment parse error:', e);
  }
}

function parseFlacPicture(data, result) {
  try {
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    let off = 4; // Skip picture type (4 bytes)

    const mimeLen = view.getUint32(off, false);
    off += 4;
    const mime = new TextDecoder('ascii').decode(data.subarray(off, off + mimeLen));
    off += mimeLen;

    const descLen = view.getUint32(off, false);
    off += 4 + descLen;

    off += 16; // Skip width(4), height(4), depth(4), colors(4)
    const picDataLen = view.getUint32(off, false);
    off += 4;

    if (off + picDataLen <= data.length) {
      result.artworkBlob = new Blob([data.subarray(off, off + picDataLen)], { type: mime || 'image/jpeg' });
    }
  } catch (e) {
    console.warn('FLAC picture parse error:', e);
  }
}

function getMimeFromExtension(filename) {
  const ext = (filename.split('.').pop() || '').toLowerCase();
  switch (ext) {
    case 'mp3': return 'audio/mpeg';
    case 'm4a': return 'audio/mp4';
    case 'wav': return 'audio/wav';
    case 'ogg': return 'audio/ogg';
    case 'flac': return 'audio/flac';
    case 'aac': return 'audio/aac';
    default: return 'audio/mpeg';
  }
}
