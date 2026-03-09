# 🚀 Deploy Rápido - Hube CRM React

## ⚡ Passos Rápidos

### 1. Configurar Ambiente
```bash
# Copiar variáveis de ambiente
cp .env.example .env

# Editar .env com suas credenciais do Firebase
# VITE_FIREBASE_API_KEY=...
# VITE_FIREBASE_AUTH_DOMAIN=...
# etc.
```

### 2. Build
```bash
npm run build
```

### 3. Deploy
```bash
# Login no Firebase (primeira vez)
firebase login

# Deploy
firebase deploy --only hosting
```

## ✅ Pronto!

Seu app estará disponível em:
**https://crm-energia-solar.web.app**

---

## 📋 Checklist Pré-Deploy

- [ ] `.env` configurado com credenciais do Firebase
- [ ] `npm run build` executado com sucesso
- [ ] `npm run preview` testado localmente
- [ ] Firebase CLI instalado (`npm install -g firebase-tools`)
- [ ] Autenticado no Firebase (`firebase login`)

---

## 🔧 Comandos Úteis

```bash
# Testar build localmente
npm run preview

# Ver projeto Firebase atual
firebase use

# Trocar projeto
firebase use crm-energia-solar

# Deploy apenas hosting
firebase deploy --only hosting

# Ver histórico de deploys
firebase hosting:channel:list
```

---

## 🐛 Problemas Comuns

**Erro: "Firebase not configured"**
- Verifique o arquivo `.env`

**Erro: "Permission denied"**
- Execute `firebase login`
- Verifique as regras do Firestore

**Build falha**
- Limpe: `rm -rf node_modules dist`
- Reinstale: `npm install`
- Build: `npm run build`

---

## 📚 Documentação Completa

Ver `DEPLOY_GUIDE.md` para instruções detalhadas.

---

**🎉 Boa sorte com o deploy!**
