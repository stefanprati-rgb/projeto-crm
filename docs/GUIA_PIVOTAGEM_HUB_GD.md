# 🚀 Guia de Pivotagem: CRM → Hub de Operação GD

## 📋 Resumo da Implementação

Este documento descreve a pivotagem completa do sistema de CRM para um **Hub de Operação de Geração Distribuída (GD)**, focado em gestão de clientes, usinas e faturas.

---

## ✅ FASE 0: Preparação e Segurança

### Backups Criados
- ✅ `ClientDetailsPanel.old.jsx` - Backup do painel de detalhes original
- ✅ `clientService.old.js` - Backup do serviço de clientes original

### Dependências Verificadas
- ✅ `xlsx` (v0.18.5) - Para leitura de planilhas Excel
- ✅ `date-fns` (v4.1.0) - Para manipulação de datas

### Utilitários Criados
- ✅ `src/utils/formatters.js` - Formatadores para:
  - Moeda (BRL)
  - CPF/CNPJ
  - Telefone
  - CEP
  - Datas
  - Validadores de CPF/CNPJ

---

## ✅ FASE 1: Importador de Base (Clientes e Usinas)

### Arquivos Criados

#### 1. Serviço de Usinas
**Arquivo:** `src/services/plantService.js`
- CRUD completo de usinas
- Método `findOrCreate()` para importação automática
- Listener em tempo real

#### 2. Utilitário de Importação
**Arquivo:** `src/utils/importBaseEGS.js`
- Lê arquivos Excel/CSV
- Mapeamento automático de colunas:
  - `Nome/Razão Social` → `client.name`
  - `CPF/CNPJ` → `client.document`
  - `E-mail` → `client.email`
  - `INSTALACAO` → `client.installationId` (CHAVE CRÍTICA)
  - `USINA` → `client.plantName`
  - `TENSAO`, `MEDIDOR` → Dados técnicos
- Cria usinas automaticamente se não existirem
- Validação de dados antes da importação

#### 3. Componente de Interface
**Arquivo:** `src/components/import/BaseImporter.jsx`
- Upload de arquivo via drag-and-drop
- Validação visual com alertas
- Barra de progresso em tempo real
- Relatório de resultados detalhado

### Como Usar
1. Acesse `/admin` no sistema
2. Selecione a aba "Importar Base de Clientes"
3. Faça upload do arquivo "Infos Clientes.csv"
4. Aguarde a validação
5. Clique em "Importar X Registros"

---

## ✅ FASE 2: Prontuário 360º (Nova UI)

### Arquivo Modificado
**Arquivo:** `src/components/clients/ClientDetailsPanel.jsx`

### Novidades
- **Sistema de Abas:**
  - 📊 **Visão Geral**: Dados cadastrais completos
  - 💰 **Financeiro**: Lista de faturas com status
  - 🔧 **Técnico**: Dados da instalação (UC, tensão, medidor, usina)

- **Destaques Visuais:**
  - Instalação (UC) em destaque logo abaixo do nome
  - Badge da usina com ícone
  - Status colorido das faturas (Pago/Aberto/Vencido)

- **Suporte a Múltiplas Instalações:**
  - Array `client.installations[]` para clientes com mais de uma UC

### Estrutura de Dados do Cliente
```javascript
{
  name: "Nome do Cliente",
  document: "12345678901",
  email: "cliente@email.com",
  phone: "11999999999",
  installationId: "10/908866-7", // UC principal
  installations: ["10/908866-7", "10/123456-1"], // Todas as UCs
  plantName: "GIROSSOL III",
  plantId: "firebase-id",
  voltage: "220V",
  meter: "ABC123",
  invoices: [
    {
      installationId: "10/908866-7",
      amount: 413.36,
      dueDate: "2024-12-10",
      competence: "12/2024",
      status: "overdue", // open, overdue, paid
      createdAt: "2024-12-09T..."
    }
  ]
}
```

---

## ✅ FASE 3: Importador de Faturas

### Arquivos Criados

