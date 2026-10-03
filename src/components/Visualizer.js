// LocalTunes Canvas Audio Visualizer
import { player } from '../services/player.js';

export class AudioVisualizer {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.animationId = null;
    this.isRunning = false;
    this.barCount = 28;

    this.resize = this.resize.bind(this);
    this.draw = this.draw.bind(this);

    window.addEventListener('resize', this.resize);
    this.resize();
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = (rect.width || 300) * dpr;
    this.canvas.height = (rect.height || 64) * dpr;
    this.ctx.scale(dpr, dpr);
    this.width = rect.width || 300;
    this.height = rect.height || 64;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.resize();
    this.draw();
  }

  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.clear();
  }

  clear() {
    if (!this.ctx || !this.width) return;
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  draw() {
    if (!this.isRunning) return;

    this.ctx.clearRect(0, 0, this.width, this.height);

    const freqData = player.getFrequencyData();
    const isPlaying = player.isPlaying;

    const totalWidth = this.width;
    const gap = 3;
    const barWidth = Math.max(2, (totalWidth - (this.barCount - 1) * gap) / this.barCount);

    // Gradient styling
    const gradient = this.ctx.createLinearGradient(0, this.height, 0, 0);
    gradient.addColorStop(0, '#06b6d4');
    gradient.addColorStop(0.5, '#3b82f6');
    gradient.addColorStop(1, '#a855f7');

    this.ctx.fillStyle = gradient;

    const time = Date.now() * 0.003;

    for (let i = 0; i < this.barCount; i++) {
      let height = 3;

      if (isPlaying && freqData && freqData.length > 0) {
        // Map bar index to frequency bin
        const binIndex = Math.floor((i / this.barCount) * (freqData.length * 0.7));
        const val = freqData[binIndex] || 0;
        const normalized = val / 255;
        height = Math.max(3, normalized * (this.height - 4));
      } else if (isPlaying) {
        // Fallback procedural wave if WebAudio node is pending
        const wave = (Math.sin(time + i * 0.4) + 1) * 0.5;
        height = Math.max(3, wave * (this.height * 0.5));
      }

      const x = i * (barWidth + gap);
      const y = this.height - height;
      const radius = Math.min(barWidth / 2, 3);

      this.drawRoundedBar(x, y, barWidth, height, radius);
    }

    this.animationId = requestAnimationFrame(this.draw);
  }

  drawRoundedBar(x, y, width, height, radius) {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height);
    this.ctx.lineTo(x, y + height);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
    this.ctx.fill();
  }

  destroy() {
    this.stop();
    window.removeEventListener('resize', this.resize);
  }
}
