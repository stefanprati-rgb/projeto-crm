const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

/**
 * Cloud Function Temporária: limparTipagemLegada
 * 
 * Finalidade: Higienizar dados no Firestore, convertendo tipos Number (vindos do Excel)
 * para String em campos críticos de busca.
 * 
 * ATENÇÃO: Deletar esta função após a execução bem-sucedida para economizar recursos
 * e evitar execuções acidentais.
 */
exports.limparTipagemLegada = functions.https.onRequest(async (req, res) => {
    const db = admin.firestore();

    try {
        let totalProcessed = 0;
        let totalUpdated = 0;
        const logs = [];

        const collections = ['clients', 'clientes', 'instalacoes'];

        for (const colName of collections) {
            const snapshot = await db.collection(colName).get();

            let batch = db.batch();
            let batchCount = 0;
            let colUpdated = 0;

            for (const doc of snapshot.docs) {
                const data = doc.data();
                let needsUpdate = false;
                const updates = {};

                // Campos para checar no objeto raiz
                const fieldsToCheck = [
                    'phone', 'telefone', 'cpfCnpj', 'documento', 'document',
                    'uc', 'installationId', 'idContaAcc', 'idUcNegociada'
                ];

                fieldsToCheck.forEach(field => {
                    if (data[field] !== undefined && data[field] !== null && typeof data[field] !== 'string') {
                        updates[field] = String(data[field]).trim();
                        needsUpdate = true;
                    }
                });

                // Checar dentro de contactInfo (V2 e Dual-Write)
                if (data.contactInfo) {
                    const ci = data.contactInfo;
                    const ciUpdates = {};
                    let ciNeedsUpdate = false;

                    if (ci.phone !== undefined && ci.phone !== null && typeof ci.phone !== 'string') {
                        ciUpdates.phone = String(ci.phone).trim();
                        ciNeedsUpdate = true;
                    }

                    if (ciNeedsUpdate) {
                        updates.contactInfo = { ...ci, ...ciUpdates };
                        needsUpdate = true;
                    }
                }

                // Checar dentro de instalacoes (Array legado)
                if (Array.isArray(data.instalacoes)) {
                    let instArrNeedsUpdate = false;
                    const newInstArr = data.instalacoes.map(inst => {
                        if (inst.uc !== undefined && inst.uc !== null && typeof inst.uc !== 'string') {
                            instArrNeedsUpdate = true;
                            return { ...inst, uc: String(inst.uc).trim() };
                        }
                        return inst;
                    });

                    if (instArrNeedsUpdate) {
                        updates.instalacoes = newInstArr;
                        needsUpdate = true;
                    }
                }

                if (needsUpdate) {
                    batch.update(doc.ref, updates);
                    batchCount++;
                    colUpdated++;
                    totalUpdated++;

                    if (batchCount >= 400) {
                        await batch.commit();
                        batch = db.batch();
                        batchCount = 0;
                    }
                }
                totalProcessed++;
            }

            if (batchCount > 0) {
                await batch.commit();
            }
            logs.push(`${colName}: ${colUpdated} corrigidos`);
        }

        res.status(200).send({
            success: true,
            summary: {
                totalAnalizado: totalProcessed,
                totalCorrigido: totalUpdated,
                detalhes: logs
            }
        });

    } catch (error) {
        console.error("Erro no Backfill:", error);
        res.status(500).send({
            success: false,
            error: error.message
        });
    }
});
