/**
 * Modal de Detalhes do Cliente - Full Width
 * 
 * Modal responsivo que ocupa toda a largura da tela,
 * com sistema de abas para organizar informações do cliente.
 */

import { useState, useEffect } from 'react';
import { X, Edit2, Trash2, Info, Briefcase, CreditCard, Wrench, Package } from 'lucide-react';
import { Button, Badge } from '../';
import { cn } from '../../utils/cn';
import { Labels, StatusColors } from '../../types/client.types';

// Importar abas
import { ClientOverviewTab } from './tabs/ClientOverviewTab';
import { ClientProjectsTab } from './tabs/ClientProjectsTab';
import { ClientFinancialTab } from './tabs/ClientFinancialTab';
import { ClientTechnicalTab } from './tabs/ClientTechnicalTab';
import { ClientEquipmentsTab } from './tabs/ClientEquipmentsTab';

export const ClientDetailsModal = ({
    client,
    isOpen,
    onClose,
    onUpdate,
    onDelete,
    onEdit
}) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [deleting, setDeleting] = useState(false);

    // Reset tab quando abrir modal
    useEffect(() => {
        if (isOpen) {
            setActiveTab('overview');
        }
    }, [isOpen]);

    // Fechar com ESC
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    // Prevenir scroll do body quando modal aberto
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen || !client) return null;

    const isActive = client.status === 'ATIVO' || client.status === 'active';
    const statusColor = StatusColors.ClientStatus[client.status] || 'default';

    const handleDelete = async () => {
        if (!window.confirm(`Tem certeza que deseja remover ${client.nome}? Esta ação não pode ser desfeita.`)) {
            return;
        }

        setDeleting(true);
        try {
            await onDelete(client.id);
            onClose();
        } catch (error) {
            console.error('Erro ao deletar cliente:', error);
            alert('Erro ao deletar cliente. Tente novamente.');
        } finally {
            setDeleting(false);
        }
    };

    // Contar itens para badges
    const projectsCount = client.projetos?.length || 0;
    const equipmentsCount = client.equipamentos?.length || 0;
    const invoicesCount = client.faturas?.length || client.invoices?.length || 0;
    const installationsCount = client.instalacoes?.length || client.installations?.length || 0;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="absolute inset-0 flex items-start justify-center p-4 overflow-y-auto">
                <div className="relative w-full max-w-7xl bg-white dark:bg-gray-900 rounded-lg shadow-2xl my-8 animate-in fade-in slide-in-from-bottom-4 duration-300">

                    {/* Header Fixo */}
                    <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 rounded-t-lg">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                {/* Avatar */}
                                <div
                                    className={cn(
                                        'h-16 w-16 rounded-full flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 shadow-lg',
                                        isActive ? 'bg-gradient-to-br from-primary-500 to-primary-700' : 'bg-gradient-to-br from-gray-400 to-gray-600'
                                    )}
                                >
                                    {client.nome?.[0]?.toUpperCase() || 'C'}
                                </div>

                                {/* Info Principal */}
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
                                        {client.nome}
                                    </h2>
                                    {client.nomeFantasia && client.nomeFantasia !== client.nome && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                            {client.nomeFantasia}
                                        </p>
                                    )}

                                    {/* Badges */}
                                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                                        <Badge variant={statusColor}>
                                            {Labels.ClientStatus[client.status] || client.status}
                                        </Badge>

                                        {client.segmento && (
                                            <Badge variant="default">
                                                {Labels.ClientSegment[client.segmento] || client.segmento}
                                            </Badge>
                                        )}

                                        {(client.cnpj || client.cpf || client.document) && (
                                            <span className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                                                {client.cnpj || client.cpf || client.document}
                                            </span>
                                        )}

                                        {client.faturamento?.inadimplente && (
                                            <Badge variant="danger">
                                                Inadimplente
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <Button variant="ghost" size="sm" onClick={onEdit}>
                                    <Edit2 className="h-4 w-4 mr-1" />
                                    Editar
                                </Button>
                                <Button variant="ghost" size="sm" onClick={onClose}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800 -mb-px overflow-x-auto">
                            <TabButton
                                active={activeTab === 'overview'}
                                onClick={() => setActiveTab('overview')}
                                icon={Info}
                            >
                                Visão Geral
                            </TabButton>

                            <TabButton
                                active={activeTab === 'projects'}
                                onClick={() => setActiveTab('projects')}
                                icon={Briefcase}
                                badge={projectsCount}
                            >
                                Projetos
                            </TabButton>

                            <TabButton
                                active={activeTab === 'financial'}
                                onClick={() => setActiveTab('financial')}
                                icon={CreditCard}
                                badge={invoicesCount}
                            >
                                Financeiro
                            </TabButton>

                            <TabButton
                                active={activeTab === 'technical'}
                                onClick={() => setActiveTab('technical')}
                                icon={Wrench}
                                badge={installationsCount}
                            >
                                Técnico
                            </TabButton>

                            <TabButton
                                active={activeTab === 'equipments'}
                                onClick={() => setActiveTab('equipments')}
                                icon={Package}
                                badge={equipmentsCount}
                            >
                                Equipamentos
                            </TabButton>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="px-6 py-6 min-h-[400px] max-h-[calc(100vh-300px)] overflow-y-auto">
                        {activeTab === 'overview' && (
                            <ClientOverviewTab client={client} onUpdate={onUpdate} />
                        )}
                        {activeTab === 'projects' && (
                            <ClientProjectsTab client={client} onUpdate={onUpdate} />
                        )}
                        {activeTab === 'financial' && (
                            <ClientFinancialTab client={client} onUpdate={onUpdate} />
                        )}
                        {activeTab === 'technical' && (
                            <ClientTechnicalTab client={client} onUpdate={onUpdate} />
                        )}
                        {activeTab === 'equipments' && (
                            <ClientEquipmentsTab client={client} onUpdate={onUpdate} />
                        )}
                    </div>

                    {/* Footer Fixo */}
                    <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-6 py-4 rounded-b-lg">
                        <div className="flex items-center justify-between">
                            <Button
                                variant="danger"
                                onClick={handleDelete}
                                disabled={deleting}
                            >
                                {deleting ? (
                                    <>
                                        <span className="animate-spin mr-2">⏳</span>
                                        Removendo...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Remover Cliente
                                    </>
                                )}
                            </Button>

                            <div className="flex items-center gap-2">
                                <Button variant="ghost" onClick={onClose}>
                                    Fechar
                                </Button>
                                <Button onClick={onEdit}>
                                    <Edit2 className="h-4 w-4 mr-2" />
                                    Editar Cliente
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * Componente de Tab Button
 */
const TabButton = ({ active, onClick, icon: Icon, badge, children }) => (
    <button
        onClick={onClick}
        className={cn(
            'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap',
            active
                ? 'border-primary-600 text-primary-600 bg-primary-50 dark:bg-primary-900/20'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
        )}
    >
        <Icon className="h-4 w-4" />
        <span>{children}</span>
        {badge !== undefined && badge > 0 && (
            <span className={cn(
                'px-1.5 py-0.5 text-xs font-semibold rounded-full',
                active
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            )}>
                {badge}
            </span>
        )}
    </button>
);
