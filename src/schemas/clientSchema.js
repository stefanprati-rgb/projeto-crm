/**
 * Schema Completo de Cliente para Geração Distribuída
 * 
 * Este schema define a estrutura completa de um cliente no sistema,
 * incluindo projetos, instalações, equipamentos, contratos e faturamento.
 */

import {
    ClientType,
    ClientSegment,
    ClientStatus,
    ProjectType,
    ProjectStatus,
    InstallationType,
    InstallationStatus,
    ContractType,
    ContractStatus,
    EquipmentType,
    EquipmentStatus,
    InteractionType,
    InvoiceStatus,
    ContactType,
    PaymentMethod
} from '../types/client.types';

/**
 * Schema base de um cliente
 */
export const createEmptyClient = () => ({
    // ─────────────────────────────────────────────────────────
    // IDENTIDADE DO CLIENTE
    // ─────────────────────────────────────────────────────────
    id: '',
    tipo: ClientType.PESSOA_JURIDICA,
    nome: '',
    nomeFantasia: '',
    segmento: ClientSegment.COMERCIAL,
    status: ClientStatus.PROSPECTO,

    // ─────────────────────────────────────────────────────────
    // DOCUMENTAÇÃO
    // ─────────────────────────────────────────────────────────
    document: '', // CPF ou CNPJ (campo legado, manter compatibilidade)
    cnpj: '',
    cpf: '',
    inscricaoEstadual: '',
    inscricaoMunicipal: '',
    dataConstituicao: null,

    // ─────────────────────────────────────────────────────────
    // LOCALIZAÇÃO PRINCIPAL
    // ─────────────────────────────────────────────────────────
    endereco: {
        rua: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        estado: '',
        cep: '',
        coordenadas: {
            lat: null,
            lng: null
        }
    },

    // Campos legados (manter compatibilidade)
    address: '',
    city: '',
    state: '',
    zipCode: '',

    // ─────────────────────────────────────────────────────────
    // CONTATOS PRINCIPAIS (Campos Legados)
    // ─────────────────────────────────────────────────────────
    email: '',
    phone: '',

    // ─────────────────────────────────────────────────────────
    // CONTATOS MÚLTIPLOS (Novo Sistema)
    // ─────────────────────────────────────────────────────────
    contatos: [],
    // Estrutura de cada contato:
    // {
    //   id: string,
    //   tipo: ContactType,
    //   nome: string,
    //   cargo: string,
    //   email: string,
    //   telefone: string,
    //   whatsapp: string,
    //   principal: boolean,
    //   observacoes: string
    // }

    // ─────────────────────────────────────────────────────────
    // PROJETOS DE GERAÇÃO DISTRIBUÍDA
    // ─────────────────────────────────────────────────────────
    projetos: [],
    // Estrutura de cada projeto:
    // {
    //   id: string,
    //   codigo: string, // Ex: GD-SP-001
    //   nome: string,
    //   tipo: ProjectType,
    //   potencia: number, // kW
    //   potenciaInstalada: number, // kWp
    //   status: ProjectStatus,
    //   dataInicio: string (ISO),
    //   dataAprovacao: string (ISO),
    //   dataAtivacao: string (ISO),
    //   dataConclusao: string (ISO),
    //   valorInvestimento: number,
    //   valorMensalEstimado: number,
    //   economiaEstimada: number, // % ou valor
    //   usinas: string[], // Array de IDs de usinas
    //   responsavelTecnico: string,
    //   responsavelComercial: string,
    //   observacoes: string,
    //   documentos: [
    //     {
    //       tipo: string,
    //       nome: string,
    //       url: string,
    //       dataUpload: string
    //     }
    //   ]
    // }

    // ─────────────────────────────────────────────────────────
    // INSTALAÇÕES / UNIDADES CONSUMIDORAS
    // ─────────────────────────────────────────────────────────
    // Campos legados (manter compatibilidade)
    installationId: '', // UC principal
    installations: [], // Array de UCs (legado)
    plantName: '',
    plantId: '',
    voltage: '',
    meter: '',

    // Novo sistema de instalações
    instalacoes: [],
    // Estrutura de cada instalação:
    // {
    //   id: string,
    //   uc: string, // Unidade Consumidora (ex: 10/908866-7)
    //   tipo: InstallationType,
    //   usinaId: string,
    //   usinaName: string,
    //   projetoId: string,
    //   endereco: {
    //     rua: string,
    //     numero: string,
    //     complemento: string,
    //     bairro: string,
    //     cidade: string,
    //     estado: string,
    //     cep: string
    //   },
    //   tensao: string,
    //   medidor: string,
    //   numeroMedidor: string,
    //   distribuidora: string,
    //   dataInstalacao: string (ISO),
    //   dataAtivacao: string (ISO),
    //   status: InstallationStatus,
    //   observacoes: string
    // }

    // ─────────────────────────────────────────────────────────
    // CONTRATOS
    // ─────────────────────────────────────────────────────────
    contratos: [],
    // Estrutura de cada contrato:
    // {
    //   id: string,
    //   numero: string,
    //   tipo: ContractType,
    //   projetoId: string,
    //   dataInicio: string (ISO),
    //   dataFim: string (ISO),
    //   valorTotal: number,
    //   valorMensal: number,
    //   descontoContratado: number, // %
    //   reajusteAnual: number, // %
    //   indiceReajuste: string, // IPCA, IGP-M, etc
    //   status: ContractStatus,
    //   documentoUrl: string,
    //   observacoes: string,
    //   clausulas: [
    //     {
    //       titulo: string,
    //       descricao: string
    //     }
    //   ]
    // }

    // ─────────────────────────────────────────────────────────
    // FATURAMENTO
    // ─────────────────────────────────────────────────────────
    faturamento: {
        diaVencimento: 15,
        formaPagamento: PaymentMethod.BOLETO,
        saldoEmAberto: 0,
        totalFaturado: 0,
        totalPago: 0,
        totalVencido: 0,
        inadimplente: false,
        diasAtraso: 0,
        ultimoPagamento: null,
        proximoVencimento: null,
        observacoes: ''
    },

    // ─────────────────────────────────────────────────────────
    // FATURAS (Campo Legado - Array no documento)
    // ─────────────────────────────────────────────────────────
    invoices: [],
    faturas: [],
    // Estrutura de cada fatura:
    // {
    //   id: string,
    //   numero: string,
    //   competencia: string, // MM/YYYY
    //   valor: number,
    //   valorPago: number,
    //   dataEmissao: string (ISO),
    //   dataVencimento: string (ISO),
    //   dataPagamento: string (ISO),
    //   status: InvoiceStatus,
    //   instalacaoId: string,
    //   projetoId: string,
    //   formaPagamento: PaymentMethod,
    //   boletoUrl: string,
    //   notaFiscalUrl: string,
    //   observacoes: string,
    //   itens: [
    //     {
    //       descricao: string,
    //       quantidade: number,
    //       valorUnitario: number,
    //       valorTotal: number
    //     }
    //   ]
    // }

    // ─────────────────────────────────────────────────────────
    // EQUIPAMENTOS
    // ─────────────────────────────────────────────────────────
    equipamentos: [],
    // Estrutura de cada equipamento:
    // {
    //   id: string,
    //   tipo: EquipmentType,
    //   marca: string,
    //   modelo: string,
    //   numeroSerie: string,
    //   potencia: number,
    //   potenciaUnitaria: number,
    //   quantidade: number,
    //   potenciaTotal: number,
    //   dataInstalacao: string (ISO),
    //   dataAquisicao: string (ISO),
    //   garantiaAte: string (ISO),
    //   instalacaoId: string,
    //   projetoId: string,
    //   status: EquipmentStatus,
    //   valorAquisicao: number,
    //   fornecedor: string,
    //   observacoes: string,
    //   manutencoes: [
    //     {
    //       data: string (ISO),
    //       tipo: string,
    //       descricao: string,
    //       responsavel: string,
    //       custo: number
    //     }
    //   ]
    // }

    // ─────────────────────────────────────────────────────────
    // TIMELINE / HISTÓRICO DE INTERAÇÕES
    // ─────────────────────────────────────────────────────────
    timeline: [],
    // Estrutura de cada interação:
    // {
    //   id: string,
    //   tipo: InteractionType,
    //   data: string (ISO),
    //   usuario: string,
    //   usuarioId: string,
    //   resumo: string,
    //   detalhes: string,
    //   projetoId: string,
    //   anexos: [
    //     {
    //       nome: string,
    //       url: string,
    //       tipo: string
    //     }
    //   ]
    // }

    // ─────────────────────────────────────────────────────────
    // OBSERVAÇÕES E NOTAS
    // ─────────────────────────────────────────────────────────
    notes: '',
    observacoes: '',
    tags: [], // Array de strings para categorização

    // ─────────────────────────────────────────────────────────
    // METADATA DO SISTEMA
    // ─────────────────────────────────────────────────────────
    database: 'EGS',
    createdAt: null,
    updatedAt: null,
    createdBy: '',
    createdByEmail: '',
    updatedBy: '',
    updatedByEmail: '',

    // ─────────────────────────────────────────────────────────
    // CAMPOS CALCULADOS (Não salvos no banco)
    // ─────────────────────────────────────────────────────────
    // Estes campos são calculados em tempo real:
    // - totalProjetos: projetos.length
    // - projetosAtivos: projetos.filter(p => p.status === 'ATIVO').length
    // - totalInstalacoes: instalacoes.length
    // - potenciaTotal: sum(projetos.potencia)
    // - valorMensalTotal: sum(projetos.valorMensalEstimado)
    // - equipamentosTotal: equipamentos.length
    // - equipamentosOperacionais: equipamentos.filter(e => e.status === 'OPERACIONAL').length
});

