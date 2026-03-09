const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const CryptoJS = require("crypto-js");

// Em produção, deve ser configurado via firebase functions:config:set encryption.key="sua_chave"
// Ou usando o Google Cloud Secret Manager.
const SECRET_KEY = process.env.ENCRYPTION_KEY || "chave_secreta_padrao_gd_crm";

/**
 * processRaizenImport
 * Processa um lote de registros da planilha Raízen no Backend.
 * Vantagens:
 * 1. Segurança: A chave de criptografia nunca sai do servidor.
 * 2. Performance: Operações de batch no Admin SDK são mais rápidas.
 * 3. Atomicidade: Garante que ou a UC e o Cliente são criados juntos ou nada.
 */
exports.processRaizenImport = functions.https.onCall(async (data, context) => {
    // 1. Verificação de Autenticação e Permissão
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Acesso negado.");
    }

    const { records, baseName = "Raízen" } = data;
    if (!Array.isArray(records)) {
        throw new functions.https.HttpsError("invalid-argument", "Records deve ser um array.");
    }

    const db = admin.firestore();
    const results = {
        total: records.length,
        success: 0,
        created: 0,
        updated: 0,
        errors: []
    };

    // Processar em chunks para não estourar tempo/memória se o array for gigante
    // No entanto, como o front envia o payload, assumimos que o lote é razoável (ex: 100-500)

    for (const record of records) {
        try {
            const batch = db.batch();

            // Sanitização e Preparação (Movido do Front para o Back)
            const cleanCpfCnpj = record.cpfCnpj ? String(record.cpfCnpj).replace(/\D/g, "") : null;
            const senhaOfuscada = record.portalSenha
                ? CryptoJS.AES.encrypt(String(record.portalSenha), SECRET_KEY).toString()
                : null;

            // 1. Localizar Cliente Existente (Admin SDK)
            let clientRef = null;
            let existingClient = null;

            if (record.idContaAcc) {
                const snap = await db.collection("clients").where("idContaAcc", "==", record.idContaAcc).limit(1).get();
                if (!snap.empty) {
                    existingClient = snap.docs[0].data();
                    clientRef = snap.docs[0].ref;
                }
            }

            if (!existingClient && cleanCpfCnpj) {
                const snap = await db.collection("clients").where("cpfCnpj", "==", cleanCpfCnpj).limit(1).get();
                if (!snap.empty) {
                    existingClient = snap.docs[0].data();
                    clientRef = snap.docs[0].ref;
                }
            }

            if (!clientRef) {
                clientRef = db.collection("clients").doc();
            }

            const clientData = {
                idContaAcc: record.idContaAcc || null,
                idUcNegociada: record.idUcNegociada || null,
                name: record.nome || "Sem Nome",
                document: cleanCpfCnpj, // Mudando para a nova convenção de campo 'document'
                cpfCnpj: cleanCpfCnpj, // Mantendo legacia
                email: record.email || null,
                phone: record.telefone || null,
                address: record.endereco || null,
                database: baseName,
                status: "active",
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                portal: {
                    status: (record.portalLogin || record.portalSenha) ? "CADASTRADO" : "PENDENTE",
                    login: record.portalLogin || null,
                    senhaOfuscada: senhaOfuscada,
                }
            };

            if (!existingClient) {
                clientData.createdAt = admin.firestore.FieldValue.serverTimestamp();
                clientData.createdBy = context.auth.uid;
                results.created++;
            } else {
                results.updated++;
                // Preservar senha se não enviada
                if (!record.portalSenha && existingClient.portal?.senhaOfuscada) {
                    clientData.portal.senhaOfuscada = existingClient.portal.senhaOfuscada;
                    clientData.portal.status = existingClient.portal.status;
                }
            }

            // Inserir UC na legacia
            if (record.uc) {
                clientData.uc = String(record.uc).trim();
                clientData.instalacoes = [{
                    uc: clientData.uc,
                    distribuidora: record.distribuidora || null,
                    statusOnboarding: "new"
                }];
            }

            batch.set(clientRef, clientData, { merge: true });

            // Nota: O Dual-Write (syncClientToRelationalModel) vai disparar 
            // AUTOMATICAMENTE e criar os registros nas tabelas V2 (clientes e instalacoes).

            await batch.commit();
            results.success++;

        } catch (err) {
            results.errors.push({ nome: record.nome, error: err.message });
        }
    }

    return results;
});

/**
 * processRateioImport
 * Atualiza registros de rateio baseado na UC com Estratégia "Lean".
 * Deduplica registros para que apenas o mais recente de cada UC seja processado no estado atual.
 */
