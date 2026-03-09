import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Search,
    RefreshCcw,
    Zap,
    MapPin,
    AlertCircle,
    Building2,
    CalendarClock,
    User,
    FileText
} from 'lucide-react';
import { Button, Input, Modal, Spinner } from '../components';
import { toast } from 'react-hot-toast';
import { useClientsV2 } from '../hooks/useClientsV2';
import { PipelineStatus, PIPELINE_STATUS_CONFIG } from '../constants/pipelineStatus';

// Modal component para exibir os detalhes da UC no modo painel
const InstalacaoDetailsModal = ({ isOpen, onClose, instalacao }) => {
    if (!instalacao) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary-500" />
                    <span>Detalhes da Instalação</span>
                </div>
            }
        >
            <div className="space-y-6">
                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">UC</p>
                        <p className="text-2xl font-bold font-mono text-gray-900 dark:text-gray-100">{instalacao.uc || 'S/N'}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-medium text-gray-500">Distribuidora</p>
                        <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{instalacao.distributor || 'N/I'}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase font-semibold flex items-center gap-1">
                            <Building2 className="h-4 w-4" /> Modalidade Tarifária
                        </span>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{instalacao.modalidadeTarifaria || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase font-semibold flex items-center gap-1">
                            <FileText className="h-4 w-4" /> Classe Consumo
                        </span>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{instalacao.classeConsumo || 'N/A'}</p>
                    </div>
                </div>

                <div className="space-y-1">
                    <span className="text-xs text-gray-500 uppercase font-semibold flex items-center gap-1">
                        <MapPin className="h-4 w-4" /> Endereço
                    </span>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{instalacao.enderecoUC || 'Endereço não informado'}</p>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                        <User className="h-4 w-4" /> Vínculo do Cliente
                    </h4>
                    <div className="bg-white dark:bg-gray-800 border-l-4 border-primary-500 p-3 shadow-sm rounded-r-md">
                        <p className="font-semibold text-gray-800 dark:text-gray-200">{instalacao.clienteNome}</p>
                        <p className="text-xs text-gray-500 mt-1">ID Ref: <span className="font-mono">{instalacao.clienteId}</span></p>

                        {/* No futuro, um link real do React Router */}
                        <div className="mt-3">
                            <Button size="sm" variant="secondary" className="w-full text-xs" onClick={() => toast.success('Navegação para o Cliente V2 em breve!')}>
                                Ver Perfil Global do Cliente
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};