/**
 * Schema de um novo projeto
 */
export const createEmptyProject = () => ({
    id: '',
    codigo: '',
    nome: '',
    tipo: ProjectType.MICRO_GERACAO,
    potencia: 0,
    potenciaInstalada: 0,
    status: ProjectStatus.EM_ANALISE,
    dataInicio: null,
    dataAprovacao: null,
    dataAtivacao: null,
    dataConclusao: null,
    valorInvestimento: 0,
    valorMensalEstimado: 0,
    economiaEstimada: 0,
    usinas: [],
    responsavelTecnico: '',
    responsavelComercial: '',
    observacoes: '',
    documentos: []
});

/**
 * Schema de uma nova instalação
 */
export const createEmptyInstallation = () => ({
    id: '',
    uc: '',
    tipo: InstallationType.GERACAO,
    usinaId: '',
    usinaName: '',
    projetoId: '',
    endereco: {
        rua: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        estado: '',
        cep: ''
    },
    tensao: '',
    medidor: '',
    numeroMedidor: '',
    distribuidora: '',
    dataInstalacao: null,
    dataAtivacao: null,
    status: InstallationStatus.PLANEJAMENTO,
    observacoes: ''
});

/**
 * Schema de um novo contrato
 */
export const createEmptyContract = () => ({
    id: '',
    numero: '',
    tipo: ContractType.LEASING,
    projetoId: '',
    dataInicio: null,
    dataFim: null,
    valorTotal: 0,
    valorMensal: 0,
    descontoContratado: 0,
    reajusteAnual: 0,
    indiceReajuste: 'IPCA',
    status: ContractStatus.RASCUNHO,
    documentoUrl: '',
    observacoes: '',
    clausulas: []
});

