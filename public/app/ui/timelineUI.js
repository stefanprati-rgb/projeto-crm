// public/app/ui/timelineUI.js
import { showToast } from "./toast.js";
import { showButtonLoading } from "./loadingStates.js";

export class TimelineUI {
    constructor(timelineService) {
        this.service = timelineService;
        this.unsubscribe = null;
        this.containerId = 'activityTimeline';
        this.formId = 'activityForm';
    }

    /**
     * Inicia a escuta em tempo real para a timeline de um cliente.
     * @param {string} clientId - ID do cliente
     */
    loadTimeline(clientId) {
        this.destroy(); // Limpa escutas anteriores
        const container = document.getElementById(this.containerId);
        if (!container) return;
        container.innerHTML = '<div class="text-center py-8 text-slate-400 text-sm">Carregando histórico...</div>';

        this.unsubscribe = this.service.listenToTimeline(clientId, (activities) => {
            if (activities.length === 0) {
                container.innerHTML = '<div class="text-center py-8 text-slate-400 text-sm">Nenhuma atividade registrada.</div>';
                return;
            }

            container.innerHTML = activities.map(act => this.renderActivity(act)).join('');
        });

        this.bindFormEvents(clientId);
    }

    renderActivity(act) {
        const date = new Date(act.createdAt).toLocaleDateString() +
            ' ' + new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        let iconClass = 'fa-comment';
        let bgClass = 'bg-slate-100 text-slate-500';
        let typeText = act.type;

        if (act.type === 'whatsapp') { iconClass = 'fa-whatsapp'; bgClass = 'bg-green-100 text-green-600'; typeText = 'WhatsApp'; }
        else if (act.type === 'call') { iconClass = 'fa-phone'; bgClass = 'bg-blue-100 text-blue-600'; typeText = 'Ligação'; }
        else if (act.type === 'email') { iconClass = 'fa-envelope'; bgClass = 'bg-amber-100 text-amber-600'; typeText = 'E-mail'; }

        return `
          <div class="flex gap-3 p-3 bg-white border border-slate-100 rounded-xl shadow-sm fade-in">
            <div class="shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${bgClass}">
              <i class="fas ${iconClass} text-xs"></i>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex justify-between items-start">
                <p class="text-xs font-bold text-slate-700 uppercase tracking-wider">${typeText}</p>
                <span class="text-[10px] text-slate-400">${date}</span>
              </div>
              <p class="text-sm text-slate-600 mt-1 leading-relaxed">${act.content}</p>
              <p class="text-[10px] text-slate-300 mt-2">Por: ${act.createdBy || 'Sistema'}</p>
            </div>
          </div>
        `;
    }

    bindFormEvents(clientId) {
        const form = document.getElementById(this.formId);
        if (form && !form.dataset.bound) {
            form.addEventListener('submit', (e) => this.handleSaveActivity(e, clientId));
            form.dataset.bound = 'true';
        }
    }

    async handleSaveActivity(e, clientId) {
        e.preventDefault();
        const btn = e.submitter;
        showButtonLoading(btn, true, 'Adicionando...');

        const type = document.getElementById('activityType').value;
        const content = document.getElementById('activityContent').value;

        try {
            await this.service.addActivity(clientId, type, content);
            document.getElementById('activityContent').value = '';
            showToast("Atividade registrada!", "success");
        } catch (err) {
            console.error(err);
            showToast("Erro ao registrar atividade.", "danger");
        } finally {
            showButtonLoading(btn, false, 'Adicionar');
        }
    }

    /**
     * Limpa o listener de tempo real
     */
    destroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
    }
}