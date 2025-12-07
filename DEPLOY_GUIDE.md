# 🚀 Guia de Deploy - Hube CRM React

## 📋 Pré-requisitos

Antes de fazer o deploy, certifique-se de:

- ✅ Ter uma conta no Firebase
- ✅ Ter o projeto Firebase configurado (`crm-energia-solar`)
- ✅ Ter as credenciais do Firebase
- ✅ Ter o Firebase CLI instalado (`npm install -g firebase-tools`)

---

## 🔧 Configuração

### 1. Configurar Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais do Firebase:

```env
VITE_FIREBASE_API_KEY=sua_api_key
VITE_FIREBASE_AUTH_DOMAIN=crm-energia-solar.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=crm-energia-solar
VITE_FIREBASE_STORAGE_BUCKET=crm-energia-solar.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
VITE_FIREBASE_APP_ID=seu_app_id
VITE_USE_FIREBASE_EMULATOR=false
```

### 2. Testar Localmente

```bash
npm run dev
```

Acesse: http://localhost:3000

---

## 🏗️ Build de Produção

### 1. Criar Build

```bash
npm run build
```

Isso irá:
- Compilar o código com SWC
- Minificar com esbuild
- Gerar chunks otimizados
- Criar a pasta `dist/`

### 2. Testar Build Localmente

```bash
npm run preview
```

Acesse: http://localhost:4173

---

## 🚀 Deploy no Firebase Hosting

### 1. Login no Firebase

```bash
firebase login
```

### 2. Inicializar Firebase (se ainda não foi feito)

```bash
firebase init hosting
```

Configurações:
- **Project**: Selecione `crm-energia-solar`
- **Public directory**: `dist`
- **Single-page app**: `Yes`
- **GitHub Actions**: `No` (por enquanto)

### 3. Criar `firebase.json`

Crie o arquivo `firebase.json` na raiz do projeto:

```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      },
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

### 4. Deploy

```bash
npm run build
firebase deploy --only hosting
```

### 5. Acessar

Após o deploy, você receberá uma URL:
```
https://crm-energia-solar.web.app
```

---

## 🔄 Deploy Automático (CI/CD)

### GitHub Actions

Crie `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches:
      - main

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
      
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: crm-energia-solar
```

**Configurar Secrets no GitHub:**
1. Ir em Settings > Secrets and variables > Actions
2. Adicionar cada variável de ambiente
3. Adicionar `FIREBASE_SERVICE_ACCOUNT` (obter no Firebase Console)

---

## 🌐 Alternativas de Deploy

### Vercel

```bash
npm install -g vercel
vercel
```

### Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod
```

---

## ✅ Checklist de Deploy

- [ ] Variáveis de ambiente configuradas
- [ ] Build testado localmente (`npm run build` + `npm run preview`)
- [ ] Firebase CLI instalado e autenticado
- [ ] `firebase.json` configurado
- [ ] Build de produção criado
- [ ] Deploy realizado
- [ ] URL de produção testada
- [ ] Autenticação funcionando
- [ ] Firestore funcionando
- [ ] Dark mode funcionando
- [ ] Todas as páginas acessíveis

---

## 🔒 Segurança

### Regras do Firestore

Certifique-se de ter as regras de segurança configuradas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Regra para clientes
    match /clients/{clientId} {
      allow read, write: if request.auth != null;
      
      // Regra para tickets dentro de clientes
      match /tickets/{ticketId} {
        allow read, write: if request.auth != null;
      }
    }
    
    // Regra para usuários
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Regras do Firebase Auth

No Firebase Console:
1. Ir em Authentication > Sign-in method
2. Habilitar Email/Password
3. Configurar domínios autorizados

---

## 📊 Monitoramento

### Firebase Analytics

Adicione ao `src/services/firebase.js`:

```javascript
import { getAnalytics } from 'firebase/analytics';

export const analytics = getAnalytics(app);
```

### Performance Monitoring

```bash
npm install firebase
```

```javascript
import { getPerformance } from 'firebase/performance';

export const perf = getPerformance(app);
```

---

## 🐛 Troubleshooting

### Erro: "Firebase not configured"
- Verifique se o arquivo `.env` existe
- Confirme que todas as variáveis estão preenchidas

### Erro: "Permission denied"
- Verifique as regras do Firestore
- Confirme que o usuário está autenticado

### Build falha
- Limpe o cache: `rm -rf node_modules package-lock.json`
- Reinstale: `npm install`
- Tente novamente: `npm run build`

### Deploy falha
- Verifique se está logado: `firebase login`
- Confirme o projeto: `firebase use crm-energia-solar`
- Tente novamente: `firebase deploy --only hosting`

---

## 📝 Comandos Úteis

```bash
# Build
npm run build

# Preview
npm run preview

# Deploy
firebase deploy --only hosting

# Ver logs
firebase hosting:channel:list

# Rollback (se necessário)
firebase hosting:clone SOURCE_SITE_ID:SOURCE_CHANNEL_ID TARGET_SITE_ID:live
```

---

## 🎉 Pronto!

Seu Hube CRM React está agora em produção! 🚀

**URL de Produção**: https://crm-energia-solar.web.app

**Próximos Passos:**
- Configurar domínio customizado
- Adicionar SSL (automático no Firebase)
- Configurar CI/CD
- Monitorar performance
- Coletar feedback dos usuários
