import { useState } from 'react';
import { Plus, Trash2, Download, AlertTriangle, FolderKanban } from 'lucide-react';
import { useProjects } from '../../hooks/useProjects';
import { exportService } from '../../services/exportService';
import { Button } from '../Button';
import toast from 'react-hot-toast';

/**
 * Componente de Gerenciamento de Projetos
 * Permite criar, editar, deletar e exportar projetos
 */
export const ProjectManagement = () => {
    const { projects, createProject, updateProject, deleteProject, initializeDefaultProjects } = useProjects();
    const [showNewProjectForm, setShowNewProjectForm] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectDescription, setNewProjectDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreateProject = async (e) => {
        e.preventDefault();
        if (!newProjectName.trim()) {
            toast.error('Nome do projeto é obrigatório');
            return;
        }

        setLoading(true);
        const result = await createProject({
            name: newProjectName.trim(),
            description: newProjectDescription.trim(),
            active: true,
        });

        if (result.success) {
            setNewProjectName('');
            setNewProjectDescription('');
            setShowNewProjectForm(false);
        }
        setLoading(false);
    };

    const handleToggleActive = async (project) => {
        setLoading(true);
        await updateProject(project.id, { active: !project.active });
        setLoading(false);
    };

    const handleDeleteProject = async (project) => {
        if (!window.confirm(`Tem certeza que deseja deletar o projeto "${project.name}"?\n\nATENÇÃO: Os dados (clientes, tickets) NÃO serão deletados automaticamente. Exporte os dados antes de deletar o projeto.`)) {
            return;
        }

        setLoading(true);
        await deleteProject(project.id);
        setLoading(false);
    };

    const handleExportProject = async (project) => {
        setLoading(true);
        try {
            await exportService.exportProjectData(project.id, project.name);
            toast.success(`Dados do projeto "${project.name}" exportados com sucesso!`);
        } catch (error) {
            toast.error('Erro ao exportar dados do projeto');
            console.error(error);
        }
        setLoading(false);
    };

    const handleInitializeDefaults = async () => {
        if (!window.confirm('Deseja inicializar os projetos padrão (EGS e Era Verde)?')) {
            return;
        }

        setLoading(true);
        await initializeDefaultProjects();
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Projetos
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Gerencie os projetos do sistema
                    </p>
                </div>
                <div className="flex gap-2">
                    {projects.length === 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleInitializeDefaults}
                            disabled={loading}
                        >
                            <FolderKanban className="h-4 w-4 mr-2" />
                            Inicializar Projetos Padrão
                        </Button>
                    )}
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setShowNewProjectForm(!showNewProjectForm)}
                        disabled={loading}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Projeto
                    </Button>
                </div>
            </div>

            {/* New Project Form */}
            {showNewProjectForm && (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <form onSubmit={handleCreateProject} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Nome do Projeto *
                            </label>
                            <input
                                type="text"
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                placeholder="Ex: EGS, Era Verde"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Descrição
                            </label>
                            <textarea
                                value={newProjectDescription}
                                onChange={(e) => setNewProjectDescription(e.target.value)}
                                placeholder="Descrição opcional do projeto"
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                disabled={loading}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button type="submit" variant="primary" size="sm" disabled={loading}>
                                Criar Projeto
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setShowNewProjectForm(false);
                                    setNewProjectName('');
                                    setNewProjectDescription('');
                                }}
                                disabled={loading}
                            >
                                Cancelar
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Projects List */}
            <div className="space-y-3">
                {projects.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <FolderKanban className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 dark:text-gray-400">
                            Nenhum projeto cadastrado
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                            Clique em "Inicializar Projetos Padrão" ou "Novo Projeto" para começar
                        </p>
                    </div>
                ) : (
                    projects.map((project) => (
                        <div
                            key={project.id}
                            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                            {project.name}
                                        </h3>
                                        <span
                                            className={`px-2 py-1 text-xs font-medium rounded-full ${project.active
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                                                }`}
                                        >
                                            {project.active ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </div>
                                    {project.description && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            {project.description}
                                        </p>
                                    )}
                                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                        ID: {project.id}
                                    </p>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleExportProject(project)}
                                        disabled={loading}
                                        title="Exportar dados do projeto"
                                    >
                                        <Download className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleToggleActive(project)}
                                        disabled={loading}
                                    >
                                        {project.active ? 'Desativar' : 'Ativar'}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDeleteProject(project)}
                                        disabled={loading}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                        title="Deletar projeto"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Warning */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-800 dark:text-yellow-200">
                        <p className="font-medium mb-1">Atenção ao deletar projetos</p>
                        <p>
                            Deletar um projeto NÃO remove automaticamente os dados associados (clientes, tickets, etc).
                            Sempre exporte os dados antes de deletar um projeto.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
