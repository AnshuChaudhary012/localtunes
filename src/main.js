// LocalTunes Entry Point
import './styles/style.css';
import { app } from './app.js';

document.addEventListener('DOMContentLoaded', () => {
  app.init().catch((err) => {
    console.error('Fatal initialization error:', err);
  });
});
