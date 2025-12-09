import { useState } from 'react';
import { Database, FileText, Settings, FolderKanban } from 'lucide-react';
import { BaseImporter } from '../components/import/BaseImporter';
import { InvoiceImporter } from '../components/import/InvoiceImporter';
import { ProjectManagement } from '../components/admin/ProjectManagement';
import { useCurrentBase } from '../stores/useStore';
import { cn } from '../utils/cn';

/**
 * Página de Administração
 * Acesso aos importadores e configurações
 */
export const AdminPage = () => {
    const [activeTab, setActiveTab] = useState('projects'); // projects, base, invoices
    const currentBase = useCurrentBase();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Administração
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Gerenciamento de projetos, importação de dados e configurações do sistema
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800">
                <TabButton
                    active={activeTab === 'projects'}
                    onClick={() => setActiveTab('projects')}
                    icon={FolderKanban}
                >
                    Gerenciar Projetos
                </TabButton>
                <TabButton
                    active={activeTab === 'base'}
                    onClick={() => setActiveTab('base')}
                    icon={Database}
                >
                    Importar Base de Clientes
                </TabButton>
                <TabButton
                    active={activeTab === 'invoices'}
                    onClick={() => setActiveTab('invoices')}
                    icon={FileText}
                >
                    Importar Faturas
                </TabButton>
            </div>

            {/* Content */}
            <div className="max-w-4xl">
                {activeTab === 'projects' && <ProjectManagement />}

                {activeTab === 'base' && (
                    <BaseImporter
                        database={currentBase?.id || 'EGS'}
                        onComplete={(results) => {
                            console.log('Importação de base concluída:', results);
                        }}
                    />
                )}

                {activeTab === 'invoices' && (
                    <InvoiceImporter
                        database={currentBase?.id || 'EGS'}
                        onComplete={(results) => {
                            console.log('Importação de faturas concluída:', results);
                        }}
                    />
                )}
            </div>
        </div>
    );
};

/**
 * Tab Button Component
 */
const TabButton = ({ active, onClick, icon: Icon, children }) => (
    <button
        onClick={onClick}
        className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            active
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
        )}
    >
        <Icon className="h-4 w-4" />
        {children}
    </button>
);
