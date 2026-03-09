const admin = require("firebase-admin");

/**
 * Script de Seed para Teste V2
 * Injeta um cliente e uma instalação nas novas coleções para validar a migração visual.
 */

if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

async function seedTest() {
    try {
        console.log("--- Gerando Seed de Teste (Arquitetura V2) ---");

        const testClientId = "teste_engenharia_001";
        const clienteRef = db.collection("clientes").doc(testClientId);

        // 1. Criar Cliente
        const clienteData = {
            database: "Raízen",
            name: "Cliente Teste Engenharia",
            document: "123.456.789-00",
            contactInfo: {
                email: "engenharia@teste.com.br",
                phone: "(31) 99999-8888",
            },
            status: "active",
            createdBy: "system_seed",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        await clienteRef.set(clienteData);
        console.log(`✅ Cliente Teste criado: ${testClientId}`);

        // 2. Criar Instalação vinculada
        const instId = `${testClientId}_inst_123456789`;
        const instalacaoRef = db.collection("instalacoes").doc(instId);

        const instalacaoData = {
            clienteId: testClientId,
            clienteNome: clienteData.name, // Denormalização para performance na listagem
            database: "Raízen",
            uc: "123456789",
            distributor: "CEMIG",
            energyClass: "B1 - Residencial",
            modalidadeTarifaria: "Convencional",
            onboarding: {
                pipelineStatus: "new",
                compensationForecastDate: null
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        await instalacaoRef.set(instalacaoData);
        console.log(`✅ Instalação Teste vinculada: ${instId}`);

        console.log("--- SEED CONCLUÍDO COM SUCESSO ---");
        process.exit(0);
    } catch (error) {
        console.error("❌ Erro no Seed:", error);
        process.exit(1);
    }
}

seedTest();
