import { useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { ticketService } from '../../services/ticketService';
import { auth } from '../../services/firebase';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';

/**
 * Lista de ações disponíveis para atendimento GD
 * Focado em processos administrativos/financeiros de cooperativas
 */
const AVAILABLE_ACTIONS = [
    // Ações de Comunicação
    { id: 'contato_cliente', label: '📞 Contato com Cliente', group: 'comunicacao' },
    { id: 'solicitacao_docs', label: '📄 Solicitação de Documentos', group: 'comunicacao' },
    { id: 'envio_esclarecimento', label: '✉️ Envio de Esclarecimento', group: 'comunicacao' },

    // Ações Financeiras
    { id: 'analise_fatura', label: '🧾 Análise de Fatura', group: 'financeiro' },
    { id: 'calculo_compensacao', label: '⚡ Cálculo de Compensação', group: 'financeiro' },
    { id: 'envio_proposta_acordo', label: '📝 Proposta de Acordo Enviada', group: 'financeiro' },
    { id: 'validacao_creditos', label: '💰 Validação de Créditos', group: 'financeiro' },

    // Ações com Distribuidora
    { id: 'contato_distribuidora', label: '🔌 Contato com Distribuidora', group: 'distribuidora' },
    { id: 'abertura_protocolo', label: '📋 Abertura de Protocolo', group: 'distribuidora' },
    { id: 'acompanhamento_protocolo', label: '🔍 Acompanhamento de Protocolo', group: 'distribuidora' },

    // Ações Regulatórias
    { id: 'consulta_aneel', label: '⚖️ Consulta Normativa ANEEL', group: 'regulatorio' },
    { id: 'registro_reclamacao', label: '📢 Registro de Reclamação Formal', group: 'regulatorio' },
];

/**
 * Componente de Checklist de Ações
 * Registra ações executadas na timeline do ticket
 * 
 * @param {object} props
 * @param {object} props.ticket - Ticket atual
 * @param {function} props.onUpdate - Callback ao atualizar
 */
export const ActionChecklist = ({ ticket, onUpdate }) => {
    const [saving, setSaving] = useState(null);
    const executedActions = ticket.actionsExecuted || [];

    const handleToggleAction = async (action) => {
        const isExecuted = executedActions.includes(action.id);
        const user = auth.currentUser;

        setSaving(action.id);
        try {
            let newActions;
            if (isExecuted) {
                // Remove a ação
                newActions = executedActions.filter(a => a !== action.id);
            } else {
                // Adiciona a ação
                newActions = [...executedActions, action.id];
            }

            // Atualiza o ticket
            await ticketService.update(ticket.clientId, ticket.id, {
                actionsExecuted: newActions
            });

            // Registra na timeline
            await ticketService.addTimelineItem(ticket.clientId, ticket.id, {
                type: 'action_executed',
                message: isExecuted
                    ? `Técnico ${user?.email || 'Sistema'} desmarcou ação: ${action.label}`
                    : `Técnico ${user?.email || 'Sistema'} executou: ${action.label}`,
                actionId: action.id,
                actionLabel: action.label,
                authorId: user?.uid,
                authorName: user?.email || 'Sistema',
            });

            if (onUpdate) {
                onUpdate(ticket.id, ticket.clientId, { actionsExecuted: newActions });
            }

            toast.success(isExecuted ? 'Ação desmarcada' : 'Ação registrada!');
        } catch (error) {
            console.error('Erro ao atualizar ação:', error);
            toast.error('Erro ao registrar ação');
        } finally {
            setSaving(null);
        }
    };

    // Agrupa ações por categoria
    const actionGroups = {
        comunicacao: { label: '📞 Comunicação', actions: [] },
        financeiro: { label: '💰 Financeiro', actions: [] },
        distribuidora: { label: '🔌 Distribuidora', actions: [] },
        regulatorio: { label: '⚖️ Regulatório', actions: [] },
    };

    AVAILABLE_ACTIONS.forEach(action => {
        if (actionGroups[action.group]) {
            actionGroups[action.group].actions.push(action);
        }
    });

    return (
        <div className="space-y-4">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Ações Realizadas
            </h4>

            <div className="space-y-3">
                {Object.entries(actionGroups).map(([groupKey, group]) => (
                    group.actions.length > 0 && (
                        <div key={groupKey} className="space-y-2">
                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                {group.label}
                            </p>
                            <div className="grid grid-cols-1 gap-1.5">
                                {group.actions.map((action) => {
                                    const isExecuted = executedActions.includes(action.id);
                                    const isSaving = saving === action.id;

                                    return (
                                        <button
                                            key={action.id}
                                            type="button"
                                            onClick={() => handleToggleAction(action)}
                                            disabled={isSaving}
                                            className={cn(
                                                'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-left transition-all',
                                                isExecuted
                                                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
                                                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-gray-50 dark:hover:bg-gray-700',
                                                isSaving && 'opacity-50 cursor-not-allowed'
                                            )}
                                        >
                                            {isSaving ? (
                                                <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                                            ) : (
                                                <div className={cn(
                                                    'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0',
                                                    isExecuted
                                                        ? 'bg-green-500 border-green-500'
                                                        : 'border-gray-300 dark:border-gray-600'
                                                )}>
                                                    {isExecuted && (
                                                        <CheckCircle2 className="h-3 w-3 text-white" />
                                                    )}
                                                </div>
                                            )}
                                            <span className="truncate">{action.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )
                ))}
            </div>

            {executedActions.length > 0 && (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                        ✓ {executedActions.length} ação(ões) registrada(s)
                    </p>
                </div>
            )}
        </div>
    );
};