#### Componente de Importação
**Arquivo:** `src/components/import/InvoiceImporter.jsx`

### Funcionalidades
- **Upload de Excel/CSV** com faturas
- **Mapeamento Interativo de Colunas:**
  - Usuário escolhe qual coluna corresponde a cada campo
  - Auto-detecção inteligente baseada em palavras-chave
  - Preview da primeira linha para validação

- **Colunas Esperadas:**
  - `Instalação` (obrigatório) - UC do cliente
  - `Valor` (obrigatório) - Valor da fatura
  - `Vencimento` (obrigatório) - Data de vencimento
  - `Competência` (opcional) - Mês/Ano de referência

- **Detecção Automática de Status:**
  - ✅ Se `vencimento < hoje` → Status = `overdue` (Vencido)
  - ✅ Se `vencimento >= hoje` → Status = `open` (Aberto)

- **Busca de Clientes:**
  - Busca cliente pela `installationId`
  - Se não encontrar, registra erro
  - Adiciona fatura ao array `client.invoices[]`

### Arquivo de Teste
**Arquivo:** `faturas_exportacao_financeiro.csv`

```csv
Instalação,Valor,Vencimento
10/908866-7,413.36,2024-12-10
10/2344751-9,175.90,2025-01-15
10/908866-7,380.00,2025-01-10
10/999999-1,250.50,2024-11-20
10/888888-2,1500.00,2025-02-05
10/2344751-9,180.20,2024-10-15
```

**Nota:** As faturas com vencimento anterior a hoje (09/12/2024) serão automaticamente marcadas como `overdue`.

### Como Usar
1. Acesse `/admin` no sistema
2. Selecione a aba "Importar Faturas"
3. Faça upload do arquivo CSV/Excel
4. Mapeie as colunas (ou use a detecção automática)
5. Revise o preview
6. Clique em "Importar X Faturas"

---

## ✅ FASE 4: Dashboard Operacional

### Arquivo Criado
**Arquivo:** `src/pages/OperationsDashboard.jsx`

### Funcionalidades

#### Cards de Resumo
- 💵 **Total em Aberto** - Soma de todas as faturas com status `open`
- ⚠️ **Total Vencido** - Soma de todas as faturas com status `overdue`
- ✅ **Total Pago** - Soma de todas as faturas com status `paid`
- 👥 **Clientes com Faturas** - Quantidade de clientes que possuem faturas

#### Inadimplência por Usina
- Gráfico de barras mostrando valor vencido por usina
- Ordenado do maior para o menor
- Cores em vermelho para destacar urgência

#### Faturas em Aberto por Usina
- Gráfico de barras mostrando valor em aberto por usina
- Ordenado do maior para o menor
- Cores em azul

#### Lista de Usinas Cadastradas
- Grid com todas as usinas
- Mostra nome e operador

### Como Acessar
- Rota: `/operacoes`
- Atualização em tempo real via listeners do Firestore

---

## 🗺️ Rotas do Sistema

| Rota | Página | Descrição |
|------|--------|-----------|
| `/` | Dashboard | Dashboard principal (existente) |
| `/clientes` | Clientes | Lista de clientes |
| `/tickets` | Tickets | Sistema de tickets |
| `/relatorios` | Relatórios | Relatórios gerais |
| `/configuracoes` | Configurações | Configurações do sistema |
| **`/admin`** | **Admin** | **Importadores de dados** |
| **`/operacoes`** | **Operações** | **Dashboard operacional GD** |

---

## 📊 Estrutura de Dados no Firestore

### Coleção: `clients`
```javascript
{
  id: "firebase-auto-id",
  name: "Nome do Cliente",
  document: "12345678901", // CPF/CNPJ limpo
  email: "cliente@email.com",
  phone: "11999999999",
  installationId: "10/908866-7", // UC principal
  installations: ["10/908866-7"], // Array de UCs
  plantName: "GIROSSOL III",
  plantId: "plant-firebase-id",
  voltage: "220V",
  meter: "ABC123",
  address: "Rua X, 123",
  city: "São Paulo",
  state: "SP",
  zipCode: "01234567",
  database: "EGS",
  status: "active",
  invoices: [...], // Array de faturas
  createdAt: "2024-12-09T...",
  updatedAt: "2024-12-09T...",
  createdBy: "user-uid",
  createdByEmail: "user@email.com"
}
```

