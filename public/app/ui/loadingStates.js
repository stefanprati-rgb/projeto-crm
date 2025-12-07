// Loading States Component - Estados de carregamento reutilizáveis

/**
 * Mostra um spinner de loading em um elemento
 * @param {HTMLElement|string} element - Elemento ou ID do elemento
 * @param {boolean} show - Mostrar ou esconder
 */
export function showLoadingSpinner(element, show = true) {
    const el = typeof element === 'string' ? document.getElementById(element) : element;
    if (!el) return;

    if (show) {
        el.innerHTML = `
      <div class="flex items-center justify-center py-12">
        <div class="text-center">
          <div class="inline-block w-12 h-12 border-4 border-slate-200 border-t-primary-600 rounded-full animate-spin"></div>
          <p class="mt-4 text-sm text-slate-600">Carregando...</p>
        </div>
      </div>
    `;
    }
}

/**
 * Mostra skeleton loading (placeholder animado)
 * @param {HTMLElement|string} element - Elemento ou ID do elemento
 * @param {number} count - Número de skeletons
 * @param {string} type - Tipo de skeleton (card, table, list)
 */
export function showSkeleton(element, count = 3, type = 'card') {
    const el = typeof element === 'string' ? document.getElementById(element) : element;
    if (!el) return;

    const skeletons = {
        card: `
      <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div class="skeleton h-6 w-1/3 rounded mb-3"></div>
        <div class="skeleton h-4 w-full rounded mb-2"></div>
        <div class="skeleton h-4 w-2/3 rounded"></div>
      </div>
    `,
        table: `
      <tr>
        <td class="px-6 py-4"><div class="skeleton h-4 w-32 rounded"></div></td>
        <td class="px-6 py-4"><div class="skeleton h-4 w-24 rounded"></div></td>
        <td class="px-6 py-4"><div class="skeleton h-4 w-20 rounded"></div></td>
        <td class="px-6 py-4"><div class="skeleton h-4 w-16 rounded"></div></td>
      </tr>
    `,
        list: `
      <div class="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-lg">
        <div class="skeleton w-10 h-10 rounded-full"></div>
        <div class="flex-1">
          <div class="skeleton h-4 w-1/2 rounded mb-2"></div>
          <div class="skeleton h-3 w-1/3 rounded"></div>
        </div>
      </div>
    `
    };

    const template = skeletons[type] || skeletons.card;
    const html = Array(count).fill(template).join('');

    if (type === 'table') {
        el.innerHTML = html;
    } else {
        el.innerHTML = `<div class="space-y-4">${html}</div>`;
    }
}

/**
 * Mostra overlay de loading em tela cheia
 * @param {boolean} show - Mostrar ou esconder
 * @param {string} message - Mensagem opcional
 */
export function showFullScreenLoading(show = true, message = 'Carregando...') {
    let overlay = document.getElementById('fullscreen-loading-overlay');

    if (show) {
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'fullscreen-loading-overlay';
            overlay.className = 'fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm loading-overlay';
            document.body.appendChild(overlay);
        }

        overlay.innerHTML = `
      <div class="text-center">
        <div class="inline-block w-16 h-16 border-4 border-slate-200 border-t-primary-600 rounded-full animate-spin"></div>
        <p class="mt-4 text-sm text-slate-700 font-medium">${message}</p>
      </div>
    `;
        overlay.classList.remove('hidden');
    } else {
        if (overlay) {
            overlay.classList.add('hidden');
            setTimeout(() => overlay.remove(), 300);
        }
    }
}

/**
 * Mostra loading inline em um botão
 * @param {HTMLElement|string} button - Botão ou ID do botão
 * @param {boolean} loading - Estado de loading
 * @param {string} originalText - Texto original do botão
 */
export function showButtonLoading(button, loading = true, originalText = null) {
    const btn = typeof button === 'string' ? document.getElementById(button) : button;
    if (!btn) return;

    if (loading) {
        btn.disabled = true;
        btn.dataset.originalText = btn.textContent;
        btn.innerHTML = `
      <i class="fas fa-circle-notch fa-spin mr-2"></i>
      ${originalText || 'Carregando...'}
    `;
    } else {
        btn.disabled = false;
        btn.textContent = btn.dataset.originalText || originalText || 'Salvar';
        delete btn.dataset.originalText;
    }
}

