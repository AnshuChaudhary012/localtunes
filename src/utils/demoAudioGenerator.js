// LocalTunes Demo Audio Synthesizer
// Generates a rich, ambient 12-second chill lo-fi melody in pure WAV format without any external file.

export function generateDemoAudioBlob() {
  const sampleRate = 44100;
  const duration = 12; // 12 seconds
  const totalSamples = sampleRate * duration;
  const numChannels = 2;
  const bytesPerSample = 2; // 16-bit
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = totalSamples * blockAlign;

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  // fmt subchunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // BitsPerSample

  // data subchunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Chord Progression: Cmaj7 -> Am7 -> Fmaj7 -> Gsus4
  // Notes in Hz:
  const chords = [
    [261.63, 329.63, 392.00, 493.88], // C, E, G, B
    [220.00, 261.63, 329.63, 392.00], // A, C, E, G
    [174.61, 220.00, 261.63, 329.63], // F, A, C, E
    [196.00, 246.94, 293.66, 392.00], // G, B, D, G
  ];

  let offset = 44;
  const chordDuration = duration / chords.length;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const chordIndex = Math.min(chords.length - 1, Math.floor(t / chordDuration));
    const chord = chords[chordIndex];
    const chordT = (t % chordDuration) / chordDuration;

    // Amplitude envelope: soft attack, gentle decay
    const attack = Math.min(1, chordT * 6);
    const release = Math.max(0, 1 - Math.pow(chordT, 2));
    const envelope = attack * release;

    let sampleLeft = 0;
    let sampleRight = 0;

    chord.forEach((freq, idx) => {
      // Warm synth: fundamental + subtle 2nd harmonic
      const pan = (idx % 2 === 0) ? 0.7 : 0.3;
      const osc = Math.sin(2 * Math.PI * freq * t) + 0.35 * Math.sin(4 * Math.PI * freq * t);
      sampleLeft += osc * pan;
      sampleRight += osc * (1 - pan);
    });

    // Subtle beat tick on beats
    const beatPhase = (t * 2) % 1;
    if (beatPhase < 0.05) {
      const click = Math.sin(2 * Math.PI * 80 * beatPhase) * (1 - beatPhase / 0.05) * 0.4;
      sampleLeft += click;
      sampleRight += click;
    }

    sampleLeft = Math.max(-1, Math.min(1, (sampleLeft / (chord.length * 1.5)) * envelope * 0.8));
    sampleRight = Math.max(-1, Math.min(1, (sampleRight / (chord.length * 1.5)) * envelope * 0.8));

    // Convert to 16-bit PCM integers
    const intLeft = sampleLeft < 0 ? sampleLeft * 0x8000 : sampleLeft * 0x7fff;
    const intRight = sampleRight < 0 ? sampleRight * 0x8000 : sampleRight * 0x7fff;

    view.setInt16(offset, intLeft, true);
    view.setInt16(offset + 2, intRight, true);
    offset += 4;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
