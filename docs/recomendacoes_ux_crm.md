# Recomendações de UX - CRM Client-Side

## 🎨 Princípios de Design

### 1. Simplicidade e Clareza
- **Navegação Intuitiva**: Menu lateral com ícones claros e texto
- **Hierarquia Visual**: Títulos, subtítulos e conteúdo bem definidos
- **Consistência**: Padrões uniformes em cores, botões e formulários
- **Feedback Visual**: Loading states, success/error messages

### 2. Mobile-First e Responsividade
- **Grid System**: Bootstrap 5 com breakpoints responsivos
- **Touch-Friendly**: Botões com pelo menos 44px de altura
- **Menu Mobile**: Hamburger menu para dispositivos móveis
- **Tabelas Responsivas**: Scroll horizontal em telas pequenas

### 3. Performance e Usabilidade
- **Carregamento Rápido**: Compressão de dados e cache inteligente
- **Paginação**: 50-100 itens por página para não sobrecarregar
- **Busca Instantânea**: Filtros em tempo real sem lag
- **Estados de Carregamento**: Skeleton screens e spinners

## 🎯 Design System

### Paleta de Cores:
```css
:root {
    /* Cores Principais */
    --primary: #2563eb;      /* Azul principal */
    --secondary: #64748b;    /* Cinza secundário */
    --success: #10b981;      /* Verde para sucesso */
    --warning: #f59e0b;      /* Amarelo para alertas */
    --danger: #ef4444;       /* Vermelho para erros */
    --info: #06b6d4;         /* Cyan para informações */
    
    /* Cores de Status */
    --status-ativo: #10b981;      /* Verde */
    --status-inativo: #64748b;    /* Cinza */
    --status-cancelamento: #ef4444; /* Vermelho */
    --status-pendente: #f59e0b;   /* Amarelo */
    
    /* Backgrounds */
    --bg-primary: #ffffff;
    --bg-secondary: #f8fafc;
    --bg-tertiary: #f1f5f9;
    
    /* Textos */
    --text-primary: #1e293b;
    --text-secondary: #64748b;
    --text-muted: #94a3b8;
}
```

### Tipografia:
```css
/* Font Stack */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Hierarquia */
.text-h1 { font-size: 2.5rem; font-weight: 700; line-height: 1.2; }
.text-h2 { font-size: 2rem; font-weight: 600; line-height: 1.3; }
.text-h3 { font-size: 1.5rem; font-weight: 600; line-height: 1.4; }
.text-body { font-size: 1rem; font-weight: 400; line-height: 1.6; }
.text-small { font-size: 0.875rem; font-weight: 400; line-height: 1.5; }
```

### Componentes UI:

#### Cards:
```css
.card {
    background: var(--bg-primary);
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: 1px solid #e2e8f0;
    transition: box-shadow 0.2s ease;
}

.card:hover {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
```

#### Botões:
```css
.btn-primary {
    background: var(--primary);
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    border: none;
    font-weight: 500;
    transition: all 0.2s ease;
}

.btn-primary:hover {
    background: #1d4ed8;
    transform: translateY(-1px);
}
```

## 📱 Layout Responsivo

### Desktop (>1200px):
```
[Sidebar: 250px] [Main Content: calc(100% - 250px)]
├── Header
├── Dashboard/Content Area
└── Modal Overlays
```

### Tablet (768px - 1199px):
```
[Collapsed Sidebar: 80px] [Main Content: calc(100% - 80px)]
├── Header com menu hamburger
├── Dashboard/Content Area
└── Modal Overlays
```

### Mobile (<768px):
```
[Header com menu hamburger]
├── Overlay Sidebar (slide in)
└── Content Area (full width)
```

## 🔍 Padrões de Interação

### 1. Lista de Clientes
**Layout**: Tabela responsiva com ações por linha
**Funcionalidades**:
- Busca em tempo real
- Filtros laterais colapsíveis
- Ordenação por colunas
- Paginação infinita ou tradicional

```html
<!-- Estrutura da Tabela -->
<table class="table table-hover">
    <thead>
        <tr>
            <th>Nome/Razão Social</th>
            <th>CPF/CNPJ</th>
            <th>Status</th>
            <th>Cidade</th>
            <th>Consumo</th>
            <th>Ações</th>
        </tr>
    </thead>
    <tbody>
        <!-- Dados dinâmicos -->
    </tbody>
</table>
```

### 2. Detalhes do Cliente
**Layout**: Modal ou página lateral com abas
**Abas**:
- Dados Pessoais
- Contratos
- Faturamento
- Histórico

### 3. Formulários
**Layout**: Formulário em etapas (wizard)
**Validação**: Em tempo real com feedback visual
**Campos**: Auto-complete e máscaras para CPF/CNPJ

## 📊 Dashboard e Visualizações

