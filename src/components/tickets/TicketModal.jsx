import { useForm } from 'react-hook-form';
import { Modal, Button, Input } from '../';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

const CATEGORIES = [
    { value: 'suporte', label: 'Suporte Técnico' },
    { value: 'financeiro', label: 'Financeiro' },
    { value: 'comercial', label: 'Comercial' },
    { value: 'instalacao', label: 'Instalação' },
    { value: 'manutencao', label: 'Manutenção' },
    { value: 'outros', label: 'Outros' },
];

const PRIORITIES = [
    { value: 'low', label: 'Baixa', description: 'Resolução em até 48h' },
    { value: 'medium', label: 'Média', description: 'Resolução em até 24h' },
    { value: 'high', label: 'Alta', description: 'Resolução em até 4h' },
];

export const TicketModal = ({ isOpen, onClose, onSubmit, ticket = null, clientId = null }) => {
    const [loading, setLoading] = useState(false);
    const isEdit = !!ticket;

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm({
        defaultValues: ticket || {
            subject: '',
            description: '',
            category: 'outros',
            priority: 'medium',
        },
    });

    const handleFormSubmit = async (data) => {
        setLoading(true);

        try {
            const result = await onSubmit({
                ...data,
                clientId: ticket?.clientId || clientId,
            });

            if (result?.success) {
                reset();
                onClose();
            }
        } catch (error) {
            console.error('Erro ao salvar ticket:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={isEdit ? 'Editar Ticket' : 'Novo Ticket'}
            size="lg"
            footer={
                <>
                    <Button variant="secondary" onClick={handleClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit(handleFormSubmit)}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>{isEdit ? 'Salvar' : 'Criar Ticket'}</>
                        )}
                    </Button>
                </>
            }
        >
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                {/* Assunto */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Assunto <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        className="input"
                        placeholder="Ex: Problema com inversor"
                        {...register('subject', {
                            required: 'Assunto é obrigatório',
                            minLength: {
                                value: 5,
                                message: 'Assunto deve ter no mínimo 5 caracteres',
                            },
                        })}
                    />
                    {errors.subject && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                            {errors.subject.message}
                        </p>
                    )}
                </div>

                {/* Descrição */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Descrição
                    </label>
                    <textarea
                        className="input min-h-[100px] resize-y"
                        placeholder="Descreva o problema ou solicitação..."
                        {...register('description')}
                    />
                </div>

                {/* Categoria e Prioridade */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Categoria */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Categoria <span className="text-red-500">*</span>
                        </label>
                        <select
                            className="input"
                            {...register('category', { required: 'Categoria é obrigatória' })}
                        >
                            {CATEGORIES.map((cat) => (
                                <option key={cat.value} value={cat.value}>
                                    {cat.label}
                                </option>
                            ))}
                        </select>
                        {errors.category && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                {errors.category.message}
                            </p>
                        )}
                    </div>

                    {/* Prioridade */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Prioridade <span className="text-red-500">*</span>
                        </label>
                        <select
                            className="input"
                            {...register('priority', { required: 'Prioridade é obrigatória' })}
                        >
                            {PRIORITIES.map((priority) => (
                                <option key={priority.value} value={priority.value}>
                                    {priority.label} - {priority.description}
                                </option>
                            ))}
                        </select>
                        {errors.priority && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                {errors.priority.message}
                            </p>
                        )}
                    </div>
                </div>

                {/* Info sobre SLA */}
                <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-medium mb-1">ℹ️ Sobre o SLA</p>
                    <p>
                        O prazo de resolução será calculado automaticamente com base na prioridade
                        selecionada.
                    </p>
                </div>
            </form>
        </Modal>
    );
};
