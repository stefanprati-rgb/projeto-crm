/**
 * Hook de Busca Avançada para Clientes
 * 
 * Permite buscar clientes por múltiplos campos:
 * - Nome
 * - Email
 * - Telefone
 * - CPF/CNPJ
 * - Código de projeto
 * - UC (Unidade Consumidora)
 * - Nome de usina
 * - Número de série de equipamento
 */

import { useState, useEffect, useMemo } from 'react';

export const useAdvancedSearch = (clients, filters = {}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Debounce da busca (300ms)
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Aplicar busca e filtros
    const filteredClients = useMemo(() => {
        let result = [...clients];

        // ─────────────────────────────────────────────────────────
        // APLICAR BUSCA
        // ─────────────────────────────────────────────────────────
        if (debouncedSearch && debouncedSearch.length >= 2) {
            const term = debouncedSearch.toLowerCase().trim();

            result = result.filter(client => {
                // Busca no nome
                if (client.nome?.toLowerCase().includes(term)) return true;
                if (client.nomeFantasia?.toLowerCase().includes(term)) return true;

                // Busca no email
                if (client.email?.toLowerCase().includes(term)) return true;

                // Busca em contatos
                if (client.contatos?.some(c =>
                    c.nome?.toLowerCase().includes(term) ||
                    c.email?.toLowerCase().includes(term)
                )) return true;

                // Busca no telefone (remove formatação)
                const cleanTerm = term.replace(/\D/g, '');
                if (client.phone?.replace(/\D/g, '').includes(cleanTerm)) return true;
                if (client.telefone?.replace(/\D/g, '').includes(cleanTerm)) return true;

                // Busca no CPF/CNPJ (remove formatação)
                if (client.cnpj?.replace(/\D/g, '').includes(cleanTerm)) return true;
                if (client.cpf?.replace(/\D/g, '').includes(cleanTerm)) return true;
                if (client.document?.replace(/\D/g, '').includes(cleanTerm)) return true;

                // Busca em projetos
                if (client.projetos?.some(p =>
                    p.codigo?.toLowerCase().includes(term) ||
                    p.nome?.toLowerCase().includes(term)
                )) return true;

                // Busca em instalações (UC)
                if (client.instalacoes?.some(i =>
                    i.uc?.includes(term)
                )) return true;

                // Campos legados de instalação
                if (client.installationId?.includes(term)) return true;
                if (client.installations?.some(uc => uc.includes(term))) return true;

                // Busca em usinas
                if (client.instalacoes?.some(i =>
                    i.usinaName?.toLowerCase().includes(term)
                )) return true;
                if (client.plantName?.toLowerCase().includes(term)) return true;

                // Busca em equipamentos
                if (client.equipamentos?.some(e =>
                    e.numeroSerie?.toLowerCase().includes(term) ||
                    e.marca?.toLowerCase().includes(term) ||
                    e.modelo?.toLowerCase().includes(term)
                )) return true;

                // Busca no endereço
                if (client.endereco?.cidade?.toLowerCase().includes(term)) return true;
                if (client.endereco?.estado?.toLowerCase().includes(term)) return true;
                if (client.city?.toLowerCase().includes(term)) return true;
                if (client.state?.toLowerCase().includes(term)) return true;

                return false;
            });
        }

        // ─────────────────────────────────────────────────────────
        // APLICAR FILTROS
        // ─────────────────────────────────────────────────────────

        // Filtro por status
        if (filters.status && filters.status !== 'TODOS') {
            result = result.filter(c => c.status === filters.status);
        }

        // Filtro por projeto
        if (filters.projectId && filters.projectId !== 'TODOS') {
            result = result.filter(c =>
                c.projetos?.some(p => p.id === filters.projectId)
            );
        }

        // Filtro por status de projeto
        if (filters.projectStatus && filters.projectStatus !== 'TODOS') {
            result = result.filter(c =>
                c.projetos?.some(p => p.status === filters.projectStatus)
            );
        }

        // Filtro por usina
        if (filters.plantId && filters.plantId !== 'TODOS') {
            result = result.filter(c => {
                // Novo sistema
                if (c.instalacoes?.some(i => i.usinaId === filters.plantId)) return true;
                // Sistema legado
                if (c.plantId === filters.plantId) return true;
                return false;
            });
        }

        // Filtro por estado
        if (filters.state && filters.state !== 'TODOS') {
            result = result.filter(c => {
                // Novo sistema
                if (c.endereco?.estado === filters.state) return true;
                // Sistema legado
                if (c.state === filters.state) return true;
                return false;
            });
        }

        // Filtro por segmento
        if (filters.segment && filters.segment !== 'TODOS') {
            result = result.filter(c => c.segmento === filters.segment);
        }

        // Filtro por inadimplência
        if (filters.overdue) {
            result = result.filter(c => {
                // Novo sistema
                if (c.faturamento?.inadimplente === true) return true;
                // Sistema legado - verificar faturas vencidas
                if (c.invoices?.some(inv => inv.status === 'overdue')) return true;
                if (c.faturas?.some(fat => fat.status === 'VENCIDO')) return true;
                return false;
            });
        }

        // Filtro por faturamento mínimo
        if (filters.minRevenue && filters.minRevenue !== '') {
            const minValue = parseFloat(filters.minRevenue);
            result = result.filter(c => {
                const total = c.faturamento?.totalFaturado || 0;
                return total >= minValue;
            });
        }

        // Filtro por faturamento máximo
        if (filters.maxRevenue && filters.maxRevenue !== '') {
            const maxValue = parseFloat(filters.maxRevenue);
            result = result.filter(c => {
                const total = c.faturamento?.totalFaturado || 0;
                return total <= maxValue;
            });
        }

        // Filtro por data de cadastro (de)
        if (filters.dateFrom) {
            const dateFrom = new Date(filters.dateFrom);
            result = result.filter(c => {
                if (!c.createdAt) return false;
                const createdDate = new Date(c.createdAt);
                return createdDate >= dateFrom;
            });
        }

        // Filtro por data de cadastro (até)
        if (filters.dateTo) {
            const dateTo = new Date(filters.dateTo);
            dateTo.setHours(23, 59, 59, 999); // Fim do dia
            result = result.filter(c => {
                if (!c.createdAt) return false;
                const createdDate = new Date(c.createdAt);
                return createdDate <= dateTo;
            });
        }

        return result;
    }, [clients, debouncedSearch, filters]);

    // Calcular métricas dos resultados
    const metrics = useMemo(() => {
        const total = filteredClients.length;
        const ativos = filteredClients.filter(c => c.status === 'ATIVO' || c.status === 'active').length;
        const inativos = filteredClients.filter(c => c.status === 'INATIVO' || c.status === 'inactive').length;

        const comProjetos = filteredClients.filter(c =>
            c.projetos && c.projetos.length > 0
        ).length;

        const inadimplentes = filteredClients.filter(c => {
            if (c.faturamento?.inadimplente) return true;
            if (c.invoices?.some(inv => inv.status === 'overdue')) return true;
            if (c.faturas?.some(fat => fat.status === 'VENCIDO')) return true;
            return false;
        }).length;

        const totalFaturamento = filteredClients.reduce((sum, c) => {
            return sum + (c.faturamento?.totalFaturado || 0);
        }, 0);

        const potenciaTotal = filteredClients.reduce((sum, c) => {
            if (!c.projetos) return sum;
            return sum + c.projetos.reduce((pSum, p) => pSum + (p.potencia || 0), 0);
        }, 0);

        return {
            total,
            ativos,
            inativos,
            comProjetos,
            inadimplentes,
            totalFaturamento,
            potenciaTotal
        };
    }, [filteredClients]);

    // Destacar termo de busca nos resultados
    const highlightTerm = (text) => {
        if (!debouncedSearch || !text) return text;

        const regex = new RegExp(`(${debouncedSearch})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    };

    return {
        searchTerm,
        setSearchTerm,
        debouncedSearch,
        filteredClients,
        metrics,
        highlightTerm,
        isSearching: searchTerm.length > 0,
        hasFilters: Object.values(filters).some(v =>
            v !== 'TODOS' && v !== '' && v !== false
        )
    };
};

/**
 * Hook auxiliar para buscar clientes por campo específico
 */
export const useClientSearch = (clients) => {
    /**
     * Buscar cliente por UC
     */
    const findByUC = (uc) => {
        if (!uc) return null;

        return clients.find(client => {
            // Novo sistema
            if (client.instalacoes?.some(i => i.uc === uc)) return true;
            // Sistema legado
            if (client.installationId === uc) return true;
            if (client.installations?.includes(uc)) return true;
            return false;
        });
    };

    /**
     * Buscar cliente por código de projeto
     */
    const findByProjectCode = (codigo) => {
        if (!codigo) return null;

        return clients.find(client =>
            client.projetos?.some(p => p.codigo === codigo)
        );
    };

    /**
     * Buscar cliente por CPF/CNPJ
     */
    const findByDocument = (document) => {
        if (!document) return null;

        const cleanDoc = document.replace(/\D/g, '');

        return clients.find(client => {
            const clientDoc = (client.cnpj || client.cpf || client.document || '').replace(/\D/g, '');
            return clientDoc === cleanDoc;
        });
    };

    /**
     * Buscar cliente por número de série de equipamento
     */
    const findByEquipmentSerial = (numeroSerie) => {
        if (!numeroSerie) return null;

        return clients.find(client =>
            client.equipamentos?.some(e => e.numeroSerie === numeroSerie)
        );
    };

    /**
     * Buscar clientes por usina
     */
    const findByPlant = (plantId) => {
        if (!plantId) return [];

        return clients.filter(client => {
            // Novo sistema
            if (client.instalacoes?.some(i => i.usinaId === plantId)) return true;
            // Sistema legado
            if (client.plantId === plantId) return true;
            return false;
        });
    };

    return {
        findByUC,
        findByProjectCode,
        findByDocument,
        findByEquipmentSerial,
        findByPlant
    };
};
