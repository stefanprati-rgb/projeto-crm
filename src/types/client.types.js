/**
 * Tipos e Enums para o Sistema de GD (Geração Distribuída)
 * 
 * Este arquivo centraliza todos os tipos e constantes usados
 * no sistema de gestão de clientes de Geração Distribuída.
 */

/**
 * Tipos de Cliente
 */
export const ClientType = {
    PESSOA_FISICA: 'PESSOA_FISICA',
    PESSOA_JURIDICA: 'PESSOA_JURIDICA'
};

export const ClientSegment = {
    RESIDENCIAL: 'RESIDENCIAL',
    COMERCIAL: 'COMERCIAL',
    INDUSTRIAL: 'INDUSTRIAL',
    RURAL: 'RURAL',
    PUBLICO: 'PUBLICO'
};

export const ClientStatus = {
    ATIVO: 'ATIVO',
    INATIVO: 'INATIVO',
    SUSPENSO: 'SUSPENSO',
    EM_ANALISE: 'EM_ANALISE',
    PROSPECTO: 'PROSPECTO'
};

/**
 * Tipos de Projeto GD
 */
export const ProjectType = {
    MINI_GERACAO: 'MINI_GERACAO',        // < 75 kW
    MICRO_GERACAO: 'MICRO_GERACAO',      // 75-300 kW
    PEQUENA_GERACAO: 'PEQUENA_GERACAO',  // 300-5000 kW
    MEDIA_GERACAO: 'MEDIA_GERACAO'       // > 5000 kW
};

export const ProjectStatus = {
    EM_ANALISE: 'EM_ANALISE',
    APROVADO: 'APROVADO',
    EM_CONSTRUCAO: 'EM_CONSTRUCAO',
    ATIVO: 'ATIVO',
    SUSPENSO: 'SUSPENSO',
    CANCELADO: 'CANCELADO',
    CONCLUIDO: 'CONCLUIDO'
};

/**
 * Tipos de Instalação
 */
export const InstallationType = {
    GERACAO: 'GERACAO',
    CONSUMO: 'CONSUMO',
    HIBRIDO: 'HIBRIDO'
};

export const InstallationStatus = {
    PLANEJAMENTO: 'PLANEJAMENTO',
    EM_INSTALACAO: 'EM_INSTALACAO',
    ATIVO: 'ATIVO',
    MANUTENCAO: 'MANUTENCAO',
    DESATIVADO: 'DESATIVADO'
};

/**
 * Tipos de Contrato
 */
export const ContractType = {
    COMPRA: 'COMPRA',
    LEASING: 'LEASING',
    ASSINATURA: 'ASSINATURA',
    PPA: 'PPA', // Power Purchase Agreement
    LOCACAO: 'LOCACAO'
};

export const ContractStatus = {
    RASCUNHO: 'RASCUNHO',
    EM_NEGOCIACAO: 'EM_NEGOCIACAO',
    ATIVO: 'ATIVO',
    SUSPENSO: 'SUSPENSO',
    ENCERRADO: 'ENCERRADO',
    CANCELADO: 'CANCELADO'
};

/**
 * Tipos de Equipamento
 */
export const EquipmentType = {
    INVERSOR: 'INVERSOR',
    PAINEL_SOLAR: 'PAINEL_SOLAR',
    ESTRUTURA: 'ESTRUTURA',
    MEDIDOR: 'MEDIDOR',
    STRING_BOX: 'STRING_BOX',
    TRANSFORMADOR: 'TRANSFORMADOR',
    BATERIA: 'BATERIA',
    CONTROLADOR: 'CONTROLADOR'
};

export const EquipmentStatus = {
    NOVO: 'NOVO',
    OPERACIONAL: 'OPERACIONAL',
    MANUTENCAO: 'MANUTENCAO',
    DEFEITO: 'DEFEITO',
    SUBSTITUIDO: 'SUBSTITUIDO',
    DESATIVADO: 'DESATIVADO'
};

/**
 * Tipos de Interação (Timeline)
 */
export const InteractionType = {
    WHATSAPP: 'WHATSAPP',
    EMAIL: 'EMAIL',
    LIGACAO: 'LIGACAO',
    VISITA_TECNICA: 'VISITA_TECNICA',
    REUNIAO: 'REUNIAO',
    NOTA: 'NOTA',
    PROPOSTA: 'PROPOSTA',
    CONTRATO: 'CONTRATO'
};

/**
 * Status de Fatura
 */
export const InvoiceStatus = {
    EM_ABERTO: 'EM_ABERTO',
    VENCIDO: 'VENCIDO',
    PAGO: 'PAGO',
    PAGO_PARCIAL: 'PAGO_PARCIAL',
    CANCELADO: 'CANCELADO',
    RENEGOCIADO: 'RENEGOCIADO'
};

/**
 * Tipos de Contato
 */
export const ContactType = {
    COMERCIAL: 'COMERCIAL',
    FINANCEIRO: 'FINANCEIRO',
    TECNICO: 'TECNICO',
    JURIDICO: 'JURIDICO',
    OPERACIONAL: 'OPERACIONAL',
    OUTRO: 'OUTRO'
};

/**
 * Formas de Pagamento
 */
export const PaymentMethod = {
    BOLETO: 'BOLETO',
    PIX: 'PIX',
    TRANSFERENCIA: 'TRANSFERENCIA',
    CARTAO_CREDITO: 'CARTAO_CREDITO',
    CARTAO_DEBITO: 'CARTAO_DEBITO',
    DINHEIRO: 'DINHEIRO',
    CHEQUE: 'CHEQUE'
};

/**
 * Labels amigáveis para exibição
 */
