/**
 * Status permitidos para a esteira (Onboarding Pipeline),
 * espelhando as regras de validação do firestore.rules.
 */
export const PipelineStatus = {
    NEW: 'new',
    WAITING_APPORTIONMENT: 'waiting_apportionment',
    SENT_TO_APPORTIONMENT: 'sent_to_apportionment',
    APPORTIONMENT_DONE: 'apportionment_done',
    WAITING_COMPENSATION: 'waiting_compensation',
    INVOICED: 'invoiced'
};

/**
 * Configuração de exibição para a UI (labels e cores).
 */
export const PIPELINE_STATUS_CONFIG = {
    [PipelineStatus.NEW]: {
        label: 'Novo',
        color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    },
    [PipelineStatus.WAITING_APPORTIONMENT]: {
        label: 'Aguardando Rateio',
        color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    },
    [PipelineStatus.SENT_TO_APPORTIONMENT]: {
        label: 'Enviado p/ Rateio',
        color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    },
    [PipelineStatus.APPORTIONMENT_DONE]: {
        label: 'Rateio Cadastrado',
        color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
    },
    [PipelineStatus.WAITING_COMPENSATION]: {
        label: 'Aguardando Comp.',
        color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
    },
    [PipelineStatus.INVOICED]: {
        label: 'Faturado',
        color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    }
};
