import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useProjects } from '../hooks/useProjects';

/**
 * Seletor de Projeto no Header
 * Permite trocar entre projetos (EGS, Era Verde, etc)
 */
export const ProjectSelector = () => {
    const { projects, currentBase, setCurrentBase, loading } = useProjects();

    if (loading || projects.length === 0) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="h-2 w-2 rounded-full bg-gray-400 animate-pulse" />
                <span>Carregando projetos...</span>
            </div>
        );
    }

    const activeProjects = projects.filter((p) => p.active);

    return (
        <Menu as="div" className="relative inline-block text-left">
            <div>
                <Menu.Button className="inline-flex items-center gap-2 rounded-lg bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm ring-1 ring-gray-300 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary-500" />
                        <span className="font-semibold">
                            {currentBase?.name || 'Selecione um projeto'}
                        </span>
                    </div>
                    <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                </Menu.Button>
            </div>

            <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
            >
                <Menu.Items className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-lg bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1">
                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Projetos Ativos
                        </div>
                        {activeProjects.map((project) => (
                            <Menu.Item key={project.id}>
                                {({ active }) => (
                                    <button
                                        onClick={() => setCurrentBase(project)}
                                        className={`
                                            ${active ? 'bg-gray-100 dark:bg-gray-700' : ''}
                                            ${currentBase?.id === project.id ? 'text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-gray-100'}
                                            group flex w-full items-center justify-between px-4 py-2 text-sm transition-colors
                                        `}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`h-2 w-2 rounded-full ${currentBase?.id === project.id
                                                        ? 'bg-primary-500'
                                                        : 'bg-gray-400 dark:bg-gray-600'
                                                    }`}
                                            />
                                            <span className="font-medium">{project.name}</span>
                                        </div>
                                        {currentBase?.id === project.id && (
                                            <CheckIcon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                                        )}
                                    </button>
                                )}
                            </Menu.Item>
                        ))}

                        {activeProjects.length === 0 && (
                            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                                Nenhum projeto ativo
                            </div>
                        )}

                        <div className="border-t border-gray-200 dark:border-gray-700 mt-1 pt-1">
                            <Menu.Item>
                                {({ active }) => (
                                    <button
                                        onClick={() => {
                                            // TODO: Abrir modal de gerenciamento de projetos
                                            console.log('Gerenciar projetos');
                                        }}
                                        className={`
                                            ${active ? 'bg-gray-100 dark:bg-gray-700' : ''}
                                            text-gray-700 dark:text-gray-300 group flex w-full items-center px-4 py-2 text-sm transition-colors
                                        `}
                                    >
                                        <span className="text-xs font-medium">Gerenciar Projetos</span>
                                    </button>
                                )}
                            </Menu.Item>
                        </div>
                    </div>
                </Menu.Items>
            </Transition>
        </Menu>
    );
};
