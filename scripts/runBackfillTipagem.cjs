const admin = require("firebase-admin");

/**
 * Script de Backfill: Higienização de Tipagem
 * 
 * Converte campos críticos (telefone, documento, UC) que foram salvos como Number
 * para o tipo String, garantindo que as buscas por .toLowerCase() não quebrem.
 */

if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

async function runBackfill() {
    console.log("🚀 Iniciando Backfill de Tipagem...");

    let totalProcessed = 0;
    let totalUpdated = 0;

    const collections = ['clients', 'clientes', 'instalacoes'];

    for (const colName of collections) {
        console.log(`\n📁 Processando coleção: ${colName}...`);
        const snapshot = await db.collection(colName).get();

        let batch = db.batch();
        let batchCount = 0;
        let colUpdated = 0;

        // Trocamos o forEach por um for...of para permitir o await seguro do commit parcial
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

                // Agora o commit parcial realmente acontece respeitando o limite do Firestore
                if (batchCount >= 400) {
                    console.log(`   - Fazendo commit de lote parcial... (400 docs)`);
                    await batch.commit();
                    batch = db.batch(); // Inicia um lote novo
                    batchCount = 0;     // Zera o contador para os próximos
                }
            }
            totalProcessed++;
        }

        if (batchCount > 0) {
            await batch.commit();
            console.log(`✅ Coleção ${colName}: ${colUpdated} documentos corrigidos.`);
        } else if (colUpdated === 0) {
            console.log(`✨ Coleção ${colName}: Nenhum erro de tipagem encontrado.`);
        }
    }

    console.log(`\n🏁 Backfill Finalizado!`);
    console.log(`📊 Total Documentos Analisados: ${totalProcessed}`);
    console.log(`🛠️ Total Documentos Corrigidos: ${totalUpdated}`);
    process.exit(0);
}

runBackfill().catch(err => {
    console.error("❌ Erro crítico no backfill:", err);
    process.exit(1);
});