/**
 * Schema de um novo equipamento
 */
export const createEmptyEquipment = () => ({
    id: '',
    tipo: EquipmentType.INVERSOR,
    marca: '',
    modelo: '',
    numeroSerie: '',
    potencia: 0,
    potenciaUnitaria: 0,
    quantidade: 1,
    potenciaTotal: 0,
    dataInstalacao: null,
    dataAquisicao: null,
    garantiaAte: null,
    instalacaoId: '',
    projetoId: '',
    status: EquipmentStatus.NOVO,
    valorAquisicao: 0,
    fornecedor: '',
    observacoes: '',
    manutencoes: []
});

/**
 * Schema de um novo contato
 */
export const createEmptyContact = () => ({
    id: '',
    tipo: ContactType.COMERCIAL,
    nome: '',
    cargo: '',
    email: '',
    telefone: '',
    whatsapp: '',
    principal: false,
    observacoes: ''
});

/**
 * Schema de uma nova fatura
 */
export const createEmptyInvoice = () => ({
    id: '',
    numero: '',
    competencia: '',
    valor: 0,
    valorPago: 0,
    dataEmissao: null,
    dataVencimento: null,
    dataPagamento: null,
    status: InvoiceStatus.EM_ABERTO,
    instalacaoId: '',
    projetoId: '',
    formaPagamento: PaymentMethod.BOLETO,
    boletoUrl: '',
    notaFiscalUrl: '',
    observacoes: '',
    itens: []
});

/**
 * Schema de uma nova interação (timeline)
 */
export const createEmptyInteraction = () => ({
    id: '',
    tipo: InteractionType.NOTA,
    data: new Date().toISOString(),
    usuario: '',
    usuarioId: '',
    resumo: '',
    detalhes: '',
    projetoId: '',
    anexos: []
});

/**
 * Validadores
 */
export const validators = {
    /**
     * Valida se um cliente tem os campos obrigatórios
     */
    isValidClient: (client) => {
        return !!(
            client.nome &&
            client.tipo &&
            client.segmento &&
            client.status
        );
    },

    /**
     * Valida se um projeto tem os campos obrigatórios
     */
    isValidProject: (project) => {
        return !!(
            project.codigo &&
            project.nome &&
            project.tipo &&
            project.status
        );
    },

    /**
     * Valida se uma instalação tem os campos obrigatórios
     */
    isValidInstallation: (installation) => {
        return !!(
            installation.uc &&
            installation.tipo &&
            installation.status
        );
    },

    /**
     * Valida se um equipamento tem os campos obrigatórios
     */
    isValidEquipment: (equipment) => {
        return !!(
            equipment.tipo &&
            equipment.marca &&
            equipment.modelo &&
            equipment.status
        );
    }
};
