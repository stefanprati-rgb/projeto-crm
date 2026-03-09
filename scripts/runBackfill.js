const admin = require("firebase-admin");
const path = require("path");

console.log("=== INICIANDO BACKFILL DE CLIENTES PARA V2 ===");
console.log("[Aviso]: Para testar localmente conectando à Homologação/Produção, certifique-se de configurar a variável de ambiente GOOGLE_APPLICATION_CREDENTIALS apontando para a sua chave de serviço (serviceAccountKey.json).");

// Inicializa o Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

async function runBackfill() {
    try {
        console.log("Consultando coleção legada `clients`...");
        const clientsSnapshot = await db.collection("clients").get();
        const totalDocs = clientsSnapshot.size;
        console.log(`Encontrados ${totalDocs} clientes na coleção legada.`);

        if (totalDocs === 0) {
            console.log("Nenhum documento para migrar. Encerrando.");
            process.exit(0);
        }

        let batch = db.batch();
        let opCount = 0;
        let totalProcessed = 0;

        for (const doc of clientsSnapshot.docs) {
            const clientId = doc.id;
            const legacyData = doc.data();
            const databaseId = legacyData.database || "default";

            // ----------------------------------------------------
            // 1. DADOS DE CLIENTE
            // ----------------------------------------------------
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
                createdAt: legacyData.createdAt || admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };

            batch.set(clienteRef, clienteData, { merge: true });
            opCount++;

            // ----------------------------------------------------
            // 2. DADOS DE INSTALAÇÕES
            // ----------------------------------------------------
            const legacyInstallations = legacyData.instalacoes || legacyData.installations || [];
            let primaryUc = legacyData.uc || "1";

            if (Array.isArray(legacyInstallations) && legacyInstallations.length > 0) {
                primaryUc = legacyInstallations[0].uc || primaryUc;
                legacyInstallations.forEach((inst, index) => {
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
                        createdAt: inst.createdAt || legacyData.createdAt || admin.firestore.FieldValue.serverTimestamp(),
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    };

                    batch.set(instalacaoRef, instalacaoData, { merge: true });
                    opCount++;
                });
            } else {
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
                    createdAt: legacyData.createdAt || admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                };

                batch.set(instalacaoRef, instalacaoData, { merge: true });
                opCount++;
            }

            // ----------------------------------------------------
            // 3. DADOS DE RATEIO HISTÓRICO
            // ----------------------------------------------------
            if (legacyData.rateio) {
                const rData = legacyData.rateio;
                let competencia = "00/0000";

                if (rData.dataUltimoEnvioBase) {
                    try {
                        let d;
                        // Trata timestamp do firestore vs string ISO
                        if (rData.dataUltimoEnvioBase.toDate) {
                            d = rData.dataUltimoEnvioBase.toDate();
                        } else {
                            d = new Date(rData.dataUltimoEnvioBase);
                        }

                        if (!isNaN(d.getTime())) {
                            competencia = `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
                        }
                    } catch (e) {
                        console.warn(`Aviso: Falha ao parsear dataUltimoEnvioBase em ${clientId}`);
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
                opCount++;
            }

            totalProcessed++;

            // O Firestore impõe o limite de 500 operações por Batch.
            // Executamos o Commit a cada 400 operações para margem de segurança.
            if (opCount >= 400) {
                console.log(`[Backfill] Realizando commit de batch parcial (${opCount} operações). Progresso clientes: ${totalProcessed}/${totalDocs}`);
                await batch.commit();
                batch = db.batch(); // Inicia novo lote
                opCount = 0;
            }
        }

        // Commit final para restos do lote
        if (opCount > 0) {
            console.log(`[Backfill] Realizando commit de batch final (${opCount} operações...`);
            await batch.commit();
        }

        console.log("=== BACKFILL CONCLUÍDO COM SUCESSO ===");
        console.log(`Total de clientes migrados: ${totalProcessed}`);
        process.exit(0);

    } catch (error) {
        console.error("Erro fatal durante o Backfill:", error);
        process.exit(1);
    }
}

runBackfill();
