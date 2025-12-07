# Guia Prático de Desenvolvimento CRM Client-Side

## 🚀 Passo a Passo de Desenvolvimento

### Pré-requisitos
- Editor de código (VS Code recomendado)
- Navegador moderno (Chrome/Firefox/Safari)
- Conhecimento básico de HTML, CSS e JavaScript

### 1. Estrutura Base do Projeto

#### Criar estrutura de pastas:
```
crm-client-side/
├── index.html
├── css/
│   ├── bootstrap.min.css (CDN)
│   └── custom.css
├── js/
│   ├── jquery.min.js (CDN)
│   ├── bootstrap.min.js (CDN)
│   ├── xlsx.full.min.js (CDN)
│   ├── chart.min.js (CDN)
│   └── app.js
├── data/
│   └── sample-data.json
└── assets/
    └── icons/
```

#### index.html - Estrutura Principal:
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CRM - Gestão de Clientes</title>
    
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Font Awesome -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <!-- Custom CSS -->
    <link href="css/custom.css" rel="stylesheet">
</head>
<body>
    <!-- Navbar Superior -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary fixed-top">
        <div class="container-fluid">
            <a class="navbar-brand" href="#">
                <i class="fas fa-solar-panel me-2"></i>
                CRM Energia Solar
            </a>
            
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav me-auto">
                    <li class="nav-item">
                        <a class="nav-link" href="#" onclick="showSection('dashboard')">
                            <i class="fas fa-tachometer-alt me-1"></i>Dashboard
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#" onclick="showSection('clients')">
                            <i class="fas fa-users me-1"></i>Clientes
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#" onclick="showSection('contracts')">
                            <i class="fas fa-file-contract me-1"></i>Contratos
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#" onclick="showSection('billing')">
                            <i class="fas fa-dollar-sign me-1"></i>Faturamento
                        </a>
                    </li>
                </ul>
                
                <div class="d-flex">
                    <button class="btn btn-outline-light me-2" onclick="importExcel()">
                        <i class="fas fa-upload me-1"></i>Importar Excel
                    </button>
                    <button class="btn btn-outline-light" onclick="exportData()">
                        <i class="fas fa-download me-1"></i>Exportar
                    </button>
                </div>
            </div>
        </div>
    </nav>

    <!-- Container Principal -->
    <div class="container-fluid" style="margin-top: 70px;">
        
        <!-- Seção Dashboard -->
        <div id="dashboard-section" class="section-content">
            <div class="row mb-4">
                <div class="col-12">
                    <h2 class="mb-4">
                        <i class="fas fa-tachometer-alt me-2"></i>Dashboard
                    </h2>
                </div>
            </div>
            
            <!-- KPI Cards -->
            <div class="row mb-4" id="kpi-cards">
                <!-- Cards serão gerados dinamicamente -->
            </div>
            
            <!-- Gráficos -->
            <div class="row">
                <div class="col-lg-8">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title mb-0">Evolução de Clientes</h5>
                        </div>
                        <div class="card-body">
                            <canvas id="clientsChart" height="100"></canvas>
                        </div>
                    </div>
                </div>
                <div class="col-lg-4">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title mb-0">Status dos Contratos</h5>
                        </div>
                        <div class="card-body">
                            <canvas id="statusChart" height="100"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Seção Clientes -->
        <div id="clients-section" class="section-content" style="display: none;">
            <div class="row mb-4">
                <div class="col-md-6">
                    <h2>
                        <i class="fas fa-users me-2"></i>Clientes
                    </h2>
                </div>
                <div class="col-md-6 text-end">
                    <button class="btn btn-primary" onclick="showClientModal()">
                        <i class="fas fa-plus me-1"></i>Novo Cliente
                    </button>
                </div>
            </div>
            
            <!-- Filtros -->
            <div class="card mb-4">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-3">
                            <label class="form-label">Buscar</label>
                            <input type="text" class="form-control" id="searchInput" placeholder="Nome, CPF/CNPJ...">
                        </div>
                        <div class="col-md-2">
                            <label class="form-label">Status</label>
                            <select class="form-select" id="statusFilter">
                                <option value="">Todos</option>
                                <option value="ATIVO">Ativo</option>
                                <option value="INATIVO">Inativo</option>
                                <option value="EM_CANCELAMENTO">Em Cancelamento</option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <label class="form-label">Tipo</label>
                            <select class="form-select" id="typeFilter">
                                <option value="">Todos</option>
                                <option value="PF">Pessoa Física</option>
                                <option value="PJ">Pessoa Jurídica</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Cidade</label>
                            <input type="text" class="form-control" id="cityFilter" placeholder="Cidade">
                        </div>
                        <div class="col-md-2 d-flex align-items-end">
                            <button class="btn btn-outline-secondary w-100" onclick="clearFilters()">
                                <i class="fas fa-times me-1"></i>Limpar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Tabela de Clientes -->
            <div class="card">
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover" id="clientsTable">
                            <thead class="table-light">
                                <tr>
                                    <th>Nome/Razão Social</th>
                                    <th>CPF/CNPJ</th>
                                    <th>Tipo</th>
                                    <th>Status</th>
                                    <th>Cidade</th>
                                    <th>Consumo (kWh)</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody id="clientsTableBody">
                                <!-- Dados serão inseridos via JavaScript -->
                            </tbody>
                        </table>
                    </div>
                    
                    <!-- Paginação -->
                    <nav aria-label="Navegação de páginas">
                        <ul class="pagination justify-content-center" id="pagination">
                            <!-- Paginação será gerada dinamicamente -->
                        </ul>
                    </nav>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal Cliente -->
    <div class="modal fade" id="clientModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="clientModalTitle">Novo Cliente</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form id="clientForm">
                        <div class="row">
                            <div class="col-md-6">
                                <label class="form-label">Nome/Razão Social *</label>
                                <input type="text" class="form-control" id="clientName" required>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">ID Externo</label>
                                <input type="text" class="form-control" id="externalId">
                            </div>
                        </div>
                        <div class="row mt-3">
                            <div class="col-md-6">
                                <label class="form-label">CPF</label>
                                <input type="text" class="form-control" id="cpf" placeholder="000.000.000-00">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">CNPJ</label>
                                <input type="text" class="form-control" id="cnpj" placeholder="00.000.000/0000-00">
                            </div>
                        </div>
                        <!-- Mais campos... -->
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-primary" onclick="saveClient()">Salvar</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Scripts -->
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="js/app.js"></script>
</body>
</html>
```

### 2. CSS Customizado (custom.css)

```css
/* Reset e Variáveis */
:root {
    --primary: #2563eb;
    --success: #10b981;
    --warning: #f59e0b;
    --danger: #ef4444;
    --gray-50: #f8fafc;
    --gray-100: #f1f5f9;
    --gray-600: #475569;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background-color: var(--gray-50);
    color: #1e293b;
}

