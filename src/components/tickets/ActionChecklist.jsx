import { useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { ticketService } from '../../services/ticketService';
import { auth } from '../../services/firebase';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';

/**
 * Lista de ações disponíveis para diagnóstico/manutenção
 */
const AVAILABLE_ACTIONS = [
    { id: 'diagnostico_remoto', label: 'Diagnóstico Remoto' },
    { id: 'reset_fisico', label: 'Reset Físico' },
    { id: 'atualizacao_firmware', label: 'Atualização Firmware' },
    { id: 'acionamento_fabricante', label: 'Acionamento Garantia' },
    { id: 'visita_tecnica', label: 'Visita Técnica' },
    { id: 'troca_componente', label: 'Troca de Componente' },
    { id: 'limpeza_paineis', label: 'Limpeza de Painéis' },
    { id: 'ajuste_string', label: 'Ajuste de String' },
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

    return (
        <div className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Ações Executadas
            </h4>

            <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_ACTIONS.map((action) => {
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
                                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600',
                                isSaving && 'opacity-50 cursor-not-allowed'
                            )}
                        >
                            {isSaving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
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

            {executedActions.length > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    {executedActions.length} ação(ões) registrada(s)
                </p>
            )}
        </div>
    );
};
