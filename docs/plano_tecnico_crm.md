# Plano Técnico - CRM Client-Side

## 🎯 Objetivo
Desenvolver um CRM completo em arquivo único HTML+JS para gestão de clientes do setor de energia solar, com importação de dados das planilhas Excel fornecidas.

## 📋 Tecnologias e Bibliotecas Recomendadas

### Core Technologies:
- **HTML5 + CSS3 + JavaScript ES6+**
- **Framework CSS**: Bootstrap 5 ou Tailwind CSS (CDN)
- ** Ícones**: Font Awesome ou Lucide Icons

### Bibliotecas Específicas para Excel:
- **SheetJS (xlsx.js)** - Leitura/escrita de arquivos Excel
  ```html
  <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
  ```
- **PapaParse** - Para CSV fallback
- **FileSaver.js** - Para download de dados

### Storage e Performance:
- **LocalStorage** - Para cache dos dados
- **IndexedDB** - Para dados mais volumosos (opcional)
- **DataTables** - Para tabelas avançadas com filtros/ordenação

## 🏗️ Estrutura do Aplicativo

### Layout Principal:
```
┌─────────────────────────────────────────────────────┐
│                    HEADER                           │
│  Logo | Título CRM | [Importar] [Configurações]    │
├─────────────────────────────────────────────────────┤
│ NAVBAR │ CONTEÚDO PRINCIPAL                         │
│ • Clientes│                                         │
│ • Contratos│           ÁREA DE DADOS               │
│ • Faturamento│                                      │
│ • Relatórios│                                      │
│ • Dashboard│                                       │
└─────────────────────────────────────────────────────┘
```

### Funcionalidades por Seção:

#### 1. DASHBOARD
- Cards com KPIs principais:
  - Total de Clientes Ativos
  - Faturamento do Mês
  - Taxa de Inadimplência
  - Consumo Médio
- Gráficos com Chart.js:
  - Evolução de Clientes
  - Faturamento por Mês
  - Status dos Contratos

#### 2. CLIENTES
- **Lista**: Tabela com filtros, busca, paginação
- **Detalhes**: Modal com todas as informações do cliente
- **Edição**: Formulário para atualizar dados
- **Novo Cliente**: Formulário de cadastro

#### 3. CONTRATOS
- **Lista de Contratos** por cliente
- **Status**: Ativo, Inativo, Em Cancelamento
- **Detalhes Contratuais**: Tipo, Desconto, Participação

#### 4. FATURAMENTO
- **Histórico por Cliente**
- **Controle de Inadimplência**
- **Relatórios Mensais**

#### 5. RELATÓRIOS
- **Indicadores Operacionais**
- **Vacância Comercial**
- **Análise de Performance**

## 🔧 Implementação Técnica

### Estrutura de Arquivos:
```
crm-client-side/
├── index.html              # Arquivo principal
├── css/
│   └── styles.css          # Estilos customizados
├── js/
│   ├── app.js             # Lógica principal
│   ├── data-manager.js    # Gerenciamento de dados
│   ├── excel-import.js    # Importação Excel
│   ├── utils.js           # Utilitários
│   └── charts.js          # Gráficos
└── data/
    └── template.csv       # Template para dados
```

### Módulos JavaScript:

#### data-manager.js:
```javascript
class DataManager {
    constructor() {
        this.clients = [];
        this.contracts = [];
        this.invoices = [];
        this.loadData();
    }
    
    // Carregar dados do localStorage
    loadData() {
        const data = localStorage.getItem('crmData');
        if (data) {
            const parsed = JSON.parse(data);
            this.clients = parsed.clients || [];
            this.contracts = parsed.contracts || [];
            this.invoices = parsed.invoices || [];
        }
    }
    
    // Salvar dados no localStorage
    saveData() {
        localStorage.setItem('crmData', JSON.stringify({
            clients: this.clients,
            contracts: this.contracts,
            invoices: this.invoices
        }));
    }
    
    // Importar dados do Excel
    async importFromExcel(file) {
        // Implementação com SheetJS
    }
}
```

