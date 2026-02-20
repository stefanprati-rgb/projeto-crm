import { collection, query, where, getDocs, writeBatch, doc, serverTimestamp, addDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import { normalization } from '../utils/normalization';

/**
 * Serviço de Consolidação de Dados de Onboarding
 */
export const consolidationService = {

    /**
     * Calcula o status do pipeline baseado no estado do onboarding
     */
    calculatePipelineStatus(onboarding) {
        if (onboarding.hasBeenInvoiced) return "invoiced";
        if (onboarding.compensationForecastDate) return "waiting_compensation";
        if (onboarding.apportionmentRegistered) return "apportionment_done";
        if (onboarding.sentToApportionment) return "sent_to_apportionment";
        return "waiting_apportionment";
    },

    /**
     * Aplica atualizações no onboarding com regras de governança (Idempotência e Histórico)
     * @private
     */
    _applyGovernance(existing, newData, source = 'import') {
        const onboarding = existing?.onboarding || {};

        // 1. Manual Override: Se true, não permite sobrescrita automática
        if (onboarding.manualOverride && source === 'import') {
            return null;
        }

        const updatedOnboarding = { ...onboarding, ...newData };

        // Recalcular status sempre que houver mudança nos campos base
        updatedOnboarding.pipelineStatus = this.calculatePipelineStatus(updatedOnboarding);

        // 2. Idempotência e Histórico
        const history = [...(onboarding.history || [])];
        let hasChanges = false;

        // Campos críticos para monitoramento de histórico
        const trackedFields = [
            'pipelineStatus',
            'sentToApportionment',
            'apportionmentRegistered',
            'hasBeenInvoiced',
            'compensationForecastDate'
        ];

        trackedFields.forEach(field => {
            const oldValue = onboarding[field];
            const newValue = updatedOnboarding[field];

            // Comparação simples para tipos primitivos e datas
            if (oldValue !== newValue) {
                history.push({
                    field,
                    oldValue: oldValue === undefined ? null : oldValue,
                    newValue: newValue === undefined ? null : newValue,
                    updatedBy: source === 'import' ? 'system_import' : (auth.currentUser?.email || 'user'),
                    updatedAt: new Date().toISOString(),
                    source
                });
                hasChanges = true;
            }
        });

        // Se não houve mudanças reais nos dados monitorados e o cliente já existe, retornamos null (Idempotência)
        if (!hasChanges && existing) {
            return null;
        }

        return {
            ...updatedOnboarding,
            history: history.slice(-50), // Mantém apenas as últimas 50 entradas para performance
            updatedAt: new Date().toISOString(),
            updatedBy: source === 'import' ? 'system_import' : 'user'
        };
    },

    /**
     * Processa a importação da Base de Clientes (Cadastral)
     */
    async processClientBase(items, database) {
        return this._runConsolidation(items, database, 'clients', (existing, item) => {
            // Regra: Se tem usina vinculada, vai para rateio
            const hasPowerPlant = !!(item.usina || item.usina_vinculada);

            const updatedOnboarding = this._applyGovernance(existing, {
                sentToApportionment: (existing?.onboarding?.sentToApportionment) || hasPowerPlant,
            });

            if (!updatedOnboarding && existing) return null;

            return {
                name: item.name || item.cliente || existing?.name,
                cpfCnpj: item.cpfCnpj || item.cnpj || existing?.cpfCnpj,
                uc_normalized: normalization.normalizeUC(item.uc),
                uc: item.uc,
                database,
                onboarding: updatedOnboarding || existing?.onboarding,
                updatedAt: new Date().toISOString()
            };
        });
    },

    /**
     * Processa a planilha de Rateio (Operacional)
     */
    async processApportionment(items, database) {
        return this._runConsolidation(items, database, 'apportionment', (existing, item) => {
            if (!existing) return null;

            const rateio = parseFloat(item.rateio || item.percentual || 0);
            const isRegistered = rateio > 0;

            const updatedOnboarding = this._applyGovernance(existing, {
                sentToApportionment: true,
                apportionmentRegistered: isRegistered,
                apportionmentRegisteredAt: isRegistered
                    ? (existing.onboarding?.apportionmentRegisteredAt || new Date().toISOString())
                    : (existing.onboarding?.apportionmentRegisteredAt || null),
                compensationForecastDate: normalization.normalizeDate(item.previsao || item.mes_referencia) || existing.onboarding?.compensationForecastDate || null,
            });

            if (!updatedOnboarding) return null;

            return {
                onboarding: updatedOnboarding,
                updatedAt: new Date().toISOString()
            };
        });
    },

    /**
     * Processa a planilha de Faturamento (Financeira)
     */
    async processInvoicing(items, database) {
        return this._runConsolidation(items, database, 'invoicing', (existing, item) => {
            if (!existing) return null;

            const invoiceDate = normalization.normalizeDate(item.data_emissao || item.emissao);
            const currentFirstInvoiceAt = existing.onboarding?.firstInvoiceAt;

            const updatedOnboarding = this._applyGovernance(existing, {
                hasBeenInvoiced: true,
                firstInvoiceAt: currentFirstInvoiceAt
                    ? (invoiceDate && invoiceDate < currentFirstInvoiceAt ? invoiceDate : currentFirstInvoiceAt)
                    : invoiceDate
            });

            if (!updatedOnboarding) return null;

            return {
                onboarding: updatedOnboarding,
                updatedAt: new Date().toISOString()
            };
        });
    },

    /**
     * Motor genérico de consolidação
     * @private
     */
    async _runConsolidation(items, database, sourceType, mapper) {
        const stats = { total: items.length, updated: 0, created: 0, errors: [] };
        const user = auth.currentUser;

        // 1. Buscar todos os clientes do tenant para match em memória (otimização)
        const q = query(collection(db, 'clients'), where('database', '==', database));
        const snapshot = await getDocs(q);
        const clientsMap = new Map();
        snapshot.docs.forEach(d => {
            const data = d.data();
            const ucKey = data.uc_normalized || normalization.normalizeUC(data.uc);
            clientsMap.set(ucKey, { id: d.id, ...data });
        });

        // 2. Processar em lotes (500 é o limite do Firestore batch)
        const batchSize = 400;
        for (let i = 0; i < items.length; i += batchSize) {
            const chunk = items.slice(i, i + batchSize);
            const batch = writeBatch(db);
            let batchHasOperations = false;

            chunk.forEach(item => {
                const uc = item.uc;
                if (!uc) {
                    stats.errors.push({ uc: 'MISSING', reason: 'UC não informada na linha' });
                    return;
                }

                const ucKey = normalization.normalizeUC(uc);
                const existing = clientsMap.get(ucKey);

                const updateData = mapper(existing, item);

                if (updateData) {
                    if (existing) {
                        const ref = doc(db, 'clients', existing.id);
                        batch.update(ref, updateData);
                        stats.updated++;
                        batchHasOperations = true;
                    } else if (sourceType === 'clients') {
                        const ref = doc(collection(db, 'clients'));
                        batch.set(ref, { ...updateData, createdAt: new Date().toISOString() });
                        stats.created++;
                        batchHasOperations = true;
                    } else {
                        stats.errors.push({ uc, reason: 'UC não encontrada no cadastro' });
                    }
                }
            });

            if (batchHasOperations) {
                await batch.commit();
            }
        }

        // 3. Registrar Log de Importação
        await addDoc(collection(db, 'import_logs'), {
            sourceType,
            database,
            stats,
            executedBy: user?.email || 'system',
            timestamp: serverTimestamp()
        });

        return stats;
    }
};
