const admin = require('firebase-admin');

// Conectar ao Emulador Local do Firestore
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";

admin.initializeApp({
    projectId: "crm-energia-solar"
});

const db = admin.firestore();

async function runSimulation() {
    try {
        const mockClientId = "mock_client_dual_write_" + Date.now();

        const mockClienteGordo = {
            database: "test_tenant",
            name: "Cliente Teste Master S/A",
            document: "12345678000199",
            contactInfo: {
                email: "contato@clienteteste.com",
                phone: "11999999999"
            },
            status: "active",
            instalacoes: [
                {
                    uc: "3000100020",
                    distributor: "CEMIG",
                    energyClass: "A4_MEDIA_TENSAO",
                    modalidadeTarifaria: "Verde",
                    classeConsumo: "B1_RESIDENCIAL",
                    enderecoUC: "Rua das Flores, 123",
                    onboarding: {
                        pipelineStatus: "sent_to_apportionment",
                        compensationForecastDate: admin.firestore.FieldValue.serverTimestamp()
                    }
                },
                {
                    uc: "3000100055",
                    distributor: "CEMIG",
                    energyClass: "B3_DEMAIS_CLASSES",
                    modalidadeTarifaria: "Convencional",
                    classeConsumo: "B3_DEMAIS_CLASSES",
                    enderecoUC: "Av Comercial, 400",
                    onboarding: {
                        pipelineStatus: "new",
                        compensationForecastDate: null
                    }
                }
            ],
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: "test_user_123"
        };

        console.log(`[TESTE] Inserindo cliente legado no Emulator: clients/${mockClientId}`);
        await db.collection('clients').doc(mockClientId).set(mockClienteGordo);
        console.log(`[TESTE] Documento inserido com sucesso!`);

        console.log(`[TESTE] Aguardando 3 segundos para Cloud Function processar...`);
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log(`[TESTE] Lendo dados processados (coleção: clientes)`);
        const clienteDoc = await db.collection('clientes').doc(mockClientId).get();

        if (clienteDoc.exists) {
            console.log(`[SUCESSO] Cliente relacional criado:`, clienteDoc.data());
        } else {
            console.log(`[FALHA] Cliente relacional não foi encontrado.`);
        }

        console.log(`[TESTE] Lendo dados processados (coleção: instalacoes)`);
        const instalacoesQuery = await db.collection('instalacoes').where('clienteId', '==', mockClientId).get();

        if (!instalacoesQuery.empty) {
            console.log(`[SUCESSO] Encontradas ${instalacoesQuery.size} instalações para este cliente:`);
            instalacoesQuery.forEach(doc => {
                console.log(` - ID: ${doc.id} | UC: ${doc.data().uc} | Pipeline: ${doc.data().onboarding?.pipelineStatus}`);
            });
        } else {
            console.log(`[FALHA] Nenhuma instalação encontrada para este cliente.`);
        }

        process.exit(0);
    } catch (error) {
        console.error("Erro na simulação:", error);
        process.exit(1);
    }
}

runSimulation();