#### excel-import.js:
```javascript
class ExcelImporter {
    static async importFile(file, sheetName) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, {type: 'array'});
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet);
                resolve(jsonData);
            };
            reader.readAsArrayBuffer(file);
        });
    }
}
```

## 📊 Mapeamento de Dados

### Importação das Planilhas:

#### BASE DE CLIENTES V1 → Clientes:
```javascript
const clientMapping = {
    'ID EXTERNO': 'externalId',
    'NOME COMPLETO OU RAZÃO SOCIAL': 'name',
    'CPF': 'cpf',
    'CNPJ': 'cnpj',
    'TIPO CONTRATO': 'contractType',
    'STATUS DO CLIENTE': 'status',
    'E-MAIL': 'email',
    'TELEFONE': 'phone',
    'CIDADE': 'city',
    'UF': 'state',
    'CEP': 'cep',
    'ENDEREÇO COMPLETO': 'address',
    'DATA DE ADESÃO': 'joinDate',
    'DESCONTO CONTRATADO': 'discount',
    'PARTICIPAÇÃO DISPONÍVEL': 'participation'
};
```

#### MODELO CAD PORTAL GD → Contratos + Usinas:
```javascript
const contractMapping = {
    'ID Externo': 'externalId',
    'Tipo Contrato': 'contractType',
    'Data Assinatura': 'signatureDate',
    'Desconto (%)': 'discount',
    'Participação (kWh)': 'participation',
    'Id Externo - Usina': 'plantId',
    'Nome - Usina': 'plantName',
    'Início Operação - Usina': 'operationStart'
};
```

## 🚀 Fluxo de Desenvolvimento

### Fase 1: Setup e Estrutura Base
1. Criar estrutura HTML com Bootstrap
2. Implementar navegação entre seções
3. Configurar localStorage para dados
4. Layout responsivo

### Fase 2: Importação de Dados
1. Implementar upload de Excel
2. Mapeamento automático dos campos
3. Validação e limpeza dos dados
4. Armazenamento no localStorage

### Fase 3: Funcionalidades Core
1. Lista de Clientes com filtros
2. Detalhes do Cliente
3. Edição de dados
4. Busca avançada

### Fase 4: Relatórios e Dashboard
1. KPIs e métricas
2. Gráficos com Chart.js
3. Relatórios exportáveis
4. Indicadores visuais

### Fase 5: Otimização
1. Paginação de resultados
2. Cache inteligente
3. Performance com grandes volumes
4. UI/UX refinamentos

## 💡 Funcionalidades Especiais

### 1. Sistema de Filtros Avançados:
- Por Status (Ativo, Inativo, Em Cancelamento)
- Por Tipo de Contrato (PF, PJ)
- Por Cidade/UF
- Por Faixa de Consumo
- Por Período de Adesão

### 2. Alertas e Notificações:
- Clientes com faturas em atraso
- Contratos próximos ao vencimento
- Alterações de status importantes

### 3. Exportação de Dados:
- Relatórios em Excel
- Listas filtradas em CSV
- Dashboard em PDF

### 4. Backup e Sincronização:
- Exportar toda base de dados
- Importar dados atualizados
- Versionamento dos dados

## 🔒 Segurança e Performance

### Dados Locais:
- Todos os dados ficam no navegador (localStorage)
- Possibilidade de backup manual
- Sem backend necessário

### Otimizações:
- Paginação de resultados (100 itens por página)
- Lazy loading de dados
- Indexação para buscas rápidas
- Compressão de dados armazenados

### Responsividade:
- Mobile-first design
- Tabelas responsivas com scroll horizontal
- Menu colapsível em mobile
- Formulários adaptáveis

## 📱 Compatibilidade
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)
