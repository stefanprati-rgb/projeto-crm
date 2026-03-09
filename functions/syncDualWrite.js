const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
    admin.initializeApp();
}

/**
 * Função de Dual-Write: Observa mudanças no "clients" (MVP front-end) e
 * replica estruturadamente para as novas coleções relacionais: "clientes", "instalacoes" e "historico_rateios".
 */
exports.syncClientToRelationalModel = functions.firestore
    .document("clients/{clientId}")
    .onWrite(async (change, context) => {
        const clientId = context.params.clientId;
        const db = admin.firestore();

        // Se o documento legado foi deletado
        if (!change.after.exists) {
            console.log(`Cliente legado ${clientId} deletado (ou hard delete). Nenhuma ação tomada nas coleções V2.`);
            // Opcional: implementar mecanismo de soft/hard delete nas tabelas novas
            return null;
        }

        const legacyData = change.after.data();
        const databaseId = legacyData.database || "default";

        // 1. Dados normalizados para `clientes`
        const clienteRef = db.collection("clientes").doc(clientId);
        const clienteData = {
            database: databaseId,
            name: legacyData.name || "",
            document: legacyData.document || legacyData.cnpj || legacyData.cpf || "",
            contactInfo: {
                email: legacyData.email || "",
                phone: legacyData.phone || "",
            },
            status: legacyData.status || "active",
            createdBy: legacyData.createdBy || "system",
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        // Tratamento de createdAt para evitar sobrescrita em cada merge
        if (!change.before.exists) {
            clienteData.createdAt = legacyData.createdAt || admin.firestore.FieldValue.serverTimestamp();
        }

        // 2. Dados normalizados para `instalacoes` e `historico_rateios` (futuramente)
        const batch = db.batch();
        batch.set(clienteRef, clienteData, { merge: true });

        // Identifica se o cliente legado tem um array de instalações
        const legacyInstallations = legacyData.instalacoes || legacyData.installations || [];
        const logsInstalacoes = [];
        let primaryUc = legacyData.uc || "1";

        if (Array.isArray(legacyInstallations) && legacyInstallations.length > 0) {
            primaryUc = legacyInstallations[0].uc || primaryUc;
            // Caso 1: O cliente tem múltiplas instalações aninhadas
            legacyInstallations.forEach((inst, index) => {
                // Se a UC existir, usa como parte do ID para ser conciso e fácil de rastrear. Senão, usa index
                const instalacaoId = `${clientId}_inst_${inst.uc || index}`;
                const instalacaoRef = db.collection("instalacoes").doc(instalacaoId);

                const instalacaoData = {
                    clienteId: clientId,
                    database: databaseId,
                    uc: inst.uc || "",
                    distributor: inst.distributor || legacyData.distributor || "",
                    energyClass: inst.energyClass || inst.consumptionClass || legacyData.energyClass || legacyData.consumptionClass || "",
                    modalidadeTarifaria: inst.modalidadeTarifaria || inst.tariffModality || legacyData.modalidadeTarifaria || legacyData.tariffModality || "",
                    classeConsumo: inst.classeConsumo || inst.consumptionClass || legacyData.classeConsumo || legacyData.consumptionClass || "",
                    enderecoUC: inst.enderecoUC || inst.address?.street || legacyData.enderecoUC || legacyData.address?.street || "",
                    onboarding: inst.onboarding || legacyData.onboarding || {
                        pipelineStatus: "new",
                        compensationForecastDate: null
                    },
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                };

                if (!change.before.exists) {
                    instalacaoData.createdAt = inst.createdAt || legacyData.createdAt || admin.firestore.FieldValue.serverTimestamp();
                }

                batch.set(instalacaoRef, instalacaoData, { merge: true });
                logsInstalacoes.push(instalacaoId);
            });
        } else {
            // Caso 2: Falta de array de instações, usa o objeto raiz (Comportamento Original)
            const instalacaoId = `${clientId}_inst_${primaryUc}`;
            const instalacaoRef = db.collection("instalacoes").doc(instalacaoId);

            const instalacaoData = {
                clienteId: clientId,
                database: databaseId,
                uc: legacyData.uc || "",
                distributor: legacyData.distributor || "",
                energyClass: legacyData.energyClass || legacyData.consumptionClass || "",
                modalidadeTarifaria: legacyData.modalidadeTarifaria || legacyData.tariffModality || "",
                classeConsumo: legacyData.classeConsumo || legacyData.consumptionClass || "",
                enderecoUC: legacyData.enderecoUC || legacyData.address?.street || "",
                onboarding: legacyData.onboarding || {
                    pipelineStatus: "new",
                    compensationForecastDate: null
                },
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };

            if (!change.before.exists) {
                instalacaoData.createdAt = legacyData.createdAt || admin.firestore.FieldValue.serverTimestamp();
            }

            batch.set(instalacaoRef, instalacaoData, { merge: true });
            logsInstalacoes.push(instalacaoId);
        }

        // 3. Extração do Nó de Rateio para historico_rateios
        if (legacyData.rateio) {
            const rData = legacyData.rateio;
            let competencia = "00/0000";
            if (rData.dataUltimoEnvioBase) {
                try {
                    const d = new Date(rData.dataUltimoEnvioBase);
                    if (!isNaN(d.getTime())) {
                        competencia = `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
                    }
                } catch (e) {
                    console.error("Erro ignorado durante a extração/conversão de data no Dual-Write:", e);
                }
            }
            if (competencia === "00/0000") {
                const d = new Date();
                competencia = `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
            }

            const mapStatus = (str) => {
                if (!str) return 'pendente_correcao';
                const s = String(str).toLowerCase();
                if (s.includes("aprov")) return 'aprovado_aguardando_injecao';
                if (s.includes("reprov") || s.includes("recusa") || s.includes("rejeit")) return 'reprovado';
                if (s.includes("injet")) return 'injetado';
                if (s.includes("enviad")) return 'enviado_concessionaria';
                return 'pendente_correcao';
            };

            // Para evitar duplicações baseadas no mesmo log exato:
            // Usamos a primaryUc para vincular ao instalacaoId primário.
            const compSafe = competencia.replace(/\//g, "");
            const rateioLogId = `${clientId}_${primaryUc}_${compSafe}`;
            const rateioRef = db.collection("historico_rateios").doc(rateioLogId);

            const rateioLog = {
                instalacaoId: `${clientId}_inst_${primaryUc}`,
                clienteId: clientId,
                usinaId: rData.nomeUsinaAssociada || rData.usinaId || "Desconhecida",
                consorcio: rData.consorcio || "Padrão",
                database: databaseId,
                competencia: competencia,
                percentual: Number(rData.percentualAtual || 0),
                status: mapStatus(rData.statusBase),
                processedBy: legacyData.updatedBy || legacyData.createdBy || "System",
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            };

            batch.set(rateioRef, rateioLog, { merge: true });
            console.log(`[Dual-Write] Atualizado historico_rateios -> ID: ${rateioLogId}`);
        }

        await batch.commit();

        console.log(`[Dual-Write] Sucesso ao sincronizar legado para clientes/${clientId} e instalacoes: [${logsInstalacoes.join(", ")}]`);
        return null;
    });
