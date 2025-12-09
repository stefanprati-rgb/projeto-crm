# 🔐 Solução Rápida: Erro de Login

## ❌ Problema
```
auth/invalid-credential - Credenciais inválidas
```

---

## ✅ Solução: Criar Usuário de Teste

### Opção 1: Firebase Console (Recomendado)

1. **Abra o Firebase Console:**
   - Link direto: https://console.firebase.google.com/project/crm-energia-solar/authentication/users

2. **Clique em "Add user"**

3. **Preencha os dados:**
   - **Email:** `teste@hubegd.com`
   - **Password:** `teste123456`

4. **Clique em "Add user"**

5. **Volte ao app e faça login:**
   - Email: `teste@hubegd.com`
   - Senha: `teste123456`

---

### Opção 2: Usar Credenciais Existentes

Se você já tem um usuário criado anteriormente no Firebase, use essas credenciais.

---

## 📝 Instruções Visuais na Tela de Login

A tela de login agora mostra:
- 💡 Dica de credenciais de teste
- Link direto para criar usuário no Firebase Console

---

## 🐛 Sobre o Erro do React

O erro `NotFoundError: Failed to execute 'removeChild'` é um bug conhecido do React 19 com hot reload.

**Solução:** Ignore ou recarregue a página (Ctrl+R) se necessário.

---

## 🚀 Próximos Passos

Após fazer login com sucesso:

1. ✅ Você será redirecionado para o Dashboard
2. ✅ Verá os novos itens no menu (Operações, Admin)
3. ✅ Poderá começar os testes de importação

---

**Vá para:** `docs/GUIA_TESTES_HUB_GD.md` para continuar os testes!