/**
 * Mostra estado vazio (empty state)
 * @param {HTMLElement|string} element - Elemento ou ID do elemento
 * @param {Object} options - Opções de configuração
 */
export function showEmptyState(element, options = {}) {
    const el = typeof element === 'string' ? document.getElementById(element) : element;
    if (!el) return;

    const {
        icon = 'fa-inbox',
        title = 'Nenhum item encontrado',
        description = 'Não há dados para exibir no momento.',
        actionText = null,
        actionCallback = null
    } = options;

    const actionButton = actionText && actionCallback ? `
    <button 
      class="mt-4 px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-all"
      onclick="(${actionCallback.toString()})()"
    >
      ${actionText}
    </button>
  ` : '';

    el.innerHTML = `
    <div class="text-center py-16">
      <div class="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
        <i class="fas ${icon} text-2xl text-slate-400"></i>
      </div>
      <h3 class="text-lg font-semibold text-slate-900 mb-2">${title}</h3>
      <p class="text-sm text-slate-600 max-w-md mx-auto">${description}</p>
      ${actionButton}
    </div>
  `;
}

/**
 * Mostra loading em um input/select
 * @param {HTMLElement|string} input - Input ou ID do input
 * @param {boolean} loading - Estado de loading
 */
export function showInputLoading(input, loading = true) {
    const el = typeof input === 'string' ? document.getElementById(input) : input;
    if (!el) return;

    if (loading) {
        el.disabled = true;
        el.classList.add('opacity-50', 'cursor-not-allowed');

        // Adiciona spinner ao lado do input
        if (!el.nextElementSibling?.classList.contains('input-spinner')) {
            const spinner = document.createElement('div');
            spinner.className = 'input-spinner absolute right-3 top-1/2 transform -translate-y-1/2';
            spinner.innerHTML = '<i class="fas fa-circle-notch fa-spin text-primary-600"></i>';

            if (el.parentElement.style.position !== 'relative') {
                el.parentElement.style.position = 'relative';
            }
            el.parentElement.appendChild(spinner);
        }
    } else {
        el.disabled = false;
        el.classList.remove('opacity-50', 'cursor-not-allowed');

        // Remove spinner
        const spinner = el.nextElementSibling;
        if (spinner?.classList.contains('input-spinner')) {
            spinner.remove();
        }
    }
}

/**
 * Mostra progresso de upload/processamento
 * @param {HTMLElement|string} element - Elemento ou ID do elemento
 * @param {number} progress - Progresso (0-100)
 * @param {string} message - Mensagem
 */
export function showProgress(element, progress = 0, message = 'Processando...') {
    const el = typeof element === 'string' ? document.getElementById(element) : element;
    if (!el) return;

    el.innerHTML = `
    <div class="w-full max-w-md mx-auto">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium text-slate-700">${message}</span>
        <span class="text-sm font-semibold text-primary-600">${Math.round(progress)}%</span>
      </div>
      <div class="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
        <div 
          class="bg-primary-600 h-2 rounded-full transition-all duration-300"
          style="width: ${progress}%"
        ></div>
      </div>
    </div>
  `;
}

/**
 * Cria um toast de loading que pode ser atualizado
 * @param {string} message - Mensagem inicial
 * @returns {Object} Objeto com métodos update e close
 */
export function createLoadingToast(message = 'Carregando...') {
    const container = document.querySelector('.toast-container');
    if (!container) return { update: () => { }, close: () => { } };

    const el = document.createElement('div');
    el.className = 'flex items-center gap-3 px-5 py-4 min-w-[300px] max-w-sm rounded-xl shadow-xl shadow-slate-300/50 bg-slate-800 text-white pointer-events-auto';

    el.innerHTML = `
    <div class="shrink-0">
      <i class="fas fa-circle-notch fa-spin text-lg"></i>
    </div>
    <div class="flex-1 text-sm font-semibold leading-tight loading-toast-message">${message}</div>
  `;

    container.appendChild(el);

    return {
        update: (newMessage) => {
            const messageEl = el.querySelector('.loading-toast-message');
            if (messageEl) messageEl.textContent = newMessage;
        },
        close: () => {
            el.classList.add('opacity-0', 'translate-x-4', 'scale-95');
            setTimeout(() => el.remove(), 300);
        }
    };
}
