import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    collectionGroup,
    writeBatch,
    where,
    limit,
    startAfter,
    getDocs,
    getDoc,
} from 'firebase/firestore';
import { db, auth } from './firebase';

/**
 * Serviço de Tickets - Adaptado do código original
 * Tickets ficam em: clients/{clientId}/tickets
 */
export const ticketService = {
    /**
     * Formata prioridade para exibição
     */
    formatPriority(priority) {
        const formats = {
            high: { text: 'Alta', variant: 'danger', color: 'red' },
            medium: { text: 'Média', variant: 'warning', color: 'yellow' },
            low: { text: 'Baixa', variant: 'info', color: 'gray' },
        };
        return formats[priority] || formats.low;
    },

    /**
     * Formata status para exibição
     */
    formatStatus(status) {
        const formats = {
            open: { text: 'Aberto', variant: 'info', color: 'blue' },
            in_progress: { text: 'Em Andamento', variant: 'warning', color: 'yellow' },
            waiting_client: { text: 'Pendente Cliente', variant: 'warning', color: 'orange' },
            waiting_parts: { text: 'Aguardando Peças', variant: 'warning', color: 'orange' },
            scheduled: { text: 'Visita Agendada', variant: 'info', color: 'purple' },
            monitoring: { text: 'Em Monitoramento', variant: 'info', color: 'indigo' },
            resolved: { text: 'Resolvido', variant: 'success', color: 'green' },
            closed: { text: 'Fechado', variant: 'default', color: 'gray' },
        };
        return formats[status] || formats.open;
    },

    /**
     * Configuração de SLA por prioridade
     * businessHours: true = conta apenas horas comerciais (8h-18h, Seg-Sex)
     */
    SLA_CONFIG: {
        high: { hours: 4, businessHours: true },
        medium: { hours: 24, businessHours: true },
        low: { hours: 72, businessHours: false },
    },

    /**
     * Categorias que forçam prioridade alta automaticamente
     */
    HIGH_PRIORITY_CATEGORIES: ['parada_total'],

    /**
     * Verifica se uma categoria deve forçar prioridade alta
     */
    shouldForceHighPriority(category) {
        return this.HIGH_PRIORITY_CATEGORIES.includes(category);
    },

    /**
     * Calcula data de vencimento baseada na prioridade e configuração de SLA
     * @param {string} priority - Prioridade do ticket (high, medium, low)
     * @param {string} category - Categoria do ticket (opcional, para forçar prioridade)
     * @returns {string} Data de vencimento em ISO string
     */
    calculateDueDate(priority, category = null) {
        // Força prioridade alta para categorias críticas
        const effectivePriority = (category && this.shouldForceHighPriority(category))
            ? 'high'
            : priority;

        const config = this.SLA_CONFIG[effectivePriority] || this.SLA_CONFIG.medium;
        const now = new Date();

        if (config.businessHours) {
            return this.addBusinessHours(now, config.hours);
        } else {
            const date = new Date(now);
            date.setHours(date.getHours() + config.hours);
            return date.toISOString();
        }
    },

    /**
     * Adiciona horas comerciais a uma data
     * Horário comercial: 8h às 18h, Segunda a Sexta
     * @param {Date} startDate - Data inicial
     * @param {number} hoursToAdd - Horas comerciais a adicionar
     * @returns {string} Data resultante em ISO string
     */
    addBusinessHours(startDate, hoursToAdd) {
        const BUSINESS_START = 8;  // 8:00
        const BUSINESS_END = 18;   // 18:00
        const BUSINESS_HOURS_PER_DAY = BUSINESS_END - BUSINESS_START; // 10 horas

        let date = new Date(startDate);
        let remainingHours = hoursToAdd;

        // Se começar fora do horário comercial, avança para próximo horário comercial
        date = this.moveToNextBusinessHour(date, BUSINESS_START, BUSINESS_END);

        while (remainingHours > 0) {
            const currentHour = date.getHours();
            const hoursLeftToday = BUSINESS_END - currentHour;

            if (remainingHours <= hoursLeftToday) {
                // Consegue completar no mesmo dia
                date.setHours(date.getHours() + remainingHours);
                remainingHours = 0;
            } else {
                // Avança para o próximo dia útil
                remainingHours -= hoursLeftToday;
                date.setDate(date.getDate() + 1);
                date.setHours(BUSINESS_START, 0, 0, 0);
                date = this.moveToNextBusinessHour(date, BUSINESS_START, BUSINESS_END);
            }
        }

        return date.toISOString();
    },

    /**
     * Move uma data para o próximo horário comercial válido
     */
    moveToNextBusinessHour(date, businessStart, businessEnd) {
        const result = new Date(date);

        // Pula fins de semana
        while (result.getDay() === 0 || result.getDay() === 6) {
            result.setDate(result.getDate() + 1);
            result.setHours(businessStart, 0, 0, 0);
        }

        // Se antes do horário comercial, ajusta para início
        if (result.getHours() < businessStart) {
            result.setHours(businessStart, 0, 0, 0);
        }

        // Se depois do horário comercial, vai para próximo dia útil
        if (result.getHours() >= businessEnd) {
            result.setDate(result.getDate() + 1);
            result.setHours(businessStart, 0, 0, 0);
            // Verifica novamente fins de semana
            while (result.getDay() === 0 || result.getDay() === 6) {
                result.setDate(result.getDate() + 1);
            }
        }

        return result;
    },

    /**
     * Gera protocolo único para o ticket
     */
    generateProtocol() {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 10000);
        return `T-${year}${month}-${random}`;
    },

    /**
     * Cria um novo ticket
     */
    async create(clientId, ticketData) {
        if (!clientId) throw new Error('Client ID obrigatório');

        const user = auth.currentUser;
        const path = `clients/${clientId}/tickets`;

        const ticket = {
            protocol: this.generateProtocol(),
            subject: ticketData.subject,
            description: ticketData.description || '',
            category: ticketData.category || 'outros',
            priority: this.shouldForceHighPriority(ticketData.category) ? 'high' : (ticketData.priority || 'medium'),
            status: 'open',

            // SLA - considera categoria para forçar prioridade
            dueDate: ticketData.dueDate || this.calculateDueDate(ticketData.priority || 'medium', ticketData.category),
            overdue: false,

            // Responsável (técnico atribuído)
            responsibleId: ticketData.responsibleId || null,
            responsibleName: ticketData.responsibleName || null,

            // Metadata
            openedBy: user?.uid || null,
            openedByEmail: user?.email || 'Sistema',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            timestamp: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, path), ticket);
        const ticketId = docRef.id;

        // Adiciona evento inicial na timeline
        await this.addTimelineItem(clientId, ticketId, {
            type: 'ticket_created',
            message: `Ticket criado por ${user?.email || 'Sistema'}`,
            authorId: user?.uid || null,
            authorName: user?.email || 'Sistema',
        });

        return { id: ticketId, clientId, ...ticket };
    },

    /**
     * Atualiza um ticket
     */
    async update(clientId, ticketId, updates) {
        const path = `clients/${clientId}/tickets`;
        const ref = doc(db, path, ticketId);

        const updateData = {
            ...updates,
            updatedAt: new Date().toISOString(),
        };

        // Se mudou para resolvido/fechado, marca data de resolução
        if (updates.status && ['resolved', 'closed'].includes(updates.status)) {
            updateData.resolvedAt = new Date().toISOString();
        }

        await updateDoc(ref, updateData);
        return { id: ticketId, clientId, ...updateData };
    },

    /**
     * Atualiza apenas o status e registra na timeline
     */
    async updateStatus(clientId, ticketId, newStatus) {
        const user = auth.currentUser;
        const path = `clients/${clientId}/tickets`;
        const ref = doc(db, path, ticketId);

        // Busca status atual para registrar na timeline
        const ticketDoc = await getDoc(ref);
        const oldStatus = ticketDoc.exists() ? ticketDoc.data().status : 'unknown';

        // Atualiza o ticket
        await this.update(clientId, ticketId, { status: newStatus });

        // Registra mudança na timeline
        await this.addTimelineItem(clientId, ticketId, {
            type: 'status_change',
            oldStatus,
            newStatus,
            message: `Status alterado de "${this.formatStatus(oldStatus).text}" para "${this.formatStatus(newStatus).text}"`,
            authorId: user?.uid || null,
            authorName: user?.email || 'Sistema',
        });

        return { id: ticketId, clientId, status: newStatus };
    },

    /**
     * Deleta um ticket
     */
    async delete(clientId, ticketId) {
        const path = `clients/${clientId}/tickets`;
        const ref = doc(db, path, ticketId);
        await deleteDoc(ref);
    },

    /**
     * Busca todos os tickets (usando collectionGroup)
     */
    async getAll(options = {}) {
        const { pageSize = 50, lastDoc = null, status = null } = options;

        let q = query(
            collectionGroup(db, 'tickets'),
            orderBy('createdAt', 'desc'),
            limit(pageSize)
        );

        if (status) {
            q = query(q, where('status', '==', status));
        }

        if (lastDoc) {
            q = query(q, startAfter(lastDoc));
        }

        const snapshot = await getDocs(q);
        const tickets = snapshot.docs.map((doc) => ({
            id: doc.id,
            clientId: doc.ref.parent.parent.id,
            ...doc.data(),
        }));

        return {
            tickets,
            lastDoc: snapshot.docs[snapshot.docs.length - 1],
            hasMore: snapshot.docs.length === pageSize,
        };
    },

    /**
     * Busca tickets de um cliente específico
     */
    async getByClient(clientId, options = {}) {
        const { pageSize = 50, lastDoc = null } = options;

        const path = `clients/${clientId}/tickets`;
        let q = query(
            collection(db, path),
            orderBy('createdAt', 'desc'),
            limit(pageSize)
        );

        if (lastDoc) {
            q = query(q, startAfter(lastDoc));
        }

        const snapshot = await getDocs(q);
        const tickets = snapshot.docs.map((doc) => ({
            id: doc.id,
            clientId,
            ...doc.data(),
        }));

        return {
            tickets,
            lastDoc: snapshot.docs[snapshot.docs.length - 1],
            hasMore: snapshot.docs.length === pageSize,
        };
    },

    /**
     * Listener em tempo real para todos os tickets
     */
    listen(onData, onError) {
        const q = query(collectionGroup(db, 'tickets'), orderBy('createdAt', 'desc'));

        return onSnapshot(
            q,
            (snapshot) => {
                const tickets = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    clientId: doc.ref.parent.parent.id,
                    ...doc.data(),
                }));
                onData(tickets);
            },
            onError
        );
    },

    /**
     * Listener para tickets de um cliente específico
     */
    listenToClient(clientId, onData, onError) {
        if (!clientId) return null;

        const path = `clients/${clientId}/tickets`;
        const q = query(collection(db, path), orderBy('createdAt', 'desc'));

        return onSnapshot(
            q,
            (snapshot) => {
                const tickets = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    clientId,
                    ...doc.data(),
                }));
                onData(tickets);
            },
            onError
        );
    },

    /**
     * Verifica e atualiza tickets vencidos (SLA Enforcer)
     */
    async checkSLAEnforcement(tickets) {
        const now = new Date();
        const batch = writeBatch(db);
        let updatesCount = 0;

        tickets.forEach((t) => {
            // Ignora tickets já fechados ou já marcados como vencidos
            if (['resolved', 'closed'].includes(t.status)) return;
            if (!t.dueDate) return;

            const dueDate = new Date(t.dueDate);
            const isOverdue = now > dueDate;

            // Se detectou vencimento que ainda não está marcado
            if (isOverdue && !t.overdue) {
                const ref = doc(db, `clients/${t.clientId}/tickets`, t.id);
                batch.update(ref, { overdue: true });
                updatesCount++;
            }
        });

        if (updatesCount > 0) {
            console.log(`[SLA Enforcer] Atualizando ${updatesCount} tickets vencidos.`);
            await batch.commit();
        }

        return updatesCount;
    },

    /**
     * Calcula métricas dos tickets
     */
    getMetrics(tickets) {
        const total = tickets.length;
        if (total === 0) {
            return {
                total: 0,
                open: 0,
                overdue: 0,
                resolved: 0,
                avgResolutionHours: 0,
                complianceRate: 100,
            };
        }

        const open = tickets.filter((t) => ['open', 'in_progress'].includes(t.status)).length;
        const overdue = tickets.filter((t) => t.overdue && ['open', 'in_progress'].includes(t.status)).length;
        const resolved = tickets.filter((t) => ['resolved', 'closed'].includes(t.status)).length;

        // Tempo médio de resolução
        let totalTime = 0;
        let resolvedCount = 0;

        tickets.forEach((t) => {
            if (t.resolvedAt && t.createdAt) {
                const start = new Date(t.createdAt);
                const end = new Date(t.resolvedAt);
                totalTime += end - start;
                resolvedCount++;
            }
        });

        const avgResolutionHours = resolvedCount > 0 ? Math.round(totalTime / resolvedCount / (1000 * 60 * 60)) : 0;

        // Taxa de conformidade SLA
        const slaBreachedTotal = tickets.filter((t) => t.overdue).length;
        const complianceRate = Math.round(((total - slaBreachedTotal) / total) * 100);

        return {
            total,
            open,
            overdue,
            resolved,
            avgResolutionHours,
            complianceRate,
        };
    },

    // ========================================
    // TIMELINE & COMENTÁRIOS
    // ========================================

    /**
     * Adiciona um item à timeline do ticket (comentário ou log de sistema)
     * @param {string} clientId - ID do cliente
     * @param {string} ticketId - ID do ticket
     * @param {object} item - Item a ser adicionado
     * @param {string} item.type - Tipo: 'comment', 'status_change', 'ticket_created', 'assignment_change'
     * @param {string} item.message - Mensagem ou conteúdo
     * @param {string} item.authorId - UID do autor
     * @param {string} item.authorName - Nome/email do autor
     */
    async addTimelineItem(clientId, ticketId, item) {
        if (!clientId || !ticketId) throw new Error('Client ID e Ticket ID são obrigatórios');

        const path = `clients/${clientId}/tickets/${ticketId}/timeline`;

        const timelineItem = {
            type: item.type || 'comment',
            message: item.message || '',
            authorId: item.authorId || null,
            authorName: item.authorName || 'Sistema',
            createdAt: new Date().toISOString(),
            timestamp: serverTimestamp(),
            // Campos extras para logs de mudança
            ...(item.oldStatus && { oldStatus: item.oldStatus }),
            ...(item.newStatus && { newStatus: item.newStatus }),
            ...(item.oldResponsible && { oldResponsible: item.oldResponsible }),
            ...(item.newResponsible && { newResponsible: item.newResponsible }),
        };

        const docRef = await addDoc(collection(db, path), timelineItem);
        return { id: docRef.id, ...timelineItem };
    },

    /**
     * Adiciona um comentário à timeline (atalho para addTimelineItem)
     * @param {string} clientId - ID do cliente
     * @param {string} ticketId - ID do ticket
     * @param {string} message - Mensagem do comentário
     * @param {string} authorId - UID do autor
     * @param {string} authorName - Nome/email do autor
     */
    async addComment(clientId, ticketId, message, authorId, authorName) {
        return this.addTimelineItem(clientId, ticketId, {
            type: 'comment',
            message,
            authorId,
            authorName,
        });
    },

    /**
     * Busca a timeline do ticket em tempo real
     * @param {string} clientId - ID do cliente
     * @param {string} ticketId - ID do ticket
     * @param {function} onData - Callback com os dados
     * @param {function} onError - Callback de erro
     * @returns {function} Unsubscribe function
     */
    getTicketTimeline(clientId, ticketId, onData, onError) {
        if (!clientId || !ticketId) return null;

        const path = `clients/${clientId}/tickets/${ticketId}/timeline`;
        const q = query(collection(db, path), orderBy('createdAt', 'asc'));

        return onSnapshot(
            q,
            (snapshot) => {
                const timeline = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                onData(timeline);
            },
            onError
        );
    },

    /**
     * Atribui ou altera o responsável do ticket
     * @param {string} clientId - ID do cliente
     * @param {string} ticketId - ID do ticket
     * @param {string} responsibleId - UID do novo responsável
     * @param {string} responsibleName - Nome/email do novo responsável
     */
    async assignResponsible(clientId, ticketId, responsibleId, responsibleName) {
        const user = auth.currentUser;
        const path = `clients/${clientId}/tickets`;
        const ref = doc(db, path, ticketId);

        // Busca responsável atual para registrar na timeline
        const ticketDoc = await getDoc(ref);
        const currentData = ticketDoc.exists() ? ticketDoc.data() : {};
        const oldResponsibleName = currentData.responsibleName || 'Não atribuído';

        // Atualiza o ticket
        await this.update(clientId, ticketId, {
            responsibleId,
            responsibleName
        });

        // Registra mudança na timeline
        await this.addTimelineItem(clientId, ticketId, {
            type: 'assignment_change',
            oldResponsible: oldResponsibleName,
            newResponsible: responsibleName || 'Não atribuído',
            message: `Responsável alterado de "${oldResponsibleName}" para "${responsibleName || 'Não atribuído'}"`,
            authorId: user?.uid || null,
            authorName: user?.email || 'Sistema',
        });

        return { id: ticketId, clientId, responsibleId, responsibleName };
    },
};
