// Firebase Configuration Example
// IMPORTANTE: Copie este arquivo para firebaseConfig.js e adicione suas credenciais reais
// O arquivo firebaseConfig.js está no .gitignore e NÃO deve ser commitado

// Validação de segurança em ambiente de desenvolvimento
function validateConfig(config) {
    const required = ['apiKey', 'projectId', 'authDomain'];
    const missing = required.filter(key => !config[key]);

    if (missing.length > 0) {
        console.error('❌ Configuração Firebase incompleta. Campos faltando:', missing);
        console.error('📝 Copie firebaseConfig.example.js para firebaseConfig.js e adicione suas credenciais');
        return false;
    }

    // Detectar credenciais de exemplo não substituídas
    if (config.apiKey.includes('YOUR_') || config.projectId.includes('your-')) {
        console.error('❌ Você está usando credenciais de exemplo!');
        console.error('📝 Substitua os valores em firebaseConfig.js pelas suas credenciais reais do Firebase Console');
        return false;
    }

    return true;
}

export const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.firebasestorage.app",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
};

// Validar configuração ao carregar
if (!validateConfig(firebaseConfig)) {
    throw new Error('Configuração Firebase inválida. Verifique o console para detalhes.');
}
