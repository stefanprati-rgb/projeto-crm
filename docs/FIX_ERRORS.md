# 🔧 Correção de Erros - Guia Rápido

## ❌ Erro 1: firebaseConfig não exportado

### Problema
```
Uncaught SyntaxError: The requested module '../config/firebaseConfig.js' 
does not provide an export named 'firebaseConfig'
```

### Causa
O arquivo `firebaseConfig.js` não está exportando a constante corretamente.

### ✅ Solução

**Arquivo**: `public/app/config/firebaseConfig.js`

O arquivo deve ter este formato EXATO:

```javascript
// Firebase Configuration
export const firebaseConfig = {
  apiKey: "AIzaSyBD_qBqWHHnq1QQjROI2jkJu1K6RbBnE",
  authDomain: "crm-energia-solar.firebaseapp.com",
  projectId: "crm-energia-solar",
  storageBucket: "crm-energia-solar.firebasestorage.app",
  messagingSenderId: "83187644189",
  appId: "1:83187644189:web:d3cf98a894e87c2c8093f4",
  measurementId: "G-QC5dRD90W"
};
```

**IMPORTANTE**: 
- A palavra-chave `export` DEVE estar presente
- Use `export const` (não apenas `const`)
- Não use `export default`

### Verificação

Após corrigir, o arquivo deve:
1. ✅ Começar com `export const firebaseConfig = {`
2. ✅ Terminar com `};`
3. ✅ Conter todas as chaves do Firebase

---

## ❌ Erro 2: Autocomplete ausente

### Problema
```
Input elements should have autocomplete attributes
```

### ✅ Solução

**Status**: ✅ CORRIGIDO AUTOMATICAMENTE

O campo `createPassword` agora tem `autocomplete="new-password"`.

---

## 📝 Checklist de Correção

- [ ] Abrir `public/app/config/firebaseConfig.js`
- [ ] Verificar se começa com `export const firebaseConfig = {`
- [ ] Salvar o arquivo
- [ ] Recarregar a página (F5)
- [ ] Verificar se o erro desapareceu

---

## 🔍 Como Verificar

### 1. Verificar Export

Abra o DevTools (F12) e execute:

```javascript
import('./app/config/firebaseConfig.js').then(module => {
  console.log('Config carregado:', module.firebaseConfig);
});
```

Se funcionar, verá o objeto de configuração no console.

### 2. Verificar Autocomplete

Inspecione o elemento `<input id="createPassword">` e confirme que tem:
```html
autocomplete="new-password"
```

---

## 🚨 Se o Erro Persistir

### Opção 1: Copiar do Exemplo

```bash
# No terminal
cp public/app/config/firebaseConfig.example.js public/app/config/firebaseConfig.js
```

### Opção 2: Criar Manualmente

1. Criar arquivo: `public/app/config/firebaseConfig.js`
2. Copiar o conteúdo do exemplo acima
3. Salvar
4. Recarregar a página

---

## 📚 Arquivos Relacionados

- `public/app/config/firebaseConfig.js` - Arquivo principal (CORRIGIR)
- `public/app/config/firebaseConfig.example.js` - Exemplo correto
- `public/app/core/firebase.js` - Importa o config
- `.gitignore` - Protege firebaseConfig.js

---

## ✅ Status das Correções

| Erro | Status | Ação |
|------|--------|------|
| **firebaseConfig export** | ⚠️ MANUAL | Adicionar `export` ao arquivo |
| **autocomplete** | ✅ CORRIGIDO | Automático |

---

**Próximo Passo**: Edite `public/app/config/firebaseConfig.js` e adicione `export` antes de `const`.
