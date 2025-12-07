// Configuração Central dos Projetos (Usinas)
// Define os códigos, nomes exibidos e a meta de geração (para cálculo de vacância)

export const PROJECTS = {
    'LNV': {
        name: 'Lua Nova Energia',
        target: 50000 // Exemplo: 50.000 kWh/mês (Ajuste conforme contrato real)
    },
    'ALA': {
        name: 'Alagoas Energia',
        target: 75000
    },
    'EGS': {
        name: 'E3 Energia',
        target: 60000
    },
    'EMG': {
        name: 'Era Verde Energia - MG',
        target: 45000
    },
    'ESP': {
        name: 'Era Verde Energia - SP',
        target: 55000
    },
    'MTX': {
        name: 'Matrix',
        target: 100000
    }
};

// Helper para pegar a meta combinada (quando selecionamos "TODOS")
export function getTargetGeneration(baseCode) {
    if (!baseCode || baseCode === 'TODOS') {
        // Soma todas as metas
        return Object.values(PROJECTS).reduce((sum, p) => sum + p.target, 0);
    }
    return PROJECTS[baseCode]?.target || 0;
}

// Helper para pegar o nome legível
export function getProjectName(baseCode) {
    return PROJECTS[baseCode]?.name || baseCode;
}