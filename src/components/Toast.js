// LocalTunes Toast Notification System

class ToastManager {
  constructor() {
    this.container = null;
    this.init();
  }

  init() {
    if (this.container) return;
    this.container = document.createElement('div');
    this.container.id = 'toast-container';
    this.container.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4';
    document.body.appendChild(this.container);
  }

  show({ message, type = 'info', duration = 3500 }) {
    this.init();

    const toast = document.createElement('div');
    toast.className = `pointer-events-auto flex items-center gap-3 p-4 rounded-xl shadow-glass border transition-all duration-300 transform translate-y-[-10px] opacity-0 ${this.getTypeStyles(type)}`;

    const icon = this.getTypeIcon(type);

    toast.innerHTML = `
      <div class="flex-shrink-0">${icon}</div>
      <div class="flex-1 text-sm font-medium text-slate-100">${escapeHtml(message)}</div>
      <button class="text-slate-400 hover:text-white p-1 rounded-lg focus:outline-none transition-colors" aria-label="Close">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    `;

    const closeBtn = toast.querySelector('button');
    let dismissTimer = null;

    const dismiss = () => {
      clearTimeout(dismissTimer);
      toast.classList.add('opacity-0', 'translate-y-[-10px]');
      setTimeout(() => {
        if (toast.parentElement) toast.parentElement.removeChild(toast);
      }, 300);
    };

    closeBtn.addEventListener('click', dismiss);

    this.container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.classList.remove('opacity-0', 'translate-y-[-10px]');
    });

    if (duration > 0) {
      dismissTimer = setTimeout(dismiss, duration);
    }

    return { dismiss };
  }

  getTypeStyles(type) {
    switch (type) {
      case 'success':
        return 'bg-emerald-950/90 border-emerald-500/30 text-emerald-200';
      case 'error':
        return 'bg-rose-950/90 border-rose-500/30 text-rose-200';
      case 'warning':
        return 'bg-amber-950/90 border-amber-500/30 text-amber-200';
      default:
        return 'bg-dark-card/95 border-dark-border text-slate-200';
    }
  }

  getTypeIcon(type) {
    switch (type) {
      case 'success':
        return `<svg class="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`;
      case 'error':
        return `<svg class="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
      case 'warning':
        return `<svg class="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`;
      default:
        return `<svg class="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
    }
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export const toast = new ToastManager();
