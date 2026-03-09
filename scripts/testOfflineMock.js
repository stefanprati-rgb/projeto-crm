const adminMock = {
    apps: ['mockApp'],
    firestore: () => dbMock
};

let dbWrites = [];

const batchMock = {
    set: (ref, data, options) => {
        dbWrites.push({
            collection: ref.collectionPath,
            id: ref.docId,
            data: data,
            options: options
        });
    },
    commit: async () => {
        console.log(`[Mock Batch] Commit de ${dbWrites.length} operações realizado com sucesso!`);
        return true;
    }
};

const dbMock = {
    collection: (path) => ({
        doc: (id) => ({
            collectionPath: path,
            docId: id
        })
    }),
    batch: () => batchMock
};

adminMock.firestore.FieldValue = {
    serverTimestamp: () => "MOCK_SERVER_TIMESTAMP"
};

// Mock the context and change for the function
const mockContext = {
    params: { clientId: "cliente_123" }
};

const mockChange = {
    before: { exists: false },
    after: {
        exists: true,
        data: () => ({
            database: "test_tenant",
            name: "Cliente Teste",
            uc: "UC_RAIZ_QUE_SERA_IGNORADA",
            instalacoes: [
                {
                    uc: "3000100020",
                    energyClass: "A4",
                    onboarding: { pipelineStatus: "waiting_apportionment" }
                },
                {
                    uc: "3000100055",
                    energyClass: "B3",
                    onboarding: { pipelineStatus: "new" }
                }
            ],
            createdAt: "OLD_DATA_TIMESTAMP"
        })
    }
};

// Execute the logic offline to prove the array splitting works
async function runOfflineTest() {
    console.log("=== INICIANDO TESTE OFFLINE DO DUAL-WRITE ===");

    const clientId = mockContext.params.clientId;
    const legacyData = mockChange.after.data();
    const databaseId = legacyData.database || "default";

    const clienteRef = dbMock.collection("clientes").doc(clientId);
    const clienteData = {
        database: databaseId,
        name: legacyData.name || "",
        status: legacyData.status || "active",
        updatedAt: adminMock.firestore.FieldValue.serverTimestamp()
    };

    if (!mockChange.before.exists) {
        clienteData.createdAt = legacyData.createdAt || adminMock.firestore.FieldValue.serverTimestamp();
    }

    const batch = dbMock.batch();
    batch.set(clienteRef, clienteData, { merge: true });

    const legacyInstallations = legacyData.instalacoes || legacyData.installations || [];
    const logsInstalacoes = [];

    if (Array.isArray(legacyInstallations) && legacyInstallations.length > 0) {
        legacyInstallations.forEach((inst, index) => {
            const instalacaoId = `${clientId}_inst_${inst.uc || index}`;
            const instalacaoRef = dbMock.collection("instalacoes").doc(instalacaoId);

            const instalacaoData = {
                clienteId: clientId,
                database: databaseId,
                uc: inst.uc || "",
                energyClass: inst.energyClass || inst.consumptionClass || legacyData.energyClass || legacyData.consumptionClass || "",
                onboarding: inst.onboarding || legacyData.onboarding || {
                    pipelineStatus: "new",
                    compensationForecastDate: null
                },
                updatedAt: adminMock.firestore.FieldValue.serverTimestamp()
            };

            if (!mockChange.before.exists) {
                instalacaoData.createdAt = inst.createdAt || legacyData.createdAt || adminMock.firestore.FieldValue.serverTimestamp();
            }

            batch.set(instalacaoRef, instalacaoData, { merge: true });
            logsInstalacoes.push(instalacaoId);
        });
    } else {
        // fallback omitido para simplificar
    }

    await batch.commit();

    console.log(`[Dual-Write Offline Test] Finalizado.`);
    console.log("\n[Resultado do Batch]:");
    dbWrites.forEach((op, index) => {
        console.log(`Operação ${index + 1}: Escrevendo em '${op.collection}/${op.id}'`);
        if (op.collection === "instalacoes") {
            console.log(`  -> Referência clienteId: ${op.data.clienteId}`);
            console.log(`  -> UC: ${op.data.uc}`);
            console.log(`  -> Pipeline Status: ${op.data.onboarding.pipelineStatus}`);
        }
    });
}

runOfflineTest();