export const OnboardingPipelinePage = () => {
    const {
        instalacoesPipeline,
        loading,
        fetchPipelineInstalacoes,
        updateInstalacaoStatus,
        checkPendenciasFinanceiras
    } = useClientsV2();

    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [isActionLoading, setIsActionLoading] = useState(false);

    // Controles do Modal
    const [selectedInstalacao, setSelectedInstalacao] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Estrutura Visual das Colunas
    const BOARD_COLUMNS = Object.keys(PIPELINE_STATUS_CONFIG);
    const RESTRICTED_STAGES = [
        PipelineStatus.SENT_TO_APPORTIONMENT,
        PipelineStatus.APPORTIONMENT_DONE,
        PipelineStatus.WAITING_COMPENSATION,
        PipelineStatus.INVOICED
    ];

    // Debounce na busca
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    useEffect(() => {
        fetchPipelineInstalacoes({ searchTerm: debouncedSearch, pageSize: 200 }); // Listagem otimizada inicial
    }, [debouncedSearch, fetchPipelineInstalacoes]);

    // Lógica do Drag and Drop Nativo
    const handleDragStart = (e, instalacao) => {
        e.dataTransfer.setData('application/json', JSON.stringify(instalacao));
        e.dataTransfer.effectAllowed = 'move';

        // Efeito visual na origem
        setTimeout(() => {
            e.target.style.opacity = '0.5';
        }, 0);
    };

    const handleDragEnd = (e) => {
        e.target.style.opacity = '1';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e, targetStatusId) => {
        e.preventDefault();

        try {
            const instalacaoContent = e.dataTransfer.getData('application/json');
            if (!instalacaoContent) return;

            const instalacao = JSON.parse(instalacaoContent);
            const currentStatus = instalacao.onboarding?.pipelineStatus || PipelineStatus.NEW;

            // Se for a mesma coluna, não faz nada
            if (currentStatus === targetStatusId) return;

            // REGRA DE NEGÓCIO: Verificação Financeira Rigorosa (Phase 4)
            if (RESTRICTED_STAGES.includes(targetStatusId)) {
                setIsActionLoading(true);
                const isBlocked = await checkPendenciasFinanceiras(instalacao.clienteId);

                if (isBlocked) {
                    toast.error(`Ação Bloqueada: '${instalacao.clienteNome}' possui pendências financeiras ativas. Impossível avançar na esteira.`);
                    setIsActionLoading(false);
                    return; // Aborta e não desce o card
                }
            }

            // Atualiza de fato a instalação
            setIsActionLoading(true);
            const result = await updateInstalacaoStatus(instalacao.id, { pipelineStatus: targetStatusId });

            if (result.success) {
                // UI Reactiva já que o Hook vai propagar a alteração se re-fecthar, ou faz local
                await fetchPipelineInstalacoes({ searchTerm: debouncedSearch, pageSize: 200 });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsActionLoading(false);
        }
    };

    // Pre-Processamento Instalações
    const groupedInstalacoes = useMemo(() => {
        const groups = {};
        BOARD_COLUMNS.forEach(key => { groups[key] = []; });

        instalacoesPipeline?.forEach(inst => {
            const s = inst.onboarding?.pipelineStatus || PipelineStatus.NEW;
            if (groups[s]) {
                groups[s].push(inst);
            }
        });
        return groups;
    }, [instalacoesPipeline, BOARD_COLUMNS]);

    return (
        <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Esteira de Onboarding (V2)</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Controle as Instalações (UCs) em Funil Ágil</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Buscar UC ou Nome..."
                            className="pl-9 text-sm h-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button
                        variant="secondary"
                        onClick={() => fetchPipelineInstalacoes({ searchTerm: debouncedSearch, pageSize: 200 })}
                        size="sm"
                        className="flex items-center gap-2 h-9"
                        disabled={loading || isActionLoading}
                    >
                        <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Atualizar
                    </Button>
                </div>
            </div>

            {/* Quadro Kanban Responsivo */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                <div className="flex h-full p-4 gap-4 min-w-max">
                    {BOARD_COLUMNS.map((colKey) => {
                        const config = PIPELINE_STATUS_CONFIG[colKey];
                        const columnItems = groupedInstalacoes[colKey] || [];

                        return (
                            <div
                                key={colKey}
                                className="flex flex-col w-80 max-w-80 flex-shrink-0 bg-gray-100/50 dark:bg-gray-800/80 rounded-xl border border-gray-200 dark:border-gray-700 h-full overflow-hidden"
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, colKey)}
                            >
                                {/* Column Header */}
                                <div className={`p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white/50 dark:bg-gray-800 shadow-sm backdrop-blur-sm`}>
                                    <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200">
                                        {config.label}
                                    </h3>
                                    <span className="bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                                        {columnItems.length}
                                    </span>
                                </div>

                                {/* Column Body */}
                                <div className="flex-1 p-3 overflow-y-auto space-y-3 custom-scrollbar">
                                    {columnItems.length === 0 && !loading && (
                                        <div className="h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center text-gray-400 text-sm font-medium">
                                            Solte aqui
                                        </div>
                                    )}

                                    {columnItems.map((inst) => (
                                        <div
                                            key={inst.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, inst)}
                                            onDragEnd={handleDragEnd}
                                            onClick={() => {
                                                setSelectedInstalacao(inst);
                                                setIsModalOpen(true);
                                            }}
                                            className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 cursor-grab hover:border-primary-400 hover:shadow-md transition-all active:cursor-grabbing group relative"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <span className="text-xs text-gray-500 font-semibold tracking-wider uppercase flex items-center gap-1">
                                                        <Zap className="h-3 w-3 text-yellow-500" /> UC
                                                    </span>
                                                    <h4 className="text-lg font-bold font-mono text-primary-600 dark:text-primary-400">
                                                        {inst.uc || 'S/N'}
                                                    </h4>
                                                </div>
                                                <div className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
                                                    <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase">
                                                        {inst.distributor || 'N/A'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="mt-3 bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg border border-gray-100 dark:border-gray-800">
                                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2 line-clamp-1">
                                                    <User className="h-3 w-3 text-gray-400" />
                                                    {inst.clienteNome || 'Cliente desconhecido'}
                                                </p>
                                            </div>

                                            <div className="mt-3 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 font-medium">
                                                <span className="flex items-center gap-1">
                                                    <Building2 className="h-3 w-3" />
                                                    {inst.modalidadeTarifaria || 'N/D'}
                                                </span>
                                            </div>

                                            {/* Decorador de arrasto hover */}
                                            <div className="absolute inset-x-0 bottom-0 h-1 bg-primary-500 opacity-0 group-hover:opacity-10 rounded-b-xl transition-all" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Modal de Detalhes da Instalação */}
            <InstalacaoDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                instalacao={selectedInstalacao}
            />

            {/* Spinner de overlay global caso ação demorada */}
            {isActionLoading && (
                <div className="fixed inset-0 z-50 bg-white/50 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl flex flex-col items-center gap-4">
                        <Spinner size="lg" className="text-primary-600" />
                        <p className="font-semibold text-gray-700 dark:text-gray-300">Aplicando regras de negócio e movendo UC...</p>
                    </div>
                </div>
            )}
        </div>
    );
};
