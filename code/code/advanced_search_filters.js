// Sistema avançado de busca e filtros para CRM
class AdvancedSearchManager {
    constructor() {
        this.searchHistory = this.loadSearchHistory();
        this.savedFilters = this.loadSavedFilters();
        this.currentFilters = {};
        this.debounceTimer = null;
    }

    // Configurar interface de busca avançada
    setupAdvancedSearch() {
        const searchContainer = document.getElementById('advanced-search-container');
        
        searchContainer.innerHTML = `
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h6 class="mb-0">
                        <i class="fas fa-search me-2"></i>Busca Avançada
                    </h6>
                    <div>
                        <button class="btn btn-sm btn-outline-primary me-2" onclick="searchManager.saveCurrentFilters()">
                            <i class="fas fa-save me-1"></i>Salvar Filtros
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" onclick="searchManager.clearAllFilters()">
                            <i class="fas fa-times me-1"></i>Limpar
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="row">
                        <!-- Busca textual -->
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Busca Textual</label>
                            <div class="input-group">
                                <input type="text" class="form-control" id="textSearch" 
                                       placeholder="Nome, CPF, CNPJ, Email...">
                                <button class="btn btn-outline-secondary dropdown-toggle" 
                                        type="button" data-bs-toggle="dropdown">
                                    <i class="fas fa-cog"></i>
                                </button>
                                <ul class="dropdown-menu">
                                    <li><a class="dropdown-item" href="#" onclick="searchManager.setSearchMode('exact')">Exata</a></li>
                                    <li><a class="dropdown-item" href="#" onclick="searchManager.setSearchMode('partial')">Parcial</a></li>
                                    <li><a class="dropdown-item" href="#" onclick="searchManager.setSearchMode('fuzzy')">Fuzzy</a></li>
                                </ul>
                            </div>
                        </div>

                        <!-- Status -->
                        <div class="col-md-3 mb-3">
                            <label class="form-label">Status</label>
                            <select class="form-select" id="statusFilter">
                                <option value="">Todos</option>
                                <option value="ATIVO">Ativo</option>
                                <option value="INATIVO">Inativo</option>
                                <option value="EM_CANCELAMENTO">Em Cancelamento</option>
                                <option value="RESCINDIDO">Rescindido</option>
                            </select>
                        </div>

                        <!-- Tipo de Cliente -->
                        <div class="col-md-3 mb-3">
                            <label class="form-label">Tipo</label>
                            <select class="form-select" id="typeFilter">
                                <option value="">Todos</option>
                                <option value="PF">Pessoa Física</option>
                                <option value="PJ">Pessoa Jurídica</option>
                            </select>
                        </div>
                    </div>

                    <div class="row">
                        <!-- Localização -->
                        <div class="col-md-4 mb-3">
                            <label class="form-label">Estado</label>
                            <select class="form-select" id="stateFilter">
                                <option value="">Todos</option>
                                <option value="SP">São Paulo</option>
                                <option value="RJ">Rio de Janeiro</option>
                                <option value="MG">Minas Gerais</option>
                                <!-- Outros estados... -->
                            </select>
                        </div>

                        <div class="col-md-4 mb-3">
                            <label class="form-label">Cidade</label>
                            <input type="text" class="form-control" id="cityFilter" 
                                   placeholder="Digite a cidade">
                        </div>

                        <!-- CEP Range -->
                        <div class="col-md-4 mb-3">
                            <label class="form-label">Faixa de CEP</label>
                            <div class="input-group">
                                <input type="text" class="form-control" id="cepFrom" 
                                       placeholder="00000-000" maxlength="9">
                                <span class="input-group-text">até</span>
                                <input type="text" class="form-control" id="cepTo" 
                                       placeholder="99999-999" maxlength="9">
                            </div>
                        </div>
                    </div>

                    <div class="row">
                        <!-- Consumo -->
                        <div class="col-md-3 mb-3">
                            <label class="form-label">Consumo Mínimo (kWh)</label>
                            <input type="number" class="form-control" id="minConsumption" 
                                   placeholder="0" min="0">
                        </div>

                        <div class="col-md-3 mb-3">
                            <label class="form-label">Consumo Máximo (kWh)</label>
                            <input type="number" class="form-control" id="maxConsumption" 
                                   placeholder="999999" min="0">
                        </div>

                        <!-- Desconto -->
                        <div class="col-md-3 mb-3">
                            <label class="form-label">Desconto Mínimo (%)</label>
                            <input type="number" class="form-control" id="minDiscount" 
                                   placeholder="0" min="0" max="100" step="0.1">
                        </div>

                        <div class="col-md-3 mb-3">
                            <label class="form-label">Desconto Máximo (%)</label>
                            <input type="number" class="form-control" id="maxDiscount" 
                                   placeholder="100" min="0" max="100" step="0.1">
                        </div>
                    </div>

                    <div class="row">
                        <!-- Datas -->
                        <div class="col-md-3 mb-3">
                            <label class="form-label">Data Adesão - De</label>
                            <input type="date" class="form-control" id="joinDateFrom">
                        </div>

                        <div class="col-md-3 mb-3">
                            <label class="form-label">Data Adesão - Até</label>
                            <input type="date" class="form-control" id="joinDateTo">
                        </div>

                        <!-- Parceiro -->
                        <div class="col-md-3 mb-3">
                            <label class="form-label">Parceiro Comercial</label>
                            <input type="text" class="form-control" id="partnerFilter" 
                                   placeholder="Nome do parceiro">
                        </div>

                        <!-- Canal de Entrada -->
                        <div class="col-md-3 mb-3">
                            <label class="form-label">Canal de Entrada</label>
                            <select class="form-select" id="channelFilter">
                                <option value="">Todos</option>
                                <option value="PARCEIRO REVERDE">Parceiro Reverde</option>
                                <option value="INBOUND REVERDE">Inbound Reverde</option>
                                <option value="OUTBOUND">Outbound</option>
                                <option value="ONLINE">Online</option>
                            </select>
                        </div>
                    </div>

                    <!-- Filtros Salvos -->
                    <div class="mt-3">
                        <label class="form-label">Filtros Salvos</label>
                        <div class="d-flex flex-wrap gap-2">
                            <div class="dropdown">
                                <button class="btn btn-outline-secondary btn-sm dropdown-toggle" 
                                        type="button" data-bs-toggle="dropdown">
                                    <i class="fas fa-bookmark me-1"></i>Usar Filtro Salvo
                                </button>
                                <ul class="dropdown-menu" id="savedFiltersList">
                                    <!-- Filtros salvos serão inseridos aqui -->
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.setupEventListeners();
        this.updateSavedFiltersList();
    }

    // Configurar event listeners
    setupEventListeners() {
        const inputs = [
            'textSearch', 'statusFilter', 'typeFilter', 'stateFilter', 'cityFilter',
            'cepFrom', 'cepTo', 'minConsumption', 'maxConsumption', 
            'minDiscount', 'maxDiscount', 'joinDateFrom', 'joinDateTo',
            'partnerFilter', 'channelFilter'
        ];

        inputs.forEach(inputId => {
            const element = document.getElementById(inputId);
            if (element) {
                element.addEventListener('input', () => this.debounceSearch());
                element.addEventListener('change', () => this.debounceSearch());
            }
        });
    }

    // Debounce para busca em tempo real
    debounceSearch() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.performSearch();
        }, 300);
    }

    // Executar busca
    performSearch() {
        const filters = this.collectFilters();
        this.currentFilters = filters;
        
        console.log('Executando busca com filtros:', filters);
        
        // Salvar histórico de busca
        this.saveSearchToHistory(filters);
        
        // Aplicar filtros aos dados
        const results = this.applyFilters(crmApp.clients, filters);
        
        // Atualizar interface
        this.displayResults(results, filters);
    }

    // Coletar filtros da interface
    collectFilters() {
        return {
            textSearch: document.getElementById('textSearch')?.value.trim(),
            textSearchMode: this.searchMode || 'partial',
            status: document.getElementById('statusFilter')?.value,
            type: document.getElementById('typeFilter')?.value,
            state: document.getElementById('stateFilter')?.value,
            city: document.getElementById('cityFilter')?.value.trim(),
            cepFrom: this.parseCEP(document.getElementById('cepFrom')?.value),
            cepTo: this.parseCEP(document.getElementById('cepTo')?.value),
            minConsumption: parseFloat(document.getElementById('minConsumption')?.value) || 0,
            maxConsumption: parseFloat(document.getElementById('maxConsumption')?.value) || Infinity,
            minDiscount: parseFloat(document.getElementById('minDiscount')?.value) || 0,
            maxDiscount: parseFloat(document.getElementById('maxDiscount')?.value) || 100,
            joinDateFrom: document.getElementById('joinDateFrom')?.value,
            joinDateTo: document.getElementById('joinDateTo')?.value,
            partner: document.getElementById('partnerFilter')?.value.trim(),
            channel: document.getElementById('channelFilter')?.value
        };
    }

    // Aplicar filtros aos dados
    applyFilters(data, filters) {
        return data.filter(client => {
            // Busca textual
            if (filters.textSearch) {
                const searchText = filters.textSearch.toLowerCase();
                const clientText = [
                    client.name,
                    client.cpf,
                    client.cnpj,
                    client.email,
                    client.phone,
                    client.city,
                    client.state,
                    client.externalId
                ].filter(Boolean).join(' ').toLowerCase();

                if (filters.textSearchMode === 'exact') {
                    if (!clientText.includes(searchText)) return false;
                } else if (filters.textSearchMode === 'fuzzy') {
                    if (!this.fuzzyMatch(clientText, searchText)) return false;
                } else { // partial
                    if (!clientText.includes(searchText)) return false;
                }
            }

            // Status
            if (filters.status && client.status !== filters.status) {
                return false;
            }

            // Tipo
            if (filters.type && client.contractType !== filters.type) {
                return false;
            }

            // Estado
            if (filters.state && client.state !== filters.state) {
                return false;
            }

            // Cidade
            if (filters.city) {
                if (!client.city || !client.city.toLowerCase().includes(filters.city.toLowerCase())) {
                    return false;
                }
            }

            // CEP
            if (client.cep) {
                const clientCep = this.parseCEP(client.cep);
                if (filters.cepFrom && clientCep < filters.cepFrom) return false;
                if (filters.cepTo && clientCep > filters.cepTo) return false;
            }

            // Consumo
            const consumption = client.consumoMedio || 0;
            if (consumption < filters.minConsumption || consumption > filters.maxConsumption) {
                return false;
            }

            // Desconto
            const discount = client.discount || 0;
            if (discount < filters.minDiscount || discount > filters.maxDiscount) {
                return false;
            }

            // Data de adesão
            if (client.joinDate) {
                const joinDate = new Date(client.joinDate);
                if (filters.joinDateFrom && joinDate < new Date(filters.joinDateFrom)) {
                    return false;
                }
                if (filters.joinDateTo && joinDate > new Date(filters.joinDateTo)) {
                    return false;
                }
            }

            // Parceiro
            if (filters.partner) {
                if (!client.parceiroComercial || 
                    !client.parceiroComercial.toLowerCase().includes(filters.partner.toLowerCase())) {
                    return false;
                }
            }

            // Canal
            if (filters.channel && client.canalEntrada !== filters.channel) {
                return false;
            }

            return true;
        });
    }

    // Busca fuzzy simples
    fuzzyMatch(text, search) {
        const searchChars = search.split('');
        let matchIndex = 0;
        
        for (let char of text) {
            if (char === searchChars[matchIndex]) {
                matchIndex++;
                if (matchIndex === searchChars.length) {
                    return true;
                }
            }
        }
        return false;
    }

    // Parse CEP
    parseCEP(cep) {
        if (!cep) return null;
        return parseInt(cep.replace(/\D/g, ''));
    }

    // Exibir resultados
    displayResults(results, filters) {
        // Atualizar dados na aplicação
        crmApp.filteredClients = results;
        crmApp.currentPage = 1;
        crmApp.renderClients();
        
        // Atualizar contadores
        this.updateSearchStats(results, filters);
    }

    // Atualizar estatísticas de busca
    updateSearchStats(results, filters) {
        const statsHtml = `
            <div class="alert alert-info d-flex justify-content-between align-items-center">
                <div>
                    <strong>${results.length}</strong> resultado(s) encontrado(s)
                    ${filters.textSearch ? ` para "${filters.textSearch}"` : ''}
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-sm btn-outline-primary" onclick="searchManager.exportResults()">
                        <i class="fas fa-download me-1"></i>Exportar
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" onclick="searchManager.saveCurrentFilters()">
                        <i class="fas fa-bookmark me-1"></i>Salvar Filtro
                    </button>
                </div>
            </div>
        `;

        const statsContainer = document.getElementById('search-stats');
        if (statsContainer) {
            statsContainer.innerHTML = statsHtml;
        }
    }

    // Salvar filtros atuais
    saveCurrentFilters() {
        const filters = this.collectFilters();
        const name = prompt('Nome para este filtro:');
        
        if (name) {
            this.savedFilters.push({
                id: Date.now().toString(),
                name: name,
                filters: filters,
                createdAt: new Date().toISOString()
            });
            
            this.saveFilters();
            this.updateSavedFiltersList();
            
            crmApp.showToast('Filtro salvo com sucesso!', 'success');
        }
    }

    // Carregar filtro salvo
    loadSavedFilter(filterId) {
        const savedFilter = this.savedFilters.find(f => f.id === filterId);
        if (savedFilter) {
            this.applyFiltersToUI(savedFilter.filters);
            this.performSearch();
            crmApp.showToast(`Filtro "${savedFilter.name}" carregado!`, 'success');
        }
    }

    // Aplicar filtros salvos na UI
    applyFiltersToUI(filters) {
        const fieldMappings = {
            'textSearch': 'textSearch',
            'status': 'statusFilter',
            'type': 'typeFilter',
            'state': 'stateFilter',
            'city': 'cityFilter',
            'partner': 'partnerFilter',
            'channel': 'channelFilter'
        };

        for (const [filterKey, uiKey] of Object.entries(fieldMappings)) {
            const element = document.getElementById(uiKey);
            if (element && filters[filterKey]) {
                element.value = filters[filterKey];
            }
        }

        // Campos numéricos e datas
        if (filters.minConsumption) document.getElementById('minConsumption').value = filters.minConsumption;
        if (filters.maxConsumption && filters.maxConsumption !== Infinity) document.getElementById('maxConsumption').value = filters.maxConsumption;
        if (filters.minDiscount) document.getElementById('minDiscount').value = filters.minDiscount;
        if (filters.maxDiscount && filters.maxDiscount !== 100) document.getElementById('maxDiscount').value = filters.maxDiscount;
        if (filters.joinDateFrom) document.getElementById('joinDateFrom').value = filters.joinDateFrom;
        if (filters.joinDateTo) document.getElementById('joinDateTo').value = filters.joinDateTo;
    }

    // Limpar todos os filtros
    clearAllFilters() {
        const inputs = [
            'textSearch', 'statusFilter', 'typeFilter', 'stateFilter', 'cityFilter',
            'cepFrom', 'cepTo', 'minConsumption', 'maxConsumption', 
            'minDiscount', 'maxDiscount', 'joinDateFrom', 'joinDateTo',
            'partnerFilter', 'channelFilter'
        ];

        inputs.forEach(inputId => {
            const element = document.getElementById(inputId);
            if (element) {
                element.value = '';
            }
        });

        this.currentFilters = {};
        this.performSearch();
    }

    // Definir modo de busca
    setSearchMode(mode) {
        this.searchMode = mode;
        this.performSearch();
    }

    // Atualizar lista de filtros salvos
    updateSavedFiltersList() {
        const list = document.getElementById('savedFiltersList');
        if (list && this.savedFilters.length > 0) {
            list.innerHTML = this.savedFilters.map(filter => `
                <li>
                    <a class="dropdown-item d-flex justify-content-between align-items-center" 
                       href="#" onclick="searchManager.loadSavedFilter('${filter.id}')">
                        <span>${filter.name}</span>
                        <small class="text-muted">
                            ${new Date(filter.createdAt).toLocaleDateString()}
                            <button class="btn btn-sm btn-link text-danger ms-2" 
                                    onclick="searchManager.deleteSavedFilter('${filter.id}', event)">
                                <i class="fas fa-trash"></i>
                            </button>
                        </small>
                    </a>
                </li>
            `).join('');
        } else if (list) {
            list.innerHTML = '<li><span class="dropdown-item-text text-muted">Nenhum filtro salvo</span></li>';
        }
    }

    // Deletar filtro salvo
    deleteSavedFilter(filterId, event) {
        event.stopPropagation();
        
        if (confirm('Deseja excluir este filtro?')) {
            this.savedFilters = this.savedFilters.filter(f => f.id !== filterId);
            this.saveFilters();
            this.updateSavedFiltersList();
            crmApp.showToast('Filtro excluído!', 'success');
        }
    }

    // Exportar resultados
    exportResults() {
        if (crmApp.filteredClients.length === 0) {
            crmApp.showToast('Nenhum resultado para exportar!', 'warning');
            return;
        }

        const csv = this.convertToCSV(crmApp.filteredClients);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `clientes_filtrados_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    // Converter para CSV
    convertToCSV(data) {
        const headers = [
            'ID Externo', 'Nome/Razão Social', 'Tipo', 'Status', 'CPF/CNPJ',
            'Email', 'Telefone', 'Cidade', 'UF', 'CEP', 'Consumo (kWh)', 'Desconto (%)'
        ];

        const rows = data.map(client => [
            client.externalId || '',
            client.name || '',
            client.contractType || '',
            client.status || '',
            client.cpf || client.cnpj || '',
            client.email || '',
            client.phone || '',
            client.city || '',
            client.state || '',
            client.cep || '',
            client.consumoMedio || '0',
            client.discount || '0'
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    // Salvar histórico de busca
    saveSearchToHistory(filters) {
        const searchEntry = {
            filters: filters,
            timestamp: Date.now(),
            resultCount: crmApp.filteredClients.length
        };

        this.searchHistory.unshift(searchEntry);
        
        // Manter apenas os últimos 10
        this.searchHistory = this.searchHistory.slice(0, 10);
        
        this.saveSearchHistory();
    }

    // Gerenciamento de localStorage
    loadSearchHistory() {
        try {
            return JSON.parse(localStorage.getItem('crmSearchHistory')) || [];
        } catch {
            return [];
        }
    }

    loadSavedFilters() {
        try {
            return JSON.parse(localStorage.getItem('crmSavedFilters')) || [];
        } catch {
            return [];
        }
    }

    saveSearchHistory() {
        localStorage.setItem('crmSearchHistory', JSON.stringify(this.searchHistory));
    }

    saveFilters() {
        localStorage.setItem('crmSavedFilters', JSON.stringify(this.savedFilters));
    }
}

// Instância global
let searchManager;

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    searchManager = new AdvancedSearchManager();
});
