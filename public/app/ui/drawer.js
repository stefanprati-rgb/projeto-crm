// public/app/ui/drawer.js
import { showToast } from "./toast.js";

export class DrawerManager {
    constructor(timelineUI, tasksUI, getTableData, getDashboardData, clientService, getCurrentBase, getUserRole) {
        this.timelineUI = timelineUI;
        this.tasksUI = tasksUI;
        this.getTableData = getTableData; // Função que retorna this.tableData do crmApp
        this.getDashboardData = getDashboardData; // Função que retorna this.dashboardData
        this.clientService = clientService; // Serviço de Cliente
        this.getCurrentBase = getCurrentBase; // Função que retorna this.currentBase
        this.getUserRole = getUserRole; // Função que retorna this.userRole

        this.drawer = document.getElementById('client-drawer');
        this.overlay = document.getElementById('client-drawer-overlay');

        this.bindEvents();
    }

    bindEvents() {
        document.getElementById('closeDrawerBtn')?.addEventListener('click', () => this.closeDrawer());
        document.getElementById('client-drawer-overlay')?.addEventListener('click', () => this.closeDrawer());

        // Tabs
        const tabBtns = document.querySelectorAll('.drawer-tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = btn.dataset.tab;
                this.switchTab(targetId, btn, tabBtns);
            });
        });

        // Ativar a primeira aba no carregamento
        const firstTab = document.querySelector('[data-tab="tab-overview"]');
        if (firstTab) this.switchTab('tab-overview', firstTab, tabBtns);
    }

    switchTab(targetId, activeBtn, allBtns) {
        // UI dos Botões
        allBtns.forEach(b => {
            b.classList.remove('active', 'text-primary-700', 'border-primary-600');
            b.classList.add('text-slate-400', 'border-transparent');
        });

        activeBtn.classList.remove('text-slate-400', 'border-transparent');
        activeBtn.classList.add('active', 'text-primary-700', 'border-primary-600');

        // Conteúdo
        document.querySelectorAll('.drawer-content').forEach(c => c.classList.add('hidden'));
        const target = document.getElementById(targetId);
        if (target) {
            target.classList.remove('hidden');
            target.classList.add('fade-in');
        }
    }


    /**
     * Mostra a gaveta de detalhes do cliente e carrega os dados.
     * @param {string} id - ID do cliente (opcional para criação)
     */
    showClientModal(id = null) {
        document.getElementById('clientForm').reset();
        document.getElementById('clientId').value = '';

        // Limpa listeners (os UIs já devem cuidar disso, mas reforçamos)
        this.timelineUI.destroy();
        this.tasksUI.destroy();

        const isEditing = !!id;

        if (id) {
            const c = this.getTableData().find(x => x.id === id) || this.getDashboardData().find(x => x.id === id);

            if (c) {
                document.getElementById('clientId').value = c.id;
                document.getElementById('drawerClientName').textContent = c.name || 'Cliente Sem Nome';
                document.getElementById('drawerClientId').textContent = `ID: ${c.externalId || '-'}`;
                document.getElementById('drawerClientUC').textContent = `UC: ${c.instalacao || '-'}`;

                // Preenchimento do formulário
                const fields = {
                    'Name': c.name, 'ExternalId': c.externalId, 'Cpf': c.cpf, 'Cnpj': c.cnpj,
                    'Email': c.email, 'Phone': c.phone, 'Address': c.address, 'State': c.state, 'City': c.city,
                    'Status': c.status, 'ContractType': c.contractType, 'JoinDate': c.joinDate ? c.joinDate.split('T')[0] : '',
                    'Consumption': c.consumption, 'Discount': c.discount, 'Instalacao': c.instalacao
                };

                for (const [key, val] of Object.entries(fields)) {
                    const el = document.getElementById(`client${key}`);
                    if (el) el.value = val || '';
                }

                // Carrega subcoleções
                this.timelineUI.loadTimeline(c.id);
                this.tasksUI.loadTasks(c.id);
            }
        } else {
            document.getElementById('drawerClientName').textContent = 'Novo Cliente';
            document.getElementById('drawerClientId').textContent = 'ID: -';
            document.getElementById('drawerClientUC').textContent = 'UC: -';
            const elDate = document.getElementById('clientJoinDate');
            if (elDate) elDate.value = new Date().toISOString().split('T')[0];
        }

        // Exibe a gaveta
        if (this.drawer && this.overlay) {
            this.overlay.classList.remove('hidden');
            setTimeout(() => this.overlay.classList.remove('opacity-0'), 10);
            this.drawer.classList.remove('translate-x-full');
        }

        // Garante que o botão de salvar/editar está visível/oculto conforme a permissão
        const saveBtn = document.getElementById('clientModalSaveButton');
        if (saveBtn) {
            saveBtn.classList.toggle('hidden', this.getUserRole() !== 'editor');
            saveBtn.querySelector('#saveButtonText').textContent = isEditing ? 'Salvar Edição' : 'Criar Cliente';
        }
    }

    /**
     * Fecha a gaveta de detalhes do cliente.
     */
    closeDrawer() {
        if (this.drawer && this.overlay) {
            this.drawer.classList.add('translate-x-full');
            this.overlay.classList.add('opacity-0');
            setTimeout(() => {
                this.overlay.classList.add('hidden');
                this.timelineUI.destroy();
                this.tasksUI.destroy();
            }, 300);
        }
    }
}