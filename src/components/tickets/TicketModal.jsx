import { useForm, useWatch } from 'react-hook-form';
import { Modal, Button, ClientSelector } from '../';
import { Loader2, Zap, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '../../utils/cn';

// ========================================
// CATEGORIAS ALINHADAS COM GERAÇÃO DISTRIBUÍDA (GD)
// Modelo de negócio: Administrativo/Financeiro, NÃO hardware
// ========================================

const CATEGORIES = [
    // Categorias financeiras (core do negócio GD)
    { value: 'faturamento', label: '💰 Faturamento e Cobrança', group: 'financeiro', highlight: true },
    { value: 'compensacao', label: '⚡ Compensação de Energia', group: 'financeiro', highlight: true },
    { value: 'creditos', label: '💵 Créditos e Reembolsos', group: 'financeiro' },
    { value: 'acordo', label: '📝 Acordos e Parcelamentos', group: 'financeiro' },

    // Categorias regulatórias
    { value: 'regulatorio', label: '📋 Regulamentação/ANEEL', group: 'regulatório' },
    { value: 'distribuidora', label: '🔌 Questões Distribuidora', group: 'regulatório' },
    { value: 'contratual', label: '📄 Questões Contratuais', group: 'regulatório' },

    // Categorias administrativas
    { value: 'cadastro', label: '👤 Cadastro/Dados Cliente', group: 'administrativo' },
    { value: 'comercial', label: '🤝 Comercial', group: 'administrativo' },
    { value: 'suporte', label: '💬 Suporte Geral', group: 'administrativo' },

    // Casos críticos
    { value: 'inadimplencia', label: '🔴 Inadimplência', group: 'crítico', highlight: true, forcePriority: 'high' },

    // Outros
    { value: 'outros', label: 'Outros', group: 'outros' },
];

const PRIORITIES = [
    { value: 'low', label: 'Baixa', description: 'Resolução em até 72h' },
    { value: 'medium', label: 'Média', description: 'Resolução em até 24h' },
    { value: 'high', label: 'Alta', description: 'Resolução em até 4h' },
];

// Categorias que mostram campos específicos de GD (financeiros)
const GD_CATEGORIES = ['faturamento', 'compensacao', 'creditos', 'acordo', 'regulatorio', 'distribuidora', 'inadimplencia'];

export const TicketModal = ({ isOpen, onClose, onSubmit, ticket = null, clientId = null }) => {
    const [loading, setLoading] = useState(false);
    const [selectedClientId, setSelectedClientId] = useState(clientId || ticket?.clientId || null);
    const [clientError, setClientError] = useState(null);

    const isEdit = !!ticket;

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        control,
        setValue,
        watch,
    } = useForm({
        defaultValues: ticket || {
            subject: '',
            description: '',
            category: 'faturamento',
            priority: 'medium',

            // Campos específicos GD (Financeiros/Regulatórios)
            referencePeriod: '',          // Mês/Ano de referência (ex: "2024-12")
            invoiceReference: '',          // Número/Referência da fatura
            disputedValue: '',             // Valor em discussão (R$)
            ucNumber: '',                  // Número da Unidade Consumidora
            compensationType: '',          // Tipo de compensação (net_metering, etc.)
            agreementStatus: '',           // Status do acordo
            agreementDueDate: '',          // Data de vencimento do acordo
            regulatoryReference: '',       // Referência ANEEL/normativa
            distributorProtocol: '',       // Protocolo da distribuidora

            // Campos legados (para compatibilidade)
            equipmentType: '',
            equipmentModel: '',
            equipmentSerialNumber: '',
            errorCode: '',
            generationImpact: '',
            installationDate: '',
            warrantyStatus: '',
            inverterPower: '',
            actionsExecuted: [],
        },
    });

    // Observa a categoria selecionada para mostrar/esconder campos GD
    const selectedCategory = watch('category');
    const showGDFields = GD_CATEGORIES.includes(selectedCategory);

    // Auto-ajusta prioridade para inadimplência
    useEffect(() => {
        if (selectedCategory === 'inadimplencia') {
            setValue('priority', 'high');
        }
    }, [selectedCategory, setValue]);

    // Limpa campos GD quando muda de categoria
    useEffect(() => {
        if (!showGDFields) {
            // Limpa campos específicos de GD
            setValue('referencePeriod', '');
            setValue('invoiceReference', '');
            setValue('disputedValue', '');
            setValue('ucNumber', '');
            setValue('compensationType', '');
            setValue('agreementStatus', '');
            setValue('agreementDueDate', '');
            setValue('regulatoryReference', '');
            setValue('distributorProtocol', '');
        }
    }, [showGDFields, setValue]);

    const handleFormSubmit = async (data) => {
        // Validar cliente
        if (!selectedClientId) {
            setClientError('Selecione um cliente');
            return;
        }

        setLoading(true);
        setClientError(null);

        try {
            // Monta payload com campos GD se aplicável
            const payload = {
                ...data,
                clientId: selectedClientId,
            };

            // Adiciona campos específicos de GD (financeiro/regulatório)
            if (showGDFields) {
                payload.referencePeriod = data.referencePeriod || null;
                payload.invoiceReference = data.invoiceReference || null;
                payload.disputedValue = data.disputedValue ? parseFloat(data.disputedValue) : null;
                payload.ucNumber = data.ucNumber || null;
                payload.compensationType = data.compensationType || null;
                payload.agreementStatus = data.agreementStatus || null;
                payload.agreementDueDate = data.agreementDueDate || null;
                payload.regulatoryReference = data.regulatoryReference || null;
                payload.distributorProtocol = data.distributorProtocol || null;
            }

            const result = await onSubmit(payload);

            if (result?.success) {
                reset();
                setSelectedClientId(null);
                setSelectedProjectId(null);
                setSelectedProject(null);
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
        setSelectedClientId(null);
        setClientError(null);
        setSelectedProjectId(null);
        setSelectedProject(null);
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={isEdit ? 'Editar Ticket' : 'Novo Ticket'}
            size="xl"
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
                {/* Cliente - Só mostra se não for edição e não vier clientId */}
                {!clientId && !ticket && (
                    <ClientSelector
                        value={selectedClientId}
                        onChange={setSelectedClientId}
                        required
                        error={clientError}
                    />
                )}

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
                        className="input min-h-[80px] resize-y"
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
                                <option
                                    key={cat.value}
                                    value={cat.value}
                                    className={cat.highlight ? 'font-semibold' : ''}
                                >
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
                            disabled={selectedCategory === 'parada_total'}
                        >
                            {PRIORITIES.map((priority) => (
                                <option key={priority.value} value={priority.value}>
                                    {priority.label} - {priority.description}
                                </option>
                            ))}
                        </select>
                        {selectedCategory === 'parada_total' && (
                            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                                ⚠️ Parada Total força prioridade Alta automaticamente
                            </p>
                        )}
                        {errors.priority && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                {errors.priority.message}
                            </p>
                        )}
                    </div>
                </div>

                {/* ========================================
                    SEÇÃO DE CAMPOS GD - FINANCEIRO/REGULATÓRIO
                    ======================================== */}
                {showGDFields && (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                        <div className="flex items-center gap-2 mb-4">
                            <Zap className="h-5 w-5 text-yellow-500" />
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                Dados Específicos de GD
                            </h4>
                        </div>

                        {/* Linha 1: Período de Referência e Nº UC */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {/* Período de Referência (Mês/Ano) */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    📅 Período de Referência
                                </label>
                                <input
                                    type="month"
                                    className="input"
                                    {...register('referencePeriod')}
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Mês/Ano da fatura ou crédito em discussão
                                </p>
                            </div>

                            {/* Número da UC */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    🔌 Número da UC
                                </label>
                                <input
                                    type="text"
                                    className="input font-mono"
                                    placeholder="Ex: 3004567890"
                                    {...register('ucNumber')}
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Unidade Consumidora relacionada
                                </p>
                            </div>
                        </div>

                        {/* Linha 2: Referência da Fatura e Valor em Discussão */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {/* Referência da Fatura */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    📄 Referência da Fatura
                                </label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="Ex: FAT-2024-12-001"
                                    {...register('invoiceReference')}
                                />
                            </div>

                            {/* Valor em Discussão */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    💰 Valor em Discussão (R$)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="input"
                                    placeholder="Ex: 1500.00"
                                    {...register('disputedValue')}
                                />
                            </div>
                        </div>

                        {/* Linha 3: Tipo de Compensação e Status do Acordo */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {/* Tipo de Compensação */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    ⚡ Tipo de Compensação
                                </label>
                                <select
                                    className="input"
                                    {...register('compensationType')}
                                >
                                    <option value="">Selecione...</option>
                                    <option value="net_metering">Net Metering (Compensação)</option>
                                    <option value="gross_metering">Gross Metering (Injeção Total)</option>
                                    <option value="autoconsumo">Autoconsumo Remoto</option>
                                    <option value="geracao_compartilhada">Geração Compartilhada</option>
                                    <option value="consorcio">Consórcio/Cooperativa</option>
                                </select>
                            </div>

                            {/* Status do Acordo (se aplicável) */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    📝 Status do Acordo
                                </label>
                                <select
                                    className="input"
                                    {...register('agreementStatus')}
                                >
                                    <option value="">Não se aplica</option>
                                    <option value="proposta_enviada">Proposta Enviada</option>
                                    <option value="em_negociacao">Em Negociação</option>
                                    <option value="aguardando_assinatura">Aguardando Assinatura</option>
                                    <option value="assinado">Assinado</option>
                                    <option value="parcelado">Parcelado</option>
                                    <option value="recusado">Recusado</option>
                                </select>
                            </div>
                        </div>

                        {/* Linha 4: Data de Vencimento do Acordo e Protocolo Distribuidora */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {/* Data de Vencimento do Acordo */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    📆 Vencimento do Acordo
                                </label>
                                <input
                                    type="date"
                                    className="input"
                                    {...register('agreementDueDate')}
                                />
                            </div>

                            {/* Protocolo da Distribuidora */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    🔌 Protocolo Distribuidora
                                </label>
                                <input
                                    type="text"
                                    className="input font-mono"
                                    placeholder="Ex: CEMIG-2024-123456"
                                    {...register('distributorProtocol')}
                                />
                            </div>
                        </div>

                        {/* Linha 5: Referência Regulatória */}
                        <div className="mb-4">
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                📋 Referência ANEEL/Regulatória
                            </label>
                            <input
                                type="text"
                                className="input"
                                placeholder="Ex: REN 482/2012, REN 687/2015..."
                                {...register('regulatoryReference')}
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Norma ou resolução aplicável (se relevante)
                            </p>
                        </div>

                        {/* Alerta de Inadimplência */}
                        {selectedCategory === 'inadimplencia' && (
                            <div className="mt-4 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800">
                                <p className="font-medium flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4" />
                                    🔴 Caso de Inadimplência
                                </p>
                                <p className="text-xs mt-1 opacity-80">
                                    Este ticket será tratado com máxima prioridade. SLA: 4 horas.
                                </p>
                            </div>
                        )}
                    </div>
                )}

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