/* Navbar personalizada */
.navbar-brand {
    font-weight: 700;
    font-size: 1.25rem;
}

/* Cards e KPI */
.kpi-card {
    background: linear-gradient(135deg, var(--primary), #3b82f6);
    color: white;
    border: none;
    transition: transform 0.2s ease;
}

.kpi-card:hover {
    transform: translateY(-2px);
}

.kpi-value {
    font-size: 2.5rem;
    font-weight: 700;
    line-height: 1;
}

.kpi-label {
    font-size: 0.9rem;
    opacity: 0.9;
    margin-top: 0.5rem;
}

.kpi-trend {
    font-size: 0.8rem;
    margin-top: 0.5rem;
}

.kpi-trend.positive {
    color: #86efac;
}

.kpi-trend.negative {
    color: #fca5a5;
}

/* Tabelas */
.table th {
    border-top: none;
    font-weight: 600;
    color: var(--gray-600);
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.table td {
    vertical-align: middle;
    border-color: #e2e8f0;
}

/* Status badges */
.status-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.status-ativo {
    background-color: #dcfce7;
    color: #166534;
}

.status-inativo {
    background-color: #f1f5f9;
    color: #475569;
}

.status-cancelamento {
    background-color: #fef2f2;
    color: #991b1b;
}

/* Formulários */
.form-label {
    font-weight: 500;
    color: #374151;
    margin-bottom: 0.5rem;
}

.form-control:focus,
.form-select:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 0.2rem rgba(37, 99, 235, 0.25);
}

/* Botões */
.btn {
    font-weight: 500;
    border-radius: 0.5rem;
    padding: 0.5rem 1rem;
    transition: all 0.2s ease;
}

.btn:hover {
    transform: translateY(-1px);
}

.btn-primary {
    background-color: var(--primary);
    border-color: var(--primary);
}

.btn-primary:hover {
    background-color: #1d4ed8;
    border-color: #1d4ed8;
}

/* Loading states */
.loading-spinner {
    display: inline-block;
    width: 1rem;
    height: 1rem;
    border: 2px solid #f3f4f6;
    border-radius: 50%;
    border-top-color: var(--primary);
    animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

/* Toast notifications */
.toast-container {
    position: fixed;
    top: 80px;
    right: 20px;
    z-index: 1050;
}

.toast {
    margin-bottom: 0.5rem;
}

/* Responsividade */
@media (max-width: 768px) {
    .kpi-value {
        font-size: 2rem;
    }
    
    .table-responsive {
        font-size: 0.875rem;
    }
    
    .btn {
        padding: 0.375rem 0.75rem;
        font-size: 0.875rem;
    }
}

/* Animações */
.fade-in {
    animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

/* Sidebar para filtros (mobile) */
.filter-sidebar {
    position: fixed;
    top: 70px;
    left: -300px;
    width: 300px;
    height: calc(100vh - 70px);
    background: white;
    box-shadow: 2px 0 10px rgba(0,0,0,0.1);
    z-index: 1040;
    transition: left 0.3s ease;
    padding: 1rem;
}

.filter-sidebar.show {
    left: 0;
}

@media (max-width: 768px) {
    .filter-sidebar {
        width: 100%;
        left: -100%;
    }
}
```

### 3. JavaScript Principal (app.js)

```javascript
// App principal do CRM
class CRMApp {
    constructor() {
        this.clients = [];
        this.contracts = [];
        this.invoices = [];
        this.currentPage = 1;
        this.itemsPerPage = 50;
        this.filteredClients = [];
        
        this.init();
    }
    
    init() {
        this.loadData();
        this.setupEventListeners();
        this.renderDashboard();
        this.renderClients();
    }
    
    // Carregar dados do localStorage
    loadData() {
        const savedData = localStorage.getItem('crmData');
        if (savedData) {
            const data = JSON.parse(savedData);
            this.clients = data.clients || [];
            this.contracts = data.contracts || [];
            this.invoices = data.invoices || [];
        }
        this.filteredClients = [...this.clients];
    }
    
    // Salvar dados no localStorage
    saveData() {
        const data = {
            clients: this.clients,
            contracts: this.contracts,
            invoices: this.invoices,
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem('crmData', JSON.stringify(data));
    }
    
    // Configurar event listeners
    setupEventListeners() {
        // Busca em tempo real
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filterClients();
        });
        
        // Filtros
        document.getElementById('statusFilter').addEventListener('change', () => {
            this.filterClients();
        });
        
        document.getElementById('typeFilter').addEventListener('change', () => {
            this.filterClients();
        });
        
        document.getElementById('cityFilter').addEventListener('input', () => {
            this.filterClients();
        });
    }
    
    // Renderizar Dashboard
    renderDashboard() {
        const totalClients = this.clients.length;
        const activeClients = this.clients.filter(c => c.status === 'ATIVO').length;
        const inactiveClients = this.clients.filter(c => c.status === 'INATIVO').length;
        const totalConsumption = this.clients.reduce((sum, c) => sum + (c.consumoMedio || 0), 0);
        
        const kpiHtml = `
            <div class="col-lg-3 col-md-6 mb-3">
                <div class="card kpi-card h-100">
                    <div class="card-body">
                        <div class="kpi-value">${totalClients}</div>
                        <div class="kpi-label">Total de Clientes</div>
                        <div class="kpi-trend positive">100%</div>
                    </div>
                </div>
            </div>
            <div class="col-lg-3 col-md-6 mb-3">
                <div class="card kpi-card h-100" style="background: linear-gradient(135deg, var(--success), #059669);">
                    <div class="card-body">
                        <div class="kpi-value">${activeClients}</div>
                        <div class="kpi-label">Clientes Ativos</div>
                        <div class="kpi-trend positive">+${((activeClients/totalClients)*100).toFixed(1)}%</div>
                    </div>
                </div>
            </div>
            <div class="col-lg-3 col-md-6 mb-3">
                <div class="card kpi-card h-100" style="background: linear-gradient(135deg, var(--warning), #d97706);">
                    <div class="card-body">
                        <div class="kpi-value">${inactiveClients}</div>
                        <div class="kpi-label">Clientes Inativos</div>
                        <div class="kpi-trend">${((inactiveClients/totalClients)*100).toFixed(1)}%</div>
                    </div>
                </div>
            </div>
            <div class="col-lg-3 col-md-6 mb-3">
                <div class="card kpi-card h-100" style="background: linear-gradient(135deg, #8b5cf6, #7c3aed);">
                    <div class="card-body">
                        <div class="kpi-value">${(totalConsumption/1000).toFixed(1)}k</div>
                        <div class="kpi-label">Consumo Total (MWh)</div>
                        <div class="kpi-trend">${(totalConsumption/this.clients.length).toFixed(0)} kWh/mês</div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('kpi-cards').innerHTML = kpiHtml;
        
        // Renderizar gráficos
        this.renderCharts();
    }
    
    // Renderizar gráficos
    renderCharts() {
        // Gráfico de evolução de clientes
        const ctx1 = document.getElementById('clientsChart').getContext('2d');
        new Chart(ctx1, {
            type: 'line',
            data: {
                labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
                datasets: [{
                    label: 'Clientes Ativos',
                    data: [120, 135, 150, 165, 180, 192],
                    borderColor: 'rgb(37, 99, 235)',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
        
        // Gráfico de status
        const ctx2 = document.getElementById('statusChart').getContext('2d');
        const statusData = this.getStatusData();
        new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: ['Ativo', 'Inativo', 'Cancelamento'],
                datasets: [{
                    data: [statusData.ativo, statusData.inativo, statusData.cancelamento],
                    backgroundColor: [
                        'rgb(16, 185, 129)',
                        'rgb(100, 116, 139)',
                        'rgb(239, 68, 68)'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
    
    getStatusData() {
        return {
            ativo: this.clients.filter(c => c.status === 'ATIVO').length,
            inativo: this.clients.filter(c => c.status === 'INATIVO').length,
            cancelamento: this.clients.filter(c => c.status === 'EM_CANCELAMENTO').length
        };
    }
    
    // Filtrar clientes
    filterClients() {
        const search = document.getElementById('searchInput').value.toLowerCase();
        const status = document.getElementById('statusFilter').value;
        const type = document.getElementById('typeFilter').value;
        const city = document.getElementById('cityFilter').value.toLowerCase();
        
        this.filteredClients = this.clients.filter(client => {
            const matchesSearch = !search || 
                client.name.toLowerCase().includes(search) ||
                (client.cpf && client.cpf.includes(search)) ||
                (client.cnpj && client.cnpj.includes(search));
                
            const matchesStatus = !status || client.status === status;
            const matchesType = !type || client.contractType === type;
            const matchesCity = !city || 
                (client.city && client.city.toLowerCase().includes(city));
                
            return matchesSearch && matchesStatus && matchesType && matchesCity;
        });
        
        this.currentPage = 1;
        this.renderClients();
    }
    
    // Renderizar lista de clientes
    renderClients() {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageClients = this.filteredClients.slice(startIndex, endIndex);
        
        const tbody = document.getElementById('clientsTableBody');
        tbody.innerHTML = '';
        
        pageClients.forEach(client => {
            const row = `
                <tr>
                    <td>
                        <strong>${client.name}</strong><br>
                        <small class="text-muted">ID: ${client.externalId || 'N/A'}</small>
                    </td>
                    <td>
                        ${client.cpf || client.cnpj || 'N/A'}
                    </td>
                    <td>
                        <span class="badge bg-secondary">${client.contractType || 'N/A'}</span>
                    </td>
                    <td>
                        <span class="status-badge status-${client.status?.toLowerCase().replace('_', '-')}">
                            ${client.status || 'N/A'}
                        </span>
                    </td>
                    <td>${client.city || 'N/A'}</td>
                    <td>${client.consumoMedio || 0}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary me-1" onclick="editClient('${client.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteClient('${client.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
        
        this.renderPagination();
    }
    
    // Renderizar paginação
    renderPagination() {
        const totalPages = Math.ceil(this.filteredClients.length / this.itemsPerPage);
        const pagination = document.getElementById('pagination');
        
        let html = '';
        
        // Anterior
        html += `
            <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="crmApp.changePage(${this.currentPage - 1})">Anterior</a>
            </li>
        `;
        
        // Páginas
        for (let i = 1; i <= Math.min(totalPages, 5); i++) {
            html += `
                <li class="page-item ${this.currentPage === i ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="crmApp.changePage(${i})">${i}</a>
                </li>
            `;
        }
        
        // Próximo
        html += `
            <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="crmApp.changePage(${this.currentPage + 1})">Próximo</a>
            </li>
        `;
        
        pagination.innerHTML = html;
    }
    
    // Mudar página
    changePage(page) {
        this.currentPage = page;
        this.renderClients();
    }
    
    // Importar dados do Excel
    async importExcel() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx,.xls';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                const data = await this.readExcelFile(file);
                this.processImportedData(data);
                this.saveData();
                this.renderDashboard();
                this.renderClients();
                
                this.showToast('Dados importados com sucesso!', 'success');
            } catch (error) {
                console.error('Erro ao importar:', error);
                this.showToast('Erro ao importar arquivo Excel', 'error');
            }
        };
        
        input.click();
    }
    
    // Ler arquivo Excel
    readExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    // Processar cada aba
                    const processedData = {};
                    workbook.SheetNames.forEach(sheetName => {
                        const sheet = workbook.Sheets[sheetName];
                        const jsonData = XLSX.utils.sheet_to_json(sheet);
                        processedData[sheetName] = jsonData;
                    });
                    
                    resolve(processedData);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }
    
    // Processar dados importados
    processImportedData(data) {
        // Processar base de clientes
        if (data['BASE DE CLIENTES V1']) {
            this.clients = data['BASE DE CLIENTES V1'].map(row => ({
                id: this.generateId(),
                externalId: row['ID EXTERNO'],
                name: row['NOME COMPLETO OU RAZÃO SOCIAL'],
                contractType: row['TIPO CONTRATO'],
                cpf: row['CPF'],
                cnpj: row['CNPJ'],
                status: row['STATUS DO CLIENTE'],
                email: row['E-MAIL'],
                phone: row['TELEFONE'],
                city: row['CIDADE'],
                state: row['UF'],
                cep: row['CEP'],
                address: row['ENDEREÇO COMPLETO'],
                joinDate: row['DATA DE ADESÃO'],
                discount: row['DESCONTO CONTRATADO'],
                participation: row['PARTICIPAÇÃO DISPONÍVEL'],
                consumoMedio: row['MÉDIA DE CONSUMO MÓVEL KWH']
            }));
        }
    }
    
    // Gerar ID único
    generateId() {
        return 'C' + Date.now() + Math.random().toString(36).substr(2, 9);
    }
    
    // Mostrar toast
    showToast(message, type = 'info') {
        const toastContainer = document.querySelector('.toast-container') || this.createToastContainer();
        
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'primary'} border-0`;
        toast.setAttribute('role', 'alert');
        
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
        
        // Remover toast após ser escondido
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }
    
    // Criar container de toast
    createToastContainer() {
        const container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
        return container;
    }
}

// Funções globais para navegação
function showSection(sectionName) {
    // Esconder todas as seções
    document.querySelectorAll('.section-content').forEach(section => {
        section.style.display = 'none';
    });
    
    // Mostrar seção selecionada
    document.getElementById(sectionName + '-section').style.display = 'block';
    
    // Atualizar navegação ativa
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    event.target.classList.add('active');
}

// Instanciar aplicação
let crmApp;
document.addEventListener('DOMContentLoaded', () => {
    crmApp = new CRMApp();
});

// Funções auxiliares
function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('typeFilter').value = '';
    document.getElementById('cityFilter').value = '';
    crmApp.filterClients();
}

function importExcel() {
    crmApp.importExcel();
}

function exportData() {
    const data = JSON.stringify(crmApp.clients, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clientes_crm.json';
    a.click();
    URL.revokeObjectURL(url);
}

function showClientModal(clientId = null) {
    // Implementar modal de cliente
    const modal = new bootstrap.Modal(document.getElementById('clientModal'));
    modal.show();
}

function saveClient() {
    // Implementar salvamento de cliente
    console.log('Salvando cliente...');
}

function editClient(clientId) {
    showClientModal(clientId);
}

function deleteClient(clientId) {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
        crmApp.clients = crmApp.clients.filter(c => c.id !== clientId);
        crmApp.saveData();
        crmApp.renderClients();
        crmApp.showToast('Cliente excluído com sucesso!', 'success');
    }
}
```

### 4. Como Usar e Configurar

#### A. Importação de Dados:

1. **Salve os dados das planilhas** em formato CSV ou Excel
2. **Clique em "Importar Excel"** no header
3. **Selecione o arquivo** com os dados dos clientes
4. **Aguarde o processamento** automático dos dados
5. **Verifique os dados** importados no Dashboard

#### B. Estrutura de Campos Suportados:

```javascript
// Mapeamento automático dos campos
const fieldMapping = {
    // Base de Clientes V1
    'ID EXTERNO': 'externalId',
    'NOME COMPLETO OU RAZÃO SOCIAL': 'name',
    'TIPO CONTRATO': 'contractType',
    'CPF': 'cpf',
    'CNPJ': 'cnpj',
    'STATUS DO CLIENTE': 'status',
    'E-MAIL': 'email',
    'TELEFONE': 'phone',
    'CIDADE': 'city',
    'UF': 'state',
    'MÉDIA DE CONSUMO MÓVEL KWH': 'consumoMedio'
};
```

#### C. Backup e Sincronização:

1. **Backup Manual**: Clique em "Exportar" para baixar todos os dados
2. **Restore**: Use o "Importar Excel" com dados atualizados
3. **Versionamento**: Os dados são salvos com timestamp no localStorage

### 5. Personalização e Extensão

#### Adicionar Novos Campos:
```javascript
// No processImportedData(), adicione os novos campos:
consumoContratual: row['MÉDIA DE CONSUMO CONTRATUAL KWH'],
dataCancelamento: row['DATA CANCELAMENTO'],
parceiroComercial: row['PARCEIRO COMERCIAL']
```

#### Criar Novos Relatórios:
```javascript
// Adicionar nova seção no HTML
<div id="reports-section" class="section-content" style="display: none;">
    <h2>Relatórios</h2>
    <!-- Conteúdo do relatório -->
</div>

// Adicionar navegação
<li class="nav-item">
    <a class="nav-link" href="#" onclick="showSection('reports')">
        <i class="fas fa-chart-bar me-1"></i>Relatórios
    </a>
</li>
```

#### Integração com APIs Externas:
```javascript
// Exemplo de integração com CEP
async function buscarCEP(cep) {
    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        
        document.getElementById('cidade').value = data.localidade;
        document.getElementById('uf').value = data.uf;
        document.getElementById('endereco').value = data.logradouro;
    } catch (error) {
        console.error('Erro ao buscar CEP:', error);
    }
}
```

### 6. Deploy e Distribuição

#### Opção 1: Arquivo Único
- Combine todos os arquivos CSS e JS inline
- Use CDN para bibliotecas externas
- Embed todas as imagens como base64

#### Opção 2: Estrutura de Pastas
- Mantenha a estrutura modular
- Use IIS, Apache ou servidor web simples
- Ideal para desenvolvimento contínuo

#### Opção 3: PWA (Progressive Web App)
- Adicione manifest.json
- Configure service worker
- Funciona offline

### 7. Monitoramento e Analytics

#### Eventos para Trackear:
- Importações de dados
- Exclusões de clientes
- Filtros mais usados
- Tempo de carregamento

#### Métricas Importantes:
```javascript
// Analytics simples
const analytics = {
    dataImports: 0,
    clientEdits: 0,
    searchesPerformed: 0,
    averageLoadTime: 0
};

function trackEvent(event, data) {
    analytics[event] = (analytics[event] || 0) + 1;
    localStorage.setItem('crmAnalytics', JSON.stringify(analytics));
}
```

Este guia fornece uma base sólida para desenvolver um CRM completo e funcional client-side, com todas as funcionalidades essenciais para gestão de clientes do setor de energia solar.
