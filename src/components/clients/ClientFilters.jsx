/**
 * Componente de Filtros Avançados para Clientes
 * 
 * Permite filtrar clientes por múltiplos critérios:
 * - Status
 * - Projeto
 * - Usina
 * - Estado
 * - Inadimplência
 * - Faturamento
 * - Data de cadastro
 */

import { useState, useEffect } from 'react';
import { Filter, X, Save, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../';
import { cn } from '../../utils/cn';
import { ClientStatus, ProjectStatus, Labels, StatusColors } from '../../types/client.types';

export const ClientFilters = ({ onFilterChange, plants = [], projects = [] }) => {
    const [filters, setFilters] = useState({
        status: 'TODOS',
        projectId: 'TODOS',
        projectStatus: 'TODOS',
        plantId: 'TODOS',
        state: 'TODOS',
        segment: 'TODOS',
        overdue: false,
        minRevenue: '',
        maxRevenue: '',
        dateFrom: '',
        dateTo: '',
        searchTerm: ''
    });

    const [showAdvanced, setShowAdvanced] = useState(false);
    const [savedFilters, setSavedFilters] = useState([]);

    // Aplicar filtros quando mudarem
    useEffect(() => {
        onFilterChange(filters);
    }, [filters, onFilterChange]);

    // Carregar filtros salvos do localStorage
    useEffect(() => {
        const saved = localStorage.getItem('clientFilters');
        if (saved) {
            try {
                setSavedFilters(JSON.parse(saved));
            } catch (e) {
                console.error('Erro ao carregar filtros salvos:', e);
            }
        }
    }, []);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleReset = () => {
        setFilters({
            status: 'TODOS',
            projectId: 'TODOS',
            projectStatus: 'TODOS',
            plantId: 'TODOS',
            state: 'TODOS',
            segment: 'TODOS',
            overdue: false,
            minRevenue: '',
            maxRevenue: '',
            dateFrom: '',
            dateTo: '',
            searchTerm: ''
        });
    };

    const handleSaveFilter = () => {
        const name = prompt('Nome para este filtro:');
        if (!name) return;

        const newFilter = {
            id: Date.now().toString(),
            name,
            filters: { ...filters }
        };

        const updated = [...savedFilters, newFilter];
        setSavedFilters(updated);
        localStorage.setItem('clientFilters', JSON.stringify(updated));
    };

    const handleLoadFilter = (savedFilter) => {
        setFilters(savedFilter.filters);
    };

    const handleDeleteSavedFilter = (filterId) => {
        const updated = savedFilters.filter(f => f.id !== filterId);
        setSavedFilters(updated);
        localStorage.setItem('clientFilters', JSON.stringify(updated));
    };

    // Contar filtros ativos
    const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
        if (key === 'searchTerm') return false; // Não contar busca
        return value !== 'TODOS' && value !== '' && value !== false;
    }).length;

    // Estados brasileiros
    const estados = [
        'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
        'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
        'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
    ];

    return (
        <div className="card">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        Filtros
                    </h3>
                    {activeFiltersCount > 0 && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 rounded-full">
                            {activeFiltersCount}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {activeFiltersCount > 0 && (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleSaveFilter}
                                title="Salvar filtro atual"
                            >
                                <Save className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleReset}
                                title="Limpar todos os filtros"
                            >
                                <Trash2 className="h-4 w-4" />
                                Limpar
                            </Button>
                        </>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                    >
                        {showAdvanced ? (
                            <>
                                <ChevronUp className="h-4 w-4 mr-1" />
                                Ocultar
                            </>
                        ) : (
                            <>
                                <ChevronDown className="h-4 w-4 mr-1" />
                                Avançado
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Filtros Salvos */}
            {savedFilters.length > 0 && (
                <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-800">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        Filtros Salvos:
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {savedFilters.map(savedFilter => (
                            <div
                                key={savedFilter.id}
                                className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm"
                            >
                                <button
                                    onClick={() => handleLoadFilter(savedFilter)}
                                    className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                                >
                                    {savedFilter.name}
                                </button>
                                <button
                                    onClick={() => handleDeleteSavedFilter(savedFilter.id)}
                                    className="text-gray-400 hover:text-red-600"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Filtros Básicos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Status do Cliente */}
                <div>
                    <label className="label">Status do Cliente</label>
                    <select
                        className="input"
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                    >
                        <option value="TODOS">Todos os Status</option>
                        {Object.entries(ClientStatus).map(([key, value]) => (
                            <option key={key} value={value}>
                                {Labels.ClientStatus[value]}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Projeto */}
                <div>
                    <label className="label">Projeto</label>
                    <select
                        className="input"
                        value={filters.projectId}
                        onChange={(e) => handleFilterChange('projectId', e.target.value)}
                    >
                        <option value="TODOS">Todos os Projetos</option>
                        {projects.map(project => (
                            <option key={project.id} value={project.id}>
                                {project.codigo} - {project.nome}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Usina */}
                <div>
                    <label className="label">Usina</label>
                    <select
                        className="input"
                        value={filters.plantId}
                        onChange={(e) => handleFilterChange('plantId', e.target.value)}
                    >
                        <option value="TODOS">Todas as Usinas</option>
                        {plants.map(plant => (
                            <option key={plant.id} value={plant.id}>
                                {plant.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Filtros Avançados */}
            {showAdvanced && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 mt-4 border-t border-gray-200 dark:border-gray-800">
                    {/* Status do Projeto */}
                    <div>
                        <label className="label">Status do Projeto</label>
                        <select
                            className="input"
                            value={filters.projectStatus}
                            onChange={(e) => handleFilterChange('projectStatus', e.target.value)}
                        >
                            <option value="TODOS">Todos os Status</option>
                            {Object.entries(ProjectStatus).map(([key, value]) => (
                                <option key={key} value={value}>
                                    {Labels.ProjectStatus[value]}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Estado */}
                    <div>
                        <label className="label">Estado</label>
                        <select
                            className="input"
                            value={filters.state}
                            onChange={(e) => handleFilterChange('state', e.target.value)}
                        >
                            <option value="TODOS">Todos os Estados</option>
                            {estados.map(estado => (
                                <option key={estado} value={estado}>
                                    {estado}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Segmento */}
                    <div>
                        <label className="label">Segmento</label>
                        <select
                            className="input"
                            value={filters.segment}
                            onChange={(e) => handleFilterChange('segment', e.target.value)}
                        >
                            <option value="TODOS">Todos os Segmentos</option>
                            <option value="RESIDENCIAL">Residencial</option>
                            <option value="COMERCIAL">Comercial</option>
                            <option value="INDUSTRIAL">Industrial</option>
                            <option value="RURAL">Rural</option>
                            <option value="PUBLICO">Público</option>
                        </select>
                    </div>

                    {/* Faturamento Mínimo */}
                    <div>
                        <label className="label">Faturamento Mínimo (R$)</label>
                        <input
                            type="number"
                            className="input"
                            value={filters.minRevenue}
                            onChange={(e) => handleFilterChange('minRevenue', e.target.value)}
                            placeholder="0"
                            min="0"
                            step="100"
                        />
                    </div>

                    {/* Faturamento Máximo */}
                    <div>
                        <label className="label">Faturamento Máximo (R$)</label>
                        <input
                            type="number"
                            className="input"
                            value={filters.maxRevenue}
                            onChange={(e) => handleFilterChange('maxRevenue', e.target.value)}
                            placeholder="∞"
                            min="0"
                            step="100"
                        />
                    </div>

                    {/* Inadimplência */}
                    <div className="flex items-center gap-2 pt-6">
                        <input
                            type="checkbox"
                            id="overdue"
                            checked={filters.overdue}
                            onChange={(e) => handleFilterChange('overdue', e.target.checked)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <label htmlFor="overdue" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                            Apenas clientes inadimplentes
                        </label>
                    </div>

                    {/* Data Cadastro De */}
                    <div>
                        <label className="label">Cadastrado De</label>
                        <input
                            type="date"
                            className="input"
                            value={filters.dateFrom}
                            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                        />
                    </div>

                    {/* Data Cadastro Até */}
                    <div>
                        <label className="label">Cadastrado Até</label>
                        <input
                            type="date"
                            className="input"
                            value={filters.dateTo}
                            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                        />
                    </div>
                </div>
            )}

            {/* Resumo dos Filtros Ativos */}
            {activeFiltersCount > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        Filtros Ativos:
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {filters.status !== 'TODOS' && (
                            <FilterBadge
                                label="Status"
                                value={Labels.ClientStatus[filters.status]}
                                onRemove={() => handleFilterChange('status', 'TODOS')}
                            />
                        )}
                        {filters.projectId !== 'TODOS' && (
                            <FilterBadge
                                label="Projeto"
                                value={projects.find(p => p.id === filters.projectId)?.codigo || filters.projectId}
                                onRemove={() => handleFilterChange('projectId', 'TODOS')}
                            />
                        )}
                        {filters.plantId !== 'TODOS' && (
                            <FilterBadge
                                label="Usina"
                                value={plants.find(p => p.id === filters.plantId)?.name || filters.plantId}
                                onRemove={() => handleFilterChange('plantId', 'TODOS')}
                            />
                        )}
                        {filters.state !== 'TODOS' && (
                            <FilterBadge
                                label="Estado"
                                value={filters.state}
                                onRemove={() => handleFilterChange('state', 'TODOS')}
                            />
                        )}
                        {filters.overdue && (
                            <FilterBadge
                                label="Inadimplentes"
                                value="Sim"
                                onRemove={() => handleFilterChange('overdue', false)}
                            />
                        )}
                        {filters.minRevenue && (
                            <FilterBadge
                                label="Faturamento Mín"
                                value={`R$ ${filters.minRevenue}`}
                                onRemove={() => handleFilterChange('minRevenue', '')}
                            />
                        )}
                        {filters.maxRevenue && (
                            <FilterBadge
                                label="Faturamento Máx"
                                value={`R$ ${filters.maxRevenue}`}
                                onRemove={() => handleFilterChange('maxRevenue', '')}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

/**
 * Badge de filtro ativo
 */
const FilterBadge = ({ label, value, onRemove }) => (
    <div className="flex items-center gap-1 px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded text-xs font-medium">
        <span className="font-semibold">{label}:</span>
        <span>{value}</span>
        <button
            onClick={onRemove}
            className="ml-1 hover:text-primary-900 dark:hover:text-primary-100"
        >
            <X className="h-3 w-3" />
        </button>
    </div>
);
