// Sistema de Notificações (Toasts) Moderno com Tailwind CSS
// Substitui a dependência do Bootstrap Toasts por Javascript Puro + Classes Utilitárias

export function showToast(message, type = 'info') {
  const container = document.querySelector('.toast-container');
  if (!container) return;

  // Definição de Cores e Ícones baseados no tipo
  let bgClass, icon;

  switch (type) {
    case 'success':
      bgClass = 'bg-emerald-600 text-white'; // Verde Esmeralda
      icon = '<i class="fas fa-check-circle text-lg opacity-90"></i>';
      break;

    case 'danger':
      bgClass = 'bg-rose-500 text-white'; // Vermelho/Rosa
      icon = '<i class="fas fa-exclamation-triangle text-lg opacity-90"></i>';
      break;

    case 'warning':
      bgClass = 'bg-amber-500 text-white'; // Laranja/Âmbar
      icon = '<i class="fas fa-exclamation-circle text-lg opacity-90"></i>';
      break;

    default: // info
      bgClass = 'bg-slate-800 text-white'; // Escuro Profundo (Slate)
      icon = '<i class="fas fa-info-circle text-lg opacity-90"></i>';
  }

  // Criação do Elemento HTML
  const el = document.createElement('div');

  // Classes iniciais (inclui translate-x-full para animação de entrada vindo da direita)
  el.className = `flex items-center gap-3 px-5 py-4 min-w-[300px] max-w-sm rounded-xl shadow-xl shadow-slate-300/50 transform transition-all duration-500 translate-x-full opacity-0 ${bgClass}`;

  el.innerHTML = `
    <div class="shrink-0">${icon}</div>
    <div class="flex-1 text-sm font-semibold leading-tight">${message}</div>
    <button class="shrink-0 ml-2 text-white/60 hover:text-white transition-colors p-1" aria-label="Fechar">
      <i class="fas fa-times"></i>
    </button>
  `;

  // Adiciona ao container
  container.appendChild(el);

  // Botão de fechar manual
  const btnClose = el.querySelector('button');
  btnClose.onclick = () => removeToast(el);

  // Trigger da Animação de Entrada (Next Frame)
  requestAnimationFrame(() => {
    el.classList.remove('translate-x-full', 'opacity-0');
  });

  // Auto-remove após 4 segundos
  const timer = setTimeout(() => {
    removeToast(el);
  }, 4000);

  // Pausa o timer se passar o mouse (UX amigável)
  el.onmouseenter = () => clearTimeout(timer);
  el.onmouseleave = () => {
    setTimeout(() => removeToast(el), 1000);
  };
}

function removeToast(el) {
  // Animação de Saída (Fade out e desliza para direita)
  el.classList.add('opacity-0', 'translate-x-4', 'scale-95');

  // Remove do DOM após a animação CSS terminar
  setTimeout(() => {
    if (el && el.parentElement) {
      el.remove();
    }
  }, 500);
}