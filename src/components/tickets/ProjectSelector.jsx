import { useState, useEffect } from 'react';
import { ChevronDown, Sun, Loader2 } from 'lucide-react';
import { projectService } from '../../services/projectService';
import { cn } from '../../utils/cn';

/**
 * Constantes de tipos de equipamento para energia solar GD
 */
export const EQUIPMENT_TYPES = [
    { value: 'inversor', label: 'Inversor' },
    { value: 'modulo', label: 'Módulo Fotovoltaico' },
    { value: 'string_box', label: 'String Box' },
    { value: 'estrutura', label: 'Estrutura de Fixação' },
    { value: 'cabo', label: 'Cabos/Conectores' },
    { value: 'medidor', label: 'Medidor Bidirecional' },
    { value: 'monitoramento', label: 'Sistema de Monitoramento' },
    { value: 'outros', label: 'Outros' },
];

/**
 * Constantes de impacto na geração
 */
export const GENERATION_IMPACT = [
    { value: 'parada_total', label: 'Parada Total', color: 'red', icon: '🔴' },
    { value: 'parada_parcial', label: 'Parada Parcial', color: 'yellow', icon: '🟡' },
    { value: 'degradacao', label: 'Degradação', color: 'orange', icon: '🟠' },
    { value: 'sem_impacto', label: 'Sem Impacto', color: 'green', icon: '🟢' },
];

/**
 * Componente Selector de Projeto do Cliente
 * Busca projetos de GD do cliente selecionado
 * 
 * @param {object} props
 * @param {string} props.clientId - ID do cliente para filtrar projetos
 * @param {string} props.value - ID do projeto selecionado
 * @param {function} props.onChange - Callback ao mudar seleção (projectId, projectData)
 * @param {string} props.error - Mensagem de erro
 * @param {boolean} props.disabled - Desabilita o seletor
 * @param {string} props.className - Classes CSS extras
 */
export const ProjectSelector = ({
    clientId,
    value,
    onChange,
    error,
    disabled = false,
    className
}) => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);

    // Busca projetos quando o clientId muda
    useEffect(() => {
        if (!clientId) {
            setProjects([]);
            setSelectedProject(null);
            return;
        }

        setLoading(true);

        const unsubscribe = projectService.listen(
            clientId,
            (data) => {
                setProjects(data);
                setLoading(false);

                // Se já tem valor selecionado, encontra o projeto correspondente
                if (value) {
                    const found = data.find(p => p.id === value);
                    setSelectedProject(found || null);
                }
            },
            (err) => {
                console.error('Erro ao carregar projetos:', err);
                setProjects([]);
                setLoading(false);
            }
        );

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [clientId, value]);

    const handleSelect = (project) => {
        setSelectedProject(project);
        setIsOpen(false);
        onChange?.(project.id, project);
    };

    const handleClear = () => {
        setSelectedProject(null);
        setIsOpen(false);
        onChange?.(null, null);
    };

    if (!clientId) {
        return (
            <div className={cn('space-y-1.5', className)}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Projeto/Usina
                </label>
                <div className="input flex items-center gap-2 text-gray-400 bg-gray-50 dark:bg-gray-800/50">
                    <Sun className="h-4 w-4" />
                    <span className="text-sm">Selecione um cliente primeiro</span>
                </div>
            </div>
        );
    }

    return (
        <div className={cn('space-y-1.5 relative', className)}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Projeto/Usina
            </label>

            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled || loading}
                className={cn(
                    'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-sm text-left',
                    error
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 dark:border-gray-600',
                    'bg-white dark:bg-gray-800',
                    'hover:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
            >
                <div className="flex items-center gap-2 min-w-0">
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    ) : (
                        <Sun className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                    )}
                    <span className={cn(
                        'truncate',
                        selectedProject
                            ? 'text-gray-900 dark:text-gray-100'
                            : 'text-gray-400'
                    )}>
                        {loading
                            ? 'Carregando projetos...'
                            : selectedProject
                                ? selectedProject.nome || selectedProject.codigo || 'Projeto selecionado'
                                : projects.length === 0
                                    ? 'Nenhum projeto cadastrado'
                                    : 'Selecione um projeto'
                        }
                    </span>
                </div>
                <ChevronDown className={cn(
                    'h-4 w-4 text-gray-400 flex-shrink-0 transition-transform',
                    isOpen && 'rotate-180'
                )} />
            </button>

            {/* Dropdown de projetos */}
            {isOpen && projects.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {/* Opção de limpar */}
                    {selectedProject && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700"
                        >
                            Limpar seleção
                        </button>
                    )}

                    {projects.map((project) => (
                        <button
                            key={project.id}
                            type="button"
                            onClick={() => handleSelect(project)}
                            className={cn(
                                'w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left',
                                'hover:bg-gray-100 dark:hover:bg-gray-700',
                                'first:rounded-t-lg last:rounded-b-lg',
                                selectedProject?.id === project.id && 'bg-primary-50 dark:bg-primary-900/20'
                            )}
                        >
                            <Sun className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                    {project.nome || project.codigo || 'Projeto sem nome'}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    {project.codigo && (
                                        <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">
                                            {project.codigo}
                                        </span>
                                    )}
                                    {project.potencia && (
                                        <span>{project.potencia} kWp</span>
                                    )}
                                    {project.status && (
                                        <span className={cn(
                                            'px-1.5 py-0.5 rounded text-xs',
                                            project.status === 'ATIVO' && 'bg-green-100 text-green-700',
                                            project.status === 'EM_CONSTRUCAO' && 'bg-yellow-100 text-yellow-700',
                                            project.status === 'PENDENTE' && 'bg-gray-100 text-gray-700'
                                        )}>
                                            {project.status}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Mensagem de erro */}
            {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
        </div>
    );
};
