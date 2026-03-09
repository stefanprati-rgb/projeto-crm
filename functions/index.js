const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * secureStoreCredential
 * 
 * Esqueleto da função para armazenar credenciais com segurança.
 * Na próxima iteração, usará o Google Cloud Secret Manager (ou 
 * variáveis de ambiente do backend) para assumir o papel da chave
 * de encriptação que hoje reside no front-end.
 */
exports.secureStoreCredential = functions.https.onCall(async (data, context) => {
    // TODO: Implementar lógica de Secret Manager

    // Exemplo de verificação de autenticação:
    if (!context.auth) {
        throw new functions.https.HttpsError(
            "unauthenticated",
            "The function must be called while authenticated."
        );
    }

    // TODO: Obter a senha enviada no payload, 
    // criptografar com uma chave segura (do Secret Manager)
    // e salvar no Firestore de forma segura.

    return { success: true, message: "Placeholder para secureStoreCredential" };
});

const dualWrite = require("./syncDualWrite");
exports.syncClientToRelationalModel = dualWrite.syncClientToRelationalModel;

const importProcessor = require("./importProcessor");
exports.processRaizenImport = importProcessor.processRaizenImport;
exports.processRateioImport = importProcessor.processRateioImport;
