# Plano de Refatoração do Banco de Dados (Firestore)

## 1. Visão Geral e Motivação
Atualmente, o projeto utiliza um modelo de "Documento Único" na coleção de clientes, onde os dados da unidade consumidora, onboarding, financeiro e histórico de eventos residem em um único objeto massivo. Este modelo atendeu à fase de MVP Front-end, mas apresenta limitações de escalabilidade, segurança e limites do Firestore (1MB por documento) a longo prazo.

**Objetivo:** Migrar para uma arquitetura de coleções relacionais (NoSQL com referências diretas), separando escopos de domínio, permitindo regras de segurança mais granulares e facilitando o monitoramento e processamento assíncrono via Cloud Functions.

## 2. Nova Arquitetura de Coleções

A migração segregará o "Documento Único" nas seguintes coleções principais, conectadas por referências (IDs):

### `clientes` (Clients)
Armazena estritamente os dados cadastrais (PII, documentos) e o estado global da conta empresarial.

**Schema:**
```typescript
{
  id: string;             // Document ID
  database: string;       // Tenancy ID
  name: string;           // Nome/Razão Social
  document: string;       // CPF/CNPJ
  contactInfo: {
    email: string;
    phone: string;
  };
  status: 'active' | 'inactive';
  createdBy: string;      // User UID
  createdAt: timestamp;
  updatedAt: timestamp;
}
```

### `instalacoes` (Installations / UCs)
Armazena os dados das Unidades Consumidoras. Um cliente pode possuir múltiplas instalações.

**Schema:**
```typescript
{
  id: string;               // Document ID
  clienteId: string;        // Referência (Foreign Key) para clientes/{id}
  database: string;         // Tenancy ID
  uc: string;               // Código da Instalação/UC
  distributor: string;      // (CEMIG, ENEL, etc)
  energyClass: string;      
  modalidadeTarifaria: string; // Ex: Convencional, Branca, etc.
  classeConsumo: string;       // Ex: B1_RESIDENCIAL
  enderecoUC: string;          // Endereço completo da UC
  onboarding: {             // Estado da Instalação no Funil
    pipelineStatus: 'new' | 'waiting_apportionment' | 'sent_to_apportionment' | 'apportionment_done' | 'waiting_compensation' | 'invoiced';
    compensationForecastDate: timestamp;
  };
  portalCredentialId?: string; // ID seguro da credencial armazenada (referência indireta para Secret Manager/Backend)
  createdAt: timestamp;
  updatedAt: timestamp;
}
```

### `historico_rateios` (Apportionment History)
Armazena o log imutável de recebimento, processamento e aprovação dos rateios (Excel enviado/processado por instalação).

**Schema:**
```typescript
{
  id: string;               // Document ID
  instalacaoId: string;     // Referência à Instalação onde o rateio foi aplicado
  clienteId: string;        // Opcional, para facilitar queries diretas na UI
  usinaId: string;          // Identificador (ou Nome) da Usina injetora
  consorcio: string;        // Consórcio ou Cooperativa responsável
  database: string;
  competencia: string;      // Ex: "02/2026"
  percentual: number;       // Percentual aplicado
  status: 'enviado_concessionaria' | 'aprovado_aguardando_injecao' | 'injetado' | 'reprovado' | 'pendente_correcao';
  processedBy: string;      // Usuário que importou ou 'System'
  createdAt: timestamp;
}
```

### `cobrancas_chamados` (Billing & Agreements)
Armazena o histórico de cobranças, negociações e acordos com o cliente. O status de pendências nesta coleção servirá para travar o avanço das UCs na esteira de onboarding de Geração Distribuída.

**Schema:**
```typescript
{
  id: string;               // Document ID
  clienteId: string;        // Referência (Foreign Key) para clientes/{id}
  database: string;         // Tenancy ID
  tipo: 'cobranca_mensal' | 'acordo_parcelamento' | 'multa_rescisoria';
  status: 'aberta' | 'em_negociacao' | 'paga' | 'inadimplente' | 'cancelada';
  valorTotal: number;
  dataVencimento: timestamp;
  dataPagamento?: timestamp;
  anexos?: string[];        // Links para boletos/comprovantes
  observacoes: string;
  createdBy: string;        // Usuário do sistema
  createdAt: timestamp;
  updatedAt: timestamp;
}
```

## 3. Estratégia de Transição (Phased Approach)

Para garantir que a operação atual e a UI não quebrem de uma vez, a transição ocorrerá gradualmente:

### FASE 1: Setup Backend e Enums (Atual)
1. **Frontend**: Limpeza e padronização (implementação dos Enums de pipeline no lugar de strings soltas).
2. **Backend**: Inicialização do Firebase Cloud Functions, permitindo mover lógica sensível para lá.

### FASE 2: Escrita Dupla (Dual-Write)
1. Criar Triggers no Firestore (`onWrite` e `onCreate`). Coda vez que o frontend modificar um cliente (modelo legado), as funções atualizam/criam assincronamente os registros correspondentes na nova coleção de `instalacoes` e `historico_rateios`.
2. O Front-end continua lendo e escrevendo no objeto raiz (sem impacto visual).

### FASE 3: Enriquecimento Assíncrono e Backfill
1. Criar scripts utilitários isolados para gerar as tabelas relacionais do legado inteiro.
2. Homologar os dados cruzando relatórios legacy vs novos.

### FASE 4: Virada de Chave (Cutover UI e Refatoração Limpa)
1. Refatorar hooks (`clientService.js`) e queries da UI (como o `OnboardingPipelinePage.jsx`) para lerem e formatarem dados vindos primariamente das coleções refatoradas (`instalacoes`).
2. Remover as antigas lógicas de nested objects e travar as security rules do Firestore para que updates na raiz do `/clientes` não sobrescrevam mais os dados das faturas/rateios, isolando assim o "Hardening Financeiro".