### Coleção: `plants`
```javascript
{
  id: "firebase-auto-id",
  name: "GIROSSOL III",
  operator: "EGS",
  status: "active",
  createdAt: "2024-12-09T...",
  updatedAt: "2024-12-09T...",
  createdBy: "user-uid",
  createdByEmail: "user@email.com"
}
```

---

## 🧪 Como Testar

### 1. Importar Base de Clientes
1. Prepare um arquivo CSV com as colunas: `Nome/Razão Social`, `CPF/CNPJ`, `E-mail`, `INSTALACAO`, `USINA`
2. Acesse `/admin`
3. Faça upload na aba "Importar Base de Clientes"
4. Verifique os logs no console
5. Confirme que clientes e usinas foram criados no Firestore

### 2. Importar Faturas
1. Use o arquivo `faturas_exportacao_financeiro.csv` fornecido
2. Acesse `/admin`
3. Faça upload na aba "Importar Faturas"
4. Mapeie as colunas (ou use auto-detecção)
5. Verifique que:
   - Faturas com vencimento passado estão como `overdue`
   - Faturas futuras estão como `open`
   - Instalações não encontradas aparecem no relatório de erros

### 3. Visualizar Dashboard Operacional
1. Acesse `/operacoes`
2. Verifique os cards de resumo
3. Confirme os gráficos de inadimplência
4. Verifique a lista de usinas

### 4. Visualizar Cliente com Faturas
1. Acesse `/clientes`
2. Clique em um cliente que tenha faturas
3. Vá para a aba "Financeiro"
4. Confirme que as faturas aparecem com status correto

---

## 🎯 Próximos Passos Sugeridos

1. **Adicionar Links de Navegação:**
   - Adicionar "Admin" e "Operações" no menu lateral

2. **Melhorias no Dashboard:**
   - Gráficos mais elaborados (usar Recharts)
   - Filtros por período
   - Exportação de relatórios

3. **Gestão de Faturas:**
   - Marcar fatura como paga
   - Editar/excluir faturas
   - Anexar comprovantes

4. **Notificações:**
   - Alertas de faturas vencendo
   - E-mails automáticos para clientes

5. **Relatórios:**
   - Relatório de inadimplência
   - Relatório de arrecadação
   - Exportação para Excel

---

## 📝 Notas Técnicas

### Performance
- Listeners globais limitados a 500-2000 registros
- Importação em lotes de 400 registros (limite do Firestore)
- Lazy loading de páginas para melhor performance

### Segurança
- Validação de CPF/CNPJ implementada
- Limpeza de dados antes de salvar no Firestore
- Proteção contra campos undefined/null

### Compatibilidade
- Suporte a formatos de data: ISO (YYYY-MM-DD) e BR (DD/MM/YYYY)
- Detecção automática de colunas em diferentes idiomas
- Suporte a Excel (.xlsx, .xls) e CSV

---

## 🐛 Troubleshooting

### Importação não encontra clientes
- Verifique se a coluna `INSTALACAO` está mapeada corretamente
- Confirme que o formato da UC é exatamente igual (ex: "10/908866-7")
- Use a busca no console do navegador para verificar os dados

### Faturas não aparecem no cliente
- Verifique se o array `invoices` existe no documento do cliente
- Confirme que a importação foi bem-sucedida (veja o relatório)
- Recarregue a página para atualizar os listeners

### Dashboard não mostra dados
- Verifique se há clientes com faturas no sistema
- Confirme que os listeners estão ativos (veja console)
- Verifique permissões do Firestore

---

**Implementado em:** 09/12/2024  
**Versão:** 1.0.0  
**Stack:** React + Vite + Firebase + TailwindCSS
