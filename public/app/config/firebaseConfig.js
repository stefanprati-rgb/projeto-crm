// Firebase Configuration
// IMPORTANTE: Este arquivo está no .gitignore e NÃO deve ser commitado

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
  apiKey: "AIzaSyBO_jqBqWHHnq1QQlROi2lajKu1K6RbBnE",
  authDomain: "crm-energia-solar.firebaseapp.com",
  projectId: "crm-energia-solar",
  storageBucket: "crm-energia-solar.firebasestorage.app",
  messagingSenderId: "83187644189",
  appId: "1:83187644189:web:d3cf98a894e87c2c8093f4",
  measurementId: "G-QC5dRD90W"
};

// Validar configuração ao carregar
if (!validateConfig(firebaseConfig)) {
  throw new Error('Configuração Firebase inválida. Verifique o console para detalhes.');
}