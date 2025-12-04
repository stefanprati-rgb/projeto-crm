// public/app/ui/navigation.js

// Classes para o estado "Ativo" do Menu Lateral
const NAV_ACTIVE_CLASSES = ['bg-white', 'text-primary-700', 'shadow-sm', 'font-semibold'];
const NAV_INACTIVE_CLASSES = ['text-slate-500', 'hover:bg-white/60', 'hover:text-primary-700'];

export class NavigationManager {
    /**
     * @param {string} initialSection - A seção inicial ('dashboard')
     * @param {function} refreshUICallback - Callback para atualizar a UI da seção ativa no CRMApp
     * @param {boolean} skipInitialShow - Se true, não chama showSection no construtor
     */
    constructor(initialSection, refreshUICallback, skipInitialShow = false) {
        this.activeSection = initialSection;
        this.refreshUICallback = refreshUICallback;
        this.bindNav();

        // Only show initial section if not skipped (allows parent to control timing)
        if (!skipInitialShow) {
            this.showSection(this.activeSection);
        }
    }

    bindNav() {
        document.querySelectorAll('.nav-link[data-section]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = e.currentTarget.dataset.section;
                this.showSection(sectionId);
            });
        });
    }

    /**
     * Altera a seção ativa na interface do CRM.
     * @param {string} sectionId - O ID da seção a ser exibida.
     */
    showSection(sectionId) {
        this.activeSection = sectionId;
        const titleEl = document.getElementById('sectionTitle');
        const subtitleEl = document.getElementById('sectionSubtitle');

        if (titleEl) {
            const titles = {
                'dashboard': 'Visão Geral',
                'clients': 'Carteira de Clientes',
                'finance': 'Gestão Financeira',
                'tickets': 'Central de Tickets'
            };
            const subtitles = {
                'dashboard': 'Resumo da operação e indicadores chave.',
                'clients': 'Visualize, filtre e gerencie a carteira de clientes.',
                'finance': 'Acompanhe o faturamento, pagamentos e inadimplência.',
                'tickets': 'Gerencie solicitações de suporte e tarefas pendentes.'
            };

            titleEl.textContent = titles[sectionId] || 'CRM Energia';
            if (subtitleEl) {
                subtitleEl.textContent = subtitles[sectionId] || 'CRM Energia';
            }
        }

        // Esconde todas as seções e mostra a alvo
        document.querySelectorAll('.section-content').forEach(s => s.classList.add('hidden'));
        const target = document.getElementById(`${sectionId}-section`);
        if (target) {
            target.classList.remove('hidden');
            target.classList.add('fade-in');
        }

        this.updateNavHighlight(sectionId);

        // Dispara a atualização do conteúdo da seção no CRMApp principal
        if (this.refreshUICallback) {
            this.refreshUICallback();
        }
    }

    /**
     * Atualiza o destaque visual do item de navegação ativo.
     * @param {string} activeId 
     */
    updateNavHighlight(activeId) {
        document.querySelectorAll('.nav-link').forEach(link => {
            const isTarget = link.dataset.section === activeId;
            link.classList.remove(...NAV_ACTIVE_CLASSES, ...NAV_INACTIVE_CLASSES);
            if (isTarget) {
                link.classList.add(...NAV_ACTIVE_CLASSES);
            } else {
                link.classList.add(...NAV_INACTIVE_CLASSES);
            }
        });
    }
}