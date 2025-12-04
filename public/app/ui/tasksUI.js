// public/app/ui/tasksUI.js
import { showToast } from "./toast.js";
import { showButtonLoading } from "./loadingStates.js";

export class TasksUI {
    constructor(taskService) {
        this.service = taskService;
        this.unsubscribe = null;
        this.containerId = 'tasksList';
        this.formId = 'taskForm';

        // Expõe métodos para serem chamados via onclick do HTML (DrawerManager fará o bind)
        window.crmApp.toggleTask = this.toggleTask.bind(this);
        window.crmApp.deleteTask = this.deleteTask.bind(this);
    }

    /**
     * Inicia a escuta em tempo real para as tarefas de um cliente.
     * @param {string} clientId - ID do cliente
     */
    loadTasks(clientId) {
        this.destroy(); // Limpa escutas anteriores
        const container = document.getElementById(this.containerId);
        if (!container) return;
        container.innerHTML = '<div class="text-center py-8 text-slate-400 text-sm">Carregando tarefas...</div>';

        this.unsubscribe = this.service.listenToClientTasks(clientId, (tasks) => {
            if (tasks.length === 0) {
                container.innerHTML = '<div class="text-center py-8 text-slate-400 text-sm">Nenhuma tarefa pendente.</div>';
                return;
            }
            container.innerHTML = tasks.map(task => this.renderTask(task, clientId)).join('');
        });

        this.bindFormEvents(clientId);
    }

    renderTask(task, clientId) {
        const isDone = task.status === 'done';
        const opacityClass = isDone ? 'opacity-50' : '';
        const checkIcon = isDone ? 'fa-check-circle text-emerald-500' : 'fa-circle text-slate-300';
        const date = new Date(task.dueDate).toLocaleDateString();

        let priorityColor = 'bg-slate-100 text-slate-500';
        if (task.priority === 'high') priorityColor = 'bg-rose-50 text-rose-600';
        if (task.priority === 'medium') priorityColor = 'bg-amber-50 text-amber-600';

        // Chamadas usando window.crmApp (precisa do clientId para o service)
        return `
            <div class="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl shadow-sm fade-in group ${opacityClass}">
                <button class="shrink-0 text-lg hover:text-emerald-500 transition-colors" onclick="window.crmApp.toggleTask('${clientId}', '${task.id}', '${task.status}')">
                   <i class="far ${checkIcon}"></i>
                </button>
                <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-center mb-1">
                        <span class="text-xs font-bold ${priorityColor} px-2 py-0.5 rounded-full uppercase tracking-wide">${task.type || 'Geral'}</span>
                        <span class="text-[10px] text-slate-400 flex items-center gap-1"><i class="far fa-calendar"></i> ${date}</span>
                    </div>
                    <p class="text-sm font-medium text-slate-700 ${isDone ? 'line-through' : ''}">${task.title}</p>
                </div>
                <button class="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100" onclick="window.crmApp.deleteTask('${clientId}', '${task.id}')">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
    }

    bindFormEvents(clientId) {
        const form = document.getElementById(this.formId);
        if (form && !form.dataset.bound) {
            form.addEventListener('submit', (e) => this.handleSaveTask(e, clientId));
            form.dataset.bound = 'true';
        }
    }

    async handleSaveTask(e, clientId) {
        e.preventDefault();
        const btn = e.submitter;
        showButtonLoading(btn, true, 'Criando...');

        const taskData = {
            title: document.getElementById('taskTitle').value,
            type: document.getElementById('taskType').value,
            dueDate: document.getElementById('taskDueDate').value,
            priority: document.getElementById('taskPriority').value
        };

        try {
            await this.service.addTask(clientId, taskData);
            document.getElementById('taskForm').reset();
            showToast("Tarefa criada!", "success");
        } catch (err) {
            console.error(err);
            showToast("Erro ao criar tarefa.", "danger");
        } finally {
            showButtonLoading(btn, false, 'Criar Tarefa');
        }
    }

    // --- MÉTODOS EXPOSTOS (BINDADOS VIA WINDOW.CRMAP) ---
    async toggleTask(clientId, taskId, currentStatus) {
        try {
            await this.service.toggleStatus(clientId, taskId, currentStatus);
            showToast(currentStatus === 'done' ? "Tarefa reaberta." : "Tarefa concluída!", "success");
        } catch (e) {
            console.error(e);
            showToast("Erro ao alterar status.", "danger");
        }
    }

    async deleteTask(clientId, taskId) {
        if (!confirm("Apagar tarefa?")) return;
        try {
            await this.service.deleteTask(clientId, taskId);
            showToast("Tarefa apagada.", "success");
        } catch (e) {
            console.error(e);
            showToast("Erro ao apagar.", "danger");
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