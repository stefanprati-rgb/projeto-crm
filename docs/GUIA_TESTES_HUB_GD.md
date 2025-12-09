# 🧪 Guia de Testes - Hub de Operação GD

## ✅ Servidor Iniciado
**URL:** http://localhost:3000/

---

## 📋 Roteiro de Testes

### TESTE 1: Login e Navegação Básica

#### Passo 1.1: Fazer Login
1. Abra: http://localhost:3000/
2. Faça login com suas credenciais Firebase
3. ✅ **Verificar:** Você deve ser redirecionado para o Dashboard

#### Passo 1.2: Verificar Menu de Navegação
1. Verifique se o menu lateral tem os novos itens:
   - 🏠 Dashboard
   - 👥 Clientes
   - 🎫 Tickets
   - **🏭 Operações** ← NOVO
   - 📊 Relatórios
   - **💾 Admin** ← NOVO
   - ⚙️ Configurações

2. ✅ **Verificar:** Os ícones Factory (🏭) e Database (💾) aparecem corretamente

---

### TESTE 2: Importar Base de Clientes

#### Passo 2.1: Acessar Página de Admin
1. Clique em **"Admin"** no menu lateral
2. Ou acesse: http://localhost:3000/admin
3. ✅ **Verificar:** Página carrega com 2 abas

#### Passo 2.2: Preparar Arquivo de Teste
Crie um arquivo CSV chamado `clientes_teste.csv` com este conteúdo:

```csv
Nome/Razão Social,CPF/CNPJ,E-mail,INSTALACAO,USINA,TENSAO,MEDIDOR
João Silva,12345678901,joao@email.com,10/908866-7,GIROSSOL III,220V,MED001
Maria Santos,98765432100,maria@email.com,10/2344751-9,GIROSSOL II,380V,MED002
Empresa ABC LTDA,12345678000190,contato@abc.com,10/123456-1,GIROSSOL III,220V,MED003
```

#### Passo 2.3: Fazer Upload
1. Na aba **"Importar Base de Clientes"**
2. Clique na área de upload ou arraste o arquivo `clientes_teste.csv`
3. ✅ **Verificar:** 
   - Mensagem "3 registros encontrados"
   - Card verde "Arquivo válido!"

#### Passo 2.4: Importar
1. Clique no botão **"Importar 3 Registros"**
2. ✅ **Verificar:**
   - Barra de progresso aparece
   - Mensagem de sucesso ao final
   - Console mostra logs:
     ```
     ✅ Usina criada: GIROSSOL III
     ✅ Usina criada: GIROSSOL II
     ✅ Cliente criado: João Silva (10/908866-7)
     ✅ Cliente criado: Maria Santos (10/2344751-9)
     ✅ Cliente criado: Empresa ABC LTDA (10/123456-1)
     ```

#### Passo 2.5: Verificar no Firestore
1. Abra o Firebase Console
2. Vá em Firestore Database
3. ✅ **Verificar:**
   - Coleção `clients` tem 3 novos documentos
   - Coleção `plants` tem 2 documentos (GIROSSOL II e III)
   - Cada cliente tem os campos:
     - `installationId`
     - `plantName`
     - `voltage`
     - `meter`

---

### TESTE 3: Importar Faturas

#### Passo 3.1: Usar Arquivo de Teste
O arquivo `faturas_exportacao_financeiro.csv` já está criado na raiz do projeto.

Conteúdo:
```csv
Instalação,Valor,Vencimento
10/908866-7,413.36,2024-12-10
10/2344751-9,175.90,2025-01-15
10/908866-7,380.00,2025-01-10
10/999999-1,250.50,2024-11-20
10/888888-2,1500.00,2025-02-05
10/2344751-9,180.20,2024-10-15
```

#### Passo 3.2: Acessar Importador de Faturas
1. Em `/admin`, clique na aba **"Importar Faturas"**
2. Faça upload do arquivo `faturas_exportacao_financeiro.csv`
3. ✅ **Verificar:** 
   - "6 linhas encontradas"
   - Mapeamento automático detectou as colunas

#### Passo 3.3: Verificar Mapeamento
1. ✅ **Verificar** que as colunas estão mapeadas:
   - Instalação (UC) → Coluna 0
   - Valor → Coluna 1
   - Vencimento → Coluna 2

2. Veja o **Preview** da primeira linha:
   - Instalação (UC): 10/908866-7
   - Valor: 413.36
   - Vencimento: 2024-12-10

#### Passo 3.4: Importar Faturas
1. Clique em **"Importar 6 Faturas"**
2. ✅ **Verificar:**
   - Barra de progresso
   - Resultado final mostra:
     - Total: 6
     - Sucesso: 2 (apenas as UCs que existem: 10/908866-7 e 10/2344751-9)
     - Não encontrados: 4 (10/999999-1, 10/888888-2, etc.)

#### Passo 3.5: Verificar Status Overdue
1. Abra o console do navegador (F12)
2. ✅ **Verificar** nos logs que faturas vencidas foram marcadas:
   ```
   ✅ Fatura importada para João Silva (10/908866-7)
      - Valor: 413.36
      - Vencimento: 2024-12-10
      - Status: overdue ← VENCIDA!
   ```

---

### TESTE 4: Visualizar Cliente com Faturas

#### Passo 4.1: Acessar Lista de Clientes
1. Clique em **"Clientes"** no menu
2. Ou acesse: http://localhost:3000/clientes
3. ✅ **Verificar:** Lista mostra os 3 clientes importados

#### Passo 4.2: Abrir Detalhes do Cliente
1. Clique em **"João Silva"** (que tem a UC 10/908866-7)
2. ✅ **Verificar:** Painel lateral abre com:
   - Nome: João Silva
   - **UC: 10/908866-7** (em destaque, com ícone ⚡)
   - Badge: **GIROSSOL III** (azul, com ícone de fábrica)
   - Badge: **Ativo** (verde)

#### Passo 4.3: Navegar pelas Abas

**Aba "Visão Geral":**
1. Clique na aba **"Visão Geral"**
2. ✅ **Verificar:**
   - E-mail: joao@email.com
   - CPF/CNPJ: 123.456.789-01 (formatado)
   - Data de cadastro

**Aba "Financeiro":**
1. Clique na aba **"Financeiro"**
2. ✅ **Verificar:**
   - 2 faturas aparecem:
     - **413.36** - Vencimento: 2024-12-10 - Badge **Vencido** (vermelho)
     - **380.00** - Vencimento: 2025-01-10 - Badge **Aberto** (cinza)

**Aba "Técnico":**
1. Clique na aba **"Técnico"**
2. ✅ **Verificar:**
   - Unidade Consumidora (UC): 0010908866-7
   - Tensão: 220V
   - Medidor: MED001
   - Usina: GIROSSOL III

---

### TESTE 5: Dashboard Operacional

#### Passo 5.1: Acessar Dashboard
1. Clique em **"Operações"** no menu
2. Ou acesse: http://localhost:3000/operacoes
3. ✅ **Verificar:** Página carrega com 4 cards no topo

#### Passo 5.2: Verificar Cards de Resumo
✅ **Verificar** os valores nos cards:

1. **Total em Aberto:**
   - Valor: R$ 555,90 (175,90 + 380,00)
   - Ícone: 💵 (azul)

2. **Total Vencido:**
   - Valor: R$ 593,56 (413,36 + 180,20)
   - Ícone: ⚠️ (vermelho)

3. **Total Pago:**
   - Valor: R$ 0,00 (nenhuma fatura paga ainda)
   - Ícone: 📈 (verde)

4. **Clientes com Faturas:**
   - Valor: 2 (João Silva e Maria Santos)
   - Ícone: 👥 (roxo)

#### Passo 5.3: Verificar Gráficos

**Inadimplência por Usina:**
1. ✅ **Verificar:**
   - GIROSSOL III: R$ 413,36 (barra vermelha)
   - GIROSSOL II: R$ 180,20 (barra vermelha)

**Em Aberto por Usina:**
1. ✅ **Verificar:**
   - GIROSSOL III: R$ 380,00 (barra azul)
   - GIROSSOL II: R$ 175,90 (barra azul)

#### Passo 5.4: Verificar Lista de Usinas
1. Role até o final da página
2. ✅ **Verificar:**
   - Card mostra 2 usinas:
     - GIROSSOL II (Operador: EGS)
     - GIROSSOL III (Operador: EGS)

---

### TESTE 6: Responsividade e Dark Mode

#### Passo 6.1: Testar Dark Mode
1. Clique no ícone de lua/sol no canto inferior esquerdo
2. ✅ **Verificar:**
   - Tema escuro ativa
   - Todos os componentes ficam legíveis
   - Cards, badges e gráficos adaptam cores

#### Passo 6.2: Testar Responsividade
1. Redimensione a janela do navegador
2. ✅ **Verificar:**
   - Menu lateral colapsa em telas pequenas
   - Cards empilham verticalmente
   - Gráficos se ajustam

---

## 🐛 Testes de Erro

### TESTE 7: Instalação Não Encontrada

#### Passo 7.1: Verificar Relatório de Erros
1. Após importar faturas, veja o relatório
2. Clique em **"Instalações não encontradas (4)"**
3. ✅ **Verificar:**
   - Lista mostra:
     - 10/999999-1
     - 10/888888-2
     - (e outras UCs que não existem)

---

## 📊 Checklist Final de Testes

### Funcionalidades Básicas
- [ ] Login funciona
- [ ] Menu de navegação mostra novos itens
- [ ] Ícones corretos (Factory, Database)

### Importação de Base
- [ ] Upload de arquivo CSV funciona
- [ ] Validação detecta problemas
- [ ] Clientes são criados no Firestore
- [ ] Usinas são criadas automaticamente
- [ ] Progresso é exibido corretamente

### Importação de Faturas
- [ ] Upload de arquivo funciona
- [ ] Mapeamento de colunas funciona
- [ ] Auto-detecção de colunas funciona
- [ ] Preview mostra dados corretos
- [ ] **Status overdue é detectado automaticamente**
- [ ] Faturas são adicionadas aos clientes
- [ ] Instalações não encontradas são reportadas

### Visualização de Cliente
- [ ] Painel lateral abre
- [ ] UC aparece em destaque
- [ ] Badge de usina aparece
- [ ] Aba "Visão Geral" mostra dados
- [ ] Aba "Financeiro" mostra faturas
- [ ] Aba "Técnico" mostra dados técnicos
- [ ] Status das faturas está correto (overdue/open)

### Dashboard Operacional
- [ ] Cards de resumo mostram valores corretos
- [ ] Gráfico de inadimplência funciona
- [ ] Gráfico de faturas em aberto funciona
- [ ] Lista de usinas aparece
- [ ] Valores são calculados corretamente

### UI/UX
- [ ] Dark mode funciona
- [ ] Responsividade funciona
- [ ] Animações são suaves
- [ ] Sem erros no console

---

## 🎯 Resultado Esperado

Ao final dos testes, você deve ter:

1. ✅ 3 clientes no Firestore
2. ✅ 2 usinas no Firestore
3. ✅ 4 faturas distribuídas entre 2 clientes
4. ✅ 2 faturas marcadas como **overdue** (vencidas)
5. ✅ 2 faturas marcadas como **open** (em aberto)
6. ✅ Dashboard mostrando métricas corretas
7. ✅ Sistema funcionando sem erros

---

## 🆘 Troubleshooting

### Problema: "Instalação não encontrada"
**Solução:** Certifique-se de que importou a base de clientes ANTES de importar faturas.

### Problema: Faturas não aparecem no cliente
**Solução:** Recarregue a página para atualizar os listeners do Firestore.

### Problema: Status não é "overdue"
**Solução:** Verifique a data do sistema. A data de vencimento deve ser anterior a hoje (09/12/2024).

### Problema: Dashboard não mostra dados
**Solução:** Confirme que há clientes com faturas no sistema.

---

**Bons testes! 🚀**
