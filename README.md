# Projeto CRM - Sistema de Gestão

Sistema de CRM (Customer Relationship Management) para gestão de vendas, produção, estoque e finanças.

## 🚀 Tecnologias

- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Backend**: Firebase (Firestore, Hosting)
- **Estilo**: Tailwind CSS
- **Deploy**: GitHub Actions → Firebase Hosting

## 📦 Estrutura do Projeto

```
projeto-crm/
├── public/              # Arquivos públicos do site
│   ├── css/            # Estilos CSS
│   ├── js/             # Scripts JavaScript
│   ├── modals/         # Modais HTML
│   └── index.html      # Página principal
├── .github/
│   └── workflows/      # GitHub Actions workflows
├── firebase.json       # Configuração do Firebase
└── firestore.rules     # Regras de segurança do Firestore
```

## 🔧 Desenvolvimento Local

1. **Instalar Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Login no Firebase**:
   ```bash
   firebase login
   ```

3. **Executar localmente**:
   ```bash
   firebase serve
   ```

4. **Acessar**: http://localhost:5000

## 🚀 Deploy Automático

O projeto está configurado com **GitHub Actions** para deploy automático:

1. **Push para `main`** → Dispara o workflow
2. **GitHub Actions** → Executa o deploy
3. **Firebase Hosting** → Aplicação atualizada

### Configuração do Deploy

Para configurar o deploy automático, você precisa adicionar a service account do Firebase aos secrets do GitHub:

1. Acesse: https://github.com/stefanprati-rgb/projeto-crm/settings/secrets/actions
2. Clique em **"New repository secret"**
3. Nome: `FIREBASE_SERVICE_ACCOUNT_CRM_ENERGIA_SOLAR`
4. Valor: JSON da service account do Firebase

#### Como obter a Service Account:

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione o projeto `crm-energia-solar`
3. Vá em **Project Settings** → **Service Accounts**
4. Clique em **"Generate new private key"**
5. Copie todo o conteúdo do arquivo JSON gerado
6. Cole como valor do secret no GitHub

## 📝 Como Contribuir

1. Clone o repositório:
   ```bash
   git clone https://github.com/stefanprati-rgb/projeto-crm.git
   cd projeto-crm
   ```

2. Faça suas alterações

3. Commit e push:
   ```bash
   git add .
   git commit -m "Descrição das alterações"
   git push origin main
   ```

4. O deploy será automático! ✨

## 🔐 Firestore Security Rules

As regras de segurança estão configuradas em `firestore.rules`. Para atualizar:

```bash
firebase deploy --only firestore:rules
```

## 📊 Firebase Project

- **Project ID**: `crm-energia-solar`
- **Hosting URL**: https://crm-energia-solar.web.app

## 📄 Licença

Este projeto é privado e de uso interno.