### KPIs Cards:
```html
<div class="row">
    <div class="col-md-3 col-sm-6 mb-3">
        <div class="card kpi-card">
            <div class="card-body">
                <div class="kpi-value">192</div>
                <div class="kpi-label">Clientes Ativos</div>
                <div class="kpi-trend positive">+5.2%</div>
            </div>
        </div>
    </div>
</div>
```

### Gráficos:
- **Chart.js** para gráficos interativos
- **Cores consistentes** com o design system
- **Responsivos** e com tooltips informativos
- **Exportáveis** em PNG/PDF

## 🎛️ Filtros e Busca

### Panel de Filtros:
```html
<div class="filter-panel">
    <div class="filter-header">
        <h5>Filtros</h5>
        <button class="btn btn-sm btn-outline-secondary">Limpar</button>
    </div>
    
    <div class="filter-body">
        <div class="filter-group">
            <label>Status</label>
            <select class="form-select">
                <option value="">Todos</option>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
            </select>
        </div>
        
        <div class="filter-group">
            <label>Cidade</label>
            <input type="text" class="form-control" placeholder="Digite a cidade">
        </div>
    </div>
</div>
```

### Busca Global:
- Campo de busca persistente no header
- Busca em tempo real (debounce de 300ms)
- Destaque dos termos encontrados
- Busca avançada com filtros combinados

## 📲 Micro-interações

### Loading States:
- **Skeleton screens** para listas
- **Spinners** para ações
- **Progress bars** para uploads

### Feedback Visual:
- **Toast notifications** para ações
- **Modal confirmations** para ações críticas
- **Hover effects** em botões e links
- **Focus states** acessíveis

### Transições:
- **Smooth scrolling** entre seções
- **Fade in/out** para modais
- **Slide animations** para sidebars
- **Scale animations** para botões

## ♿ Acessibilidade

### Standards:
- **WCAG 2.1 AA** compliance
- **Semantic HTML** com ARIA labels
- **Keyboard navigation** completa
- **Screen reader** compatibility
- **High contrast** mode support

### Implementation:
```html
<!-- Exemplo de button acessível -->
<button 
    class="btn btn-primary"
    aria-label="Editar cliente João Silva"
    tabindex="0"
>
    <i class="fas fa-edit" aria-hidden="true"></i>
    Editar
</button>

<!-- Tabela acessível -->
<table role="table" aria-label="Lista de clientes">
    <thead>
        <tr role="row">
            <th role="columnheader" aria-sort="ascending">
                Nome
                <button aria-label="Ordenar por nome" class="sort-btn">
                    <i class="fas fa-sort" aria-hidden="true"></i>
                </button>
            </th>
        </tr>
    </thead>
</table>
```

## 🚀 Otimizações de Performance

### Loading Strategy:
1. **Critical CSS** inline
2. **Non-critical CSS** assíncrono
3. **JavaScript** modular e lazy-loaded
4. **Images** otimizadas e com lazy loading

### Data Management:
- **Virtual scrolling** para listas grandes
- **Pagination** com cache
- **Debounced** search/filter
- **IndexedDB** para dados grandes (>5MB)

### Caching:
```javascript
// Service Worker para cache offline
const CACHE_NAME = 'crm-v1';
const urlsToCache = [
    '/',
    '/css/styles.css',
    '/js/app.js',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
    );
});
```

## 📐 Grid System e Spacing

### Bootstrap 5 Grid:
```html
<div class="container-fluid">
    <div class="row">
        <div class="col-lg-3 col-md-4 col-sm-6">
            <!-- Card KPI -->
        </div>
    </div>
</div>
```

### Spacing Scale:
```css
/* Padding/Margin */
.p-1 { padding: 0.25rem; }   /* 4px */
.p-2 { padding: 0.5rem; }    /* 8px */
.p-3 { padding: 1rem; }      /* 16px */
.p-4 { padding: 1.5rem; }    /* 24px */
.p-5 { padding: 3rem; }      /* 48px */

.m-1 { margin: 0.25rem; }
.mt-3 { margin-top: 1rem; }
.mb-4 { margin-bottom: 1.5rem; }
```

## 🔄 Estados da Aplicação

### Loading State:
```html
<div class="loading-state">
    <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Carregando...</span>
    </div>
    <p>Carregando dados dos clientes...</p>
</div>
```

### Empty State:
```html
<div class="empty-state">
    <i class="fas fa-users fa-3x text-muted"></i>
    <h4>Nenhum cliente encontrado</h4>
    <p>Ajuste os filtros ou <a href="#">importe novos dados</a></p>
</div>
```

### Error State:
```html
<div class="error-state">
    <i class="fas fa-exclamation-triangle fa-3x text-warning"></i>
    <h4>Erro ao carregar dados</h4>
    <p>Tente novamente ou <a href="#">entre em contato com o suporte</a></p>
    <button class="btn btn-primary">Tentar Novamente</button>
</div>
```
