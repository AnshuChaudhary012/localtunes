// LocalTunes Accessible Modal Component
import { icons } from '../utils/icons.js';

class ModalManager {
  constructor() {
    this.activeModal = null;
    this.keyHandler = null;
  }

  show({ title, contentHtml, onConfirm = null, confirmText = 'Confirm', confirmStyle = 'cyan', cancelText = 'Cancel', showCancel = true }) {
    this.close();

    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md opacity-0 transition-opacity duration-200';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    const btnStyle = confirmStyle === 'danger'
      ? 'bg-rose-600 hover:bg-rose-500 text-white'
      : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-glow';

    overlay.innerHTML = `
      <div class="relative w-full max-w-md max-h-[90vh] flex flex-col p-5 sm:p-6 bg-dark-card border border-dark-border rounded-2xl shadow-2xl transform scale-95 transition-transform duration-200">
        <!-- Header -->
        <div class="flex items-center justify-between pb-3 sm:pb-4 border-b border-white/5 flex-shrink-0">
          <h3 class="text-base sm:text-lg font-semibold text-white tracking-wide">${escapeHtml(title)}</h3>
          <button class="modal-close text-slate-400 hover:text-white p-1 rounded-lg transition-colors" aria-label="Close modal">
            ${icons.x('w-5 h-5')}
          </button>
        </div>

        <!-- Body -->
        <div class="modal-content my-3 sm:my-4 text-slate-300 text-sm overflow-y-auto flex-1 pr-1">
          ${contentHtml}
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
          ${showCancel ? `
            <button class="modal-cancel px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
              ${escapeHtml(cancelText)}
            </button>
          ` : ''}
          ${onConfirm ? `
            <button class="modal-confirm px-5 py-2 text-sm font-medium rounded-xl transition-all ${btnStyle}">
              ${escapeHtml(confirmText)}
            </button>
          ` : ''}
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.activeModal = overlay;

    const closeBtn = overlay.querySelector('.modal-close');
    const cancelBtn = overlay.querySelector('.modal-cancel');
    const confirmBtn = overlay.querySelector('.modal-confirm');

    const handleClose = () => this.close();

    closeBtn.addEventListener('click', handleClose);
    if (cancelBtn) cancelBtn.addEventListener('click', handleClose);

    if (confirmBtn && onConfirm) {
      confirmBtn.addEventListener('click', async () => {
        try {
          const keepOpen = await onConfirm(overlay);
          if (keepOpen !== false) {
            handleClose();
          }
        } catch (e) {
          console.error('Modal confirm error:', e);
        }
      });
    }

    // Backdrop click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) handleClose();
    });

    // Keyboard ESC
    this.keyHandler = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', this.keyHandler);

    // Animate open
    requestAnimationFrame(() => {
      overlay.classList.remove('opacity-0');
      const dialog = overlay.querySelector('div');
      if (dialog) dialog.classList.remove('scale-95');
    });

    return overlay;
  }

  close() {
    if (!this.activeModal) return;

    if (this.keyHandler) {
      window.removeEventListener('keydown', this.keyHandler);
      this.keyHandler = null;
    }

    const modal = this.activeModal;
    this.activeModal = null;

    modal.classList.add('opacity-0');
    const dialog = modal.querySelector('div');
    if (dialog) dialog.classList.add('scale-95');

    setTimeout(() => {
      if (modal.parentElement) modal.parentElement.removeChild(modal);
    }, 200);
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export const modal = new ModalManager();
