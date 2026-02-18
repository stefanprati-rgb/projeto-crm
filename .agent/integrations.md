# Integrações Externas

## Banco de Dados & Auth
### Firebase
- **Tipo**: Firestore (NoSQL) + Auth (Identity Platform)
- **Credenciais**: Variáveis de ambiente (`.env`)
- **Configuração**: Localizada em `src/services/firebase.js`

## Hosting
- **Provedor**: Firebase Hosting
- **CI/CD**: GitHub Actions pré-configurado via `.github/workflows`

## Dependências de Sistema
- Node.js: 18+
- NPM: 9+
