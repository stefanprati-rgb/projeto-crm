import { useForm, useWatch } from 'react-hook-form';
import { Modal, Button, ClientSelector } from '../';
import { Loader2, Sun, Zap, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ProjectSelector, EQUIPMENT_TYPES, GENERATION_IMPACT } from './ProjectSelector';
import { cn } from '../../utils/cn';

const CATEGORIES = [
    { value: 'suporte', label: 'Suporte Técnico' },
    { value: 'financeiro', label: 'Financeiro' },
    { value: 'comercial', label: 'Comercial' },
    { value: 'instalacao', label: 'Instalação' },
    { value: 'manutencao', label: 'Manutenção' },
    // Categorias técnicas de GD
    { value: 'tecnico', label: '⚡ Técnico (GD)', highlight: true },
    { value: 'parada_total', label: '🔴 Parada Total', highlight: true, forcePriority: 'high' },
    { value: 'outros', label: 'Outros' },
];

const PRIORITIES = [
    { value: 'low', label: 'Baixa', description: 'Resolução em até 72h' },
    { value: 'medium', label: 'Média', description: 'Resolução em até 24h' },
    { value: 'high', label: 'Alta', description: 'Resolução em até 4h' },
];

// Categorias que mostram campos de GD
const GD_CATEGORIES = ['tecnico', 'parada_total', 'manutencao', 'instalacao'];

export const TicketModal = ({ isOpen, onClose, onSubmit, ticket = null, clientId = null }) => {
    const [loading, setLoading] = useState(false);
    const [selectedClientId, setSelectedClientId] = useState(clientId || ticket?.clientId || null);
    const [clientError, setClientError] = useState(null);

    // Estados para campos de GD
    const [selectedProjectId, setSelectedProjectId] = useState(ticket?.projectId || null);
    const [selectedProject, setSelectedProject] = useState(null);

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
            category: 'outros',
            priority: 'medium',
            // Campos GD
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

    // Auto-ajusta prioridade para parada_total
    useEffect(() => {
        if (selectedCategory === 'parada_total') {
            setValue('priority', 'high');
        }
    }, [selectedCategory, setValue]);

    // Limpa campos GD quando muda de categoria
    useEffect(() => {
        if (!showGDFields) {
            setValue('equipmentType', '');
            setValue('equipmentModel', '');
            setValue('errorCode', '');
            setValue('generationImpact', '');
            setSelectedProjectId(null);
            setSelectedProject(null);
        }
    }, [showGDFields, setValue]);

    const handleProjectChange = (projectId, projectData) => {
        setSelectedProjectId(projectId);
        setSelectedProject(projectData);
    };

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

            // Adiciona campos GD se categoria for técnica
            if (showGDFields) {
                payload.projectId = selectedProjectId;
                payload.projectName = selectedProject?.nome || selectedProject?.codigo || null;
                payload.equipmentType = data.equipmentType || null;
                payload.equipmentModel = data.equipmentModel || null;
                payload.equipmentSerialNumber = data.equipmentSerialNumber || null;
                payload.errorCode = data.errorCode || null;
                payload.generationImpact = data.generationImpact || null;
                payload.installationDate = data.installationDate || null;
                payload.warrantyStatus = data.warrantyStatus || null;
                payload.inverterPower = data.inverterPower ? parseFloat(data.inverterPower) : null;
                payload.actionsExecuted = data.actionsExecuted || [];
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
                    SEÇÃO DE CAMPOS GD (Condicional)
                    ======================================== */}
                {showGDFields && (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                        <div className="flex items-center gap-2 mb-4">
                            <Sun className="h-5 w-5 text-yellow-500" />
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                Dados do Sistema Fotovoltaico
                            </h4>
                        </div>

                        {/* Projeto/Usina */}
                        <ProjectSelector
                            clientId={selectedClientId}
                            value={selectedProjectId}
                            onChange={handleProjectChange}
                            className="mb-4"
                        />

                        {/* Tipo de Equipamento e Modelo */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {/* Tipo de Equipamento */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Tipo de Equipamento
                                </label>
                                <select
                                    className="input"
                                    {...register('equipmentType')}
                                >
                                    <option value="">Selecione...</option>
                                    {EQUIPMENT_TYPES.map((type) => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Modelo do Equipamento */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Modelo/Marca
                                </label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="Ex: Growatt 10kW, JA Solar 550W..."
                                    {...register('equipmentModel')}
                                />
                            </div>
                        </div>

                        {/* Serial Number e Potência */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {/* Número de Série */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Número de Série / SN
                                </label>
                                <input
                                    type="text"
                                    className="input font-mono"
                                    placeholder="Ex: GRT0123456789"
                                    {...register('equipmentSerialNumber')}
                                />
                            </div>

                            {/* Potência Nominal */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Potência Nominal (kW)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    className="input"
                                    placeholder="Ex: 10.5"
                                    {...register('inverterPower')}
                                />
                            </div>
                        </div>

                        {/* Data de Instalação e Garantia */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {/* Data de Instalação */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Data da Instalação
                                </label>
                                <input
                                    type="date"
                                    className="input"
                                    {...register('installationDate')}
                                />
                            </div>

                            {/* Status de Garantia */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Status da Garantia
                                </label>
                                <select
                                    className="input"
                                    {...register('warrantyStatus')}
                                >
                                    <option value="">Selecione...</option>
                                    <option value="Em Garantia">✅ Em Garantia</option>
                                    <option value="Fora de Garantia">❌ Fora de Garantia</option>
                                    <option value="Verificar">⚠️ Verificar com Fabricante</option>
                                </select>
                            </div>
                        </div>

                        {/* Código de Erro e Impacto na Geração */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {/* Código de Erro */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    <AlertTriangle className="h-3 w-3 inline mr-1 text-amber-500" />
                                    Código de Erro
                                </label>
                                <input
                                    type="text"
                                    className="input font-mono"
                                    placeholder="Ex: E001, Falha ISO, F24..."
                                    {...register('errorCode')}
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Código exibido no inversor ou monitoramento
                                </p>
                            </div>

                            {/* Impacto na Geração */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    <Zap className="h-3 w-3 inline mr-1 text-yellow-500" />
                                    Impacto na Geração
                                </label>
                                <select
                                    className="input"
                                    {...register('generationImpact')}
                                >
                                    <option value="">Selecione...</option>
                                    {GENERATION_IMPACT.map((impact) => (
                                        <option key={impact.value} value={impact.value}>
                                            {impact.icon} {impact.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Ações Já Executadas - Checkboxes */}
                        <div className="mb-4">
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Ações Já Executadas
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { value: 'diagnostico_remoto', label: 'Diagnóstico Remoto' },
                                    { value: 'reset_fisico', label: 'Reset Físico' },
                                    { value: 'atualizacao_firmware', label: 'Atualização Firmware' },
                                    { value: 'acionamento_fabricante', label: 'Acionamento Fabricante' },
                                    { value: 'visita_tecnica', label: 'Visita Técnica' },
                                    { value: 'troca_componente', label: 'Troca de Componente' },
                                ].map((action) => (
                                    <label key={action.value} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                        <input
                                            type="checkbox"
                                            value={action.value}
                                            {...register('actionsExecuted')}
                                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                        />
                                        {action.label}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Alerta de Parada Total */}
                        {(selectedCategory === 'parada_total' || watch('generationImpact') === 'parada_total') && (
                            <div className="mt-4 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800">
                                <p className="font-medium flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4" />
                                    🔴 Usina em Parada Total
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
