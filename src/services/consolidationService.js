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
     * Processa a importação da Base de Clientes (Cadastral)
     */
    async processClientBase(items, database) {
        return this._runConsolidation(items, database, 'clients', (existing, item) => {
            const onboarding = existing?.onboarding || {};

            // Regra: Se tem usina vinculada, vai para rateio
            const hasPowerPlant = !!(item.usina || item.usina_vinculada);

            const updatedOnboarding = {
                ...onboarding,
                sentToApportionment: onboarding.sentToApportionment || hasPowerPlant,
                updatedAt: new Date().toISOString(),
                updatedBy: 'system_import'
            };

            updatedOnboarding.pipelineStatus = this.calculatePipelineStatus(updatedOnboarding);

            return {
                name: item.name || item.cliente || existing?.name,
                cpfCnpj: item.cpfCnpj || item.cnpj || existing?.cpfCnpj,
                uc_normalized: normalization.normalizeUC(item.uc),
                uc: item.uc,
                database,
                onboarding: updatedOnboarding,
                updatedAt: new Date().toISOString()
            };
        });
    },

    /**
     * Processa a planilha de Rateio (Operacional)
     */
    async processApportionment(items, database) {
        return this._runConsolidation(items, database, 'apportionment', (existing, item) => {
            if (!existing) return null; // Não cria cliente via planilha de rateio

            const onboarding = existing.onboarding || {};
            const rateio = parseFloat(item.rateio || item.percentual || 0);

            const updatedOnboarding = {
                ...onboarding,
                sentToApportionment: true,
                apportionmentRegistered: rateio > 0,
                apportionmentRegisteredAt: rateio > 0 ? (onboarding.apportionmentRegisteredAt || new Date().toISOString()) : onboarding.apportionmentRegisteredAt,
                compensationForecastDate: normalization.normalizeDate(item.previsao || item.mes_referencia) || onboarding.compensationForecastDate,
                updatedAt: new Date().toISOString(),
                updatedBy: 'system_import'
            };

            updatedOnboarding.pipelineStatus = this.calculatePipelineStatus(updatedOnboarding);

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

            const onboarding = existing.onboarding || {};
            const invoiceDate = normalization.normalizeDate(item.data_emissao || item.emissao);

            const updatedOnboarding = {
                ...onboarding,
                hasBeenInvoiced: true,
                firstInvoiceAt: onboarding.firstInvoiceAt
                    ? (invoiceDate && invoiceDate < onboarding.firstInvoiceAt ? invoiceDate : onboarding.firstInvoiceAt)
                    : invoiceDate,
                updatedAt: new Date().toISOString(),
                updatedBy: 'system_import'
            };

            updatedOnboarding.pipelineStatus = this.calculatePipelineStatus(updatedOnboarding);

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