export const Labels = {
    ClientType: {
        PESSOA_FISICA: 'Pessoa Física',
        PESSOA_JURIDICA: 'Pessoa Jurídica'
    },
    ClientSegment: {
        RESIDENCIAL: 'Residencial',
        COMERCIAL: 'Comercial',
        INDUSTRIAL: 'Industrial',
        RURAL: 'Rural',
        PUBLICO: 'Público'
    },
    ClientStatus: {
        ATIVO: 'Ativo',
        INATIVO: 'Inativo',
        SUSPENSO: 'Suspenso',
        EM_ANALISE: 'Em Análise',
        PROSPECTO: 'Prospecto'
    },
    ProjectType: {
        MINI_GERACAO: 'Mini Geração (< 75 kW)',
        MICRO_GERACAO: 'Micro Geração (75-300 kW)',
        PEQUENA_GERACAO: 'Pequena Geração (300-5000 kW)',
        MEDIA_GERACAO: 'Média Geração (> 5000 kW)'
    },
    ProjectStatus: {
        EM_ANALISE: 'Em Análise',
        APROVADO: 'Aprovado',
        EM_CONSTRUCAO: 'Em Construção',
        ATIVO: 'Ativo',
        SUSPENSO: 'Suspenso',
        CANCELADO: 'Cancelado',
        CONCLUIDO: 'Concluído'
    },
    InstallationType: {
        GERACAO: 'Geração',
        CONSUMO: 'Consumo',
        HIBRIDO: 'Híbrido'
    },
    InstallationStatus: {
        PLANEJAMENTO: 'Planejamento',
        EM_INSTALACAO: 'Em Instalação',
        ATIVO: 'Ativo',
        MANUTENCAO: 'Manutenção',
        DESATIVADO: 'Desativado'
    },
    ContractType: {
        COMPRA: 'Compra',
        LEASING: 'Leasing',
        ASSINATURA: 'Assinatura',
        PPA: 'PPA',
        LOCACAO: 'Locação'
    },
    ContractStatus: {
        RASCUNHO: 'Rascunho',
        EM_NEGOCIACAO: 'Em Negociação',
        ATIVO: 'Ativo',
        SUSPENSO: 'Suspenso',
        ENCERRADO: 'Encerrado',
        CANCELADO: 'Cancelado'
    },
    EquipmentType: {
        INVERSOR: 'Inversor',
        PAINEL_SOLAR: 'Painel Solar',
        ESTRUTURA: 'Estrutura',
        MEDIDOR: 'Medidor',
        STRING_BOX: 'String Box',
        TRANSFORMADOR: 'Transformador',
        BATERIA: 'Bateria',
        CONTROLADOR: 'Controlador'
    },
    EquipmentStatus: {
        NOVO: 'Novo',
        OPERACIONAL: 'Operacional',
        MANUTENCAO: 'Manutenção',
        DEFEITO: 'Defeito',
        SUBSTITUIDO: 'Substituído',
        DESATIVADO: 'Desativado'
    },
    InteractionType: {
        WHATSAPP: 'WhatsApp',
        EMAIL: 'E-mail',
        LIGACAO: 'Ligação',
        VISITA_TECNICA: 'Visita Técnica',
        REUNIAO: 'Reunião',
        NOTA: 'Nota',
        PROPOSTA: 'Proposta',
        CONTRATO: 'Contrato'
    },
    InvoiceStatus: {
        EM_ABERTO: 'Em Aberto',
        VENCIDO: 'Vencido',
        PAGO: 'Pago',
        PAGO_PARCIAL: 'Pago Parcial',
        CANCELADO: 'Cancelado',
        RENEGOCIADO: 'Renegociado'
    },
    ContactType: {
        COMERCIAL: 'Comercial',
        FINANCEIRO: 'Financeiro',
        TECNICO: 'Técnico',
        JURIDICO: 'Jurídico',
        OPERACIONAL: 'Operacional',
        OUTRO: 'Outro'
    },
    PaymentMethod: {
        BOLETO: 'Boleto',
        PIX: 'PIX',
        TRANSFERENCIA: 'Transferência',
        CARTAO_CREDITO: 'Cartão de Crédito',
        CARTAO_DEBITO: 'Cartão de Débito',
        DINHEIRO: 'Dinheiro',
        CHEQUE: 'Cheque'
    }
};

/**
 * Cores para badges de status
 */
export const StatusColors = {
    ClientStatus: {
        ATIVO: 'success',
        INATIVO: 'default',
        SUSPENSO: 'warning',
        EM_ANALISE: 'info',
        PROSPECTO: 'default'
    },
    ProjectStatus: {
        EM_ANALISE: 'info',
        APROVADO: 'success',
        EM_CONSTRUCAO: 'warning',
        ATIVO: 'success',
        SUSPENSO: 'warning',
        CANCELADO: 'danger',
        CONCLUIDO: 'default'
    },
    InstallationStatus: {
        PLANEJAMENTO: 'info',
        EM_INSTALACAO: 'warning',
        ATIVO: 'success',
        MANUTENCAO: 'warning',
        DESATIVADO: 'default'
    },
    ContractStatus: {
        RASCUNHO: 'default',
        EM_NEGOCIACAO: 'info',
        ATIVO: 'success',
        SUSPENSO: 'warning',
        ENCERRADO: 'default',
        CANCELADO: 'danger'
    },
    EquipmentStatus: {
        NOVO: 'info',
        OPERACIONAL: 'success',
        MANUTENCAO: 'warning',
        DEFEITO: 'danger',
        SUBSTITUIDO: 'default',
        DESATIVADO: 'default'
    },
    InvoiceStatus: {
        EM_ABERTO: 'info',
        VENCIDO: 'danger',
        PAGO: 'success',
        PAGO_PARCIAL: 'warning',
        CANCELADO: 'default',
        RENEGOCIADO: 'warning'
    }
};