exports.processRateioImport = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Acesso negado.");
    }

    const { records } = data;
    if (!records || !Array.isArray(records)) {
        throw new functions.https.HttpsError("invalid-argument", "Records deve ser um array.");
    }

    const db = admin.firestore();
    const results = {
        total: records.length,
        totalProcessado: 0,
        success: 0,
        updated: 0,
        notFound: 0,
        errors: []
    };

    // Helper para mapeamento de status de rateio para pipelineStatus
    const mapStatus = (str) => {
        if (!str) return 'pendente_correcao';
        const s = String(str).toLowerCase();
        if (s.includes("aprov")) return 'aprovado_aguardando_injecao';
        if (s.includes("reprov") || s.includes("recusa") || s.includes("rejeit")) return 'reprovado';
        if (s.includes("injet")) return 'injetado';
        if (s.includes("enviad")) return 'enviado_concessionaria';
        return 'pendente_correcao';
    };

    // Helper para Competência (MM/YYYY)
    const getCompetencia = (date) => {
        if (!date) return null;
        let d = date;
        if (!(d instanceof Date)) d = new Date(date);
        if (isNaN(d.getTime())) return null;
        return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    };

    // --- PASSO 1: Pré-Processamento / Deduplicação (Estratégia LEAN) ---
    const ucGroups = {};
    records.forEach(r => {
        const numUc = (r.instalacaoPadraoAneel && String(r.instalacaoPadraoAneel).trim()) ||
            (r.uc && String(r.uc).trim()) || null;
        if (!numUc) return;

        if (!ucGroups[numUc]) {
            ucGroups[numUc] = [];
        }
        ucGroups[numUc].push(r);
    });

    const leanRecords = Object.keys(ucGroups).map(uc => {
        const group = ucGroups[uc];
        // Ordenar decrescente pela Data de envio para pegar o mais recente
        group.sort((a, b) => {
            const dateA = a.dataEnvio ? new Date(a.dataEnvio).getTime() : 0;
            const dateB = b.dataEnvio ? new Date(b.dataEnvio).getTime() : 0;
            return dateB - dateA;
        });
        return { uc, record: group[0] };
    });

    results.totalProcessado = leanRecords.length;

    // --- PASSO 2: Atualização de Coleções (Legado e V2) ---
    for (const item of leanRecords) {
        const { uc, record } = item;
        try {
            // 1. Localizar o Cliente vinculado a esta UC
            let clientDoc = null;
            const queries = [
                db.collection("clients").where("instalacoes", "array-contains", { uc: uc }).limit(1),
                db.collection("clients").where("installations", "array-contains", uc).limit(1),
                db.collection("clients").where("installationId", "==", uc).limit(1)
            ];

            for (const q of queries) {
                const snap = await q.get();
                if (!snap.empty) {
                    clientDoc = snap.docs[0];
                    break;
                }
            }

            if (!clientDoc) {
                results.notFound++;
                continue;
            }

            const clientId = clientDoc.id;
            const clientData = clientDoc.data();
            const databaseId = clientData.database || "Raízen";
            const mappedStatus = mapStatus(record.status);
            const competencia = getCompetencia(record.dataEnvio) || getCompetencia(new Date());

            const batch = db.batch();

            // A. Atualizar Base Legada (clients)
            const legacyUpdate = {
                rateio: {
                    statusBase: record.status || null,
                    percentualAtual: record.percentualRateio || 0,
                    nomeUsinaAssociada: record.nomeUsina || null,
                    motivoRecusa: record.motivoRecusa || null,
                    dataUltimoEnvioBase: record.dataEnvio || null,
                    estimativaCompensacao: record.estimativaCompensacao || null,
                    ultimaAtualizacaoRateio: admin.firestore.FieldValue.serverTimestamp()
                }
            };
            batch.update(clientDoc.ref, legacyUpdate);

            // B. Atualizar V2 (instalacoes -> pipelineStatus)
            const instalacaoId = `${clientId}_inst_${uc}`;
            const instRef = db.collection("instalacoes").doc(instalacaoId);
            batch.set(instRef, {
                onboarding: {
                    pipelineStatus: mappedStatus
                },
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            // C. Criar V2 (historico_rateios)
            const compSafe = (competencia || "000000").replace(/\//g, "");
            const rateioLogId = `${clientId}_${uc}_${compSafe}`;
            const rateioRef = db.collection("historico_rateios").doc(rateioLogId);

            batch.set(rateioRef, {
                instalacaoId: instalacaoId,
                clienteId: clientId,
                usinaId: record.nomeUsina || "Desconhecida",
                consorcio: "Padrão",
                database: databaseId,
                competencia: competencia,
                percentual: Number(record.percentualRateio || 0),
                status: mappedStatus,
                processedBy: context.auth.token.email || context.auth.uid || "System",
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            await batch.commit();
            results.updated++;
            results.success++;

        } catch (err) {
            results.errors.push({ uc, error: err.message });
        }
    }

    return results;
});
