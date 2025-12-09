import { useState, useEffect } from 'react';
import { Plus, Search, Users, UserCheck, UserX } from 'lucide-react';
import { useClients } from '../hooks/useClients';
import { ClientsList } from '../components/clients/ClientsList';
import { ClientModal } from '../components/clients/ClientModal';
import { ClientDetailsPanel } from '../components/clients/ClientDetailsPanel';
import { Button, ListPageSkeleton, ConfirmDialog, Pagination } from '../components';
import { cn } from '../utils/cn';

export const ClientsPage = () => {
    const {
        clients,
        loading,
        error,
        metrics,
        searchTerm,
        createClient,
        updateClient,
        deleteClient,
        searchClients,
        fetchClients,
    } = useClients();

    const [selectedClient, setSelectedClient] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [localSearchTerm, setLocalSearchTerm] = useState('');
    const [confirmDelete, setConfirmDelete] = useState(null);

    // ✅ P2-4: States de paginação
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [totalPages, setTotalPages] = useState(1);

    // Cursores para paginação
    const [nextPageCursor, setNextPageCursor] = useState(null);
    const [cursorStack, setCursorStack] = useState([]);

    // Carregar dados iniciais (Página 1)
    useEffect(() => {
        const loadInitialData = async () => {
            const result = await fetchClients({ pageSize });
            if (result && result.lastDoc) {
                setNextPageCursor(result.lastDoc);
            } else {
                setNextPageCursor(null);
            }
            setCursorStack([]);
            setCurrentPage(1);
        };

        loadInitialData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pageSize]);

    // Atualizar total de páginas baseado nas métricas
    useEffect(() => {
        if (metrics?.total) {
            setTotalPages(Math.ceil(metrics.total / pageSize));
        }
    }, [metrics, pageSize]);

    // Handlers de Paginação
    const handlePageChange = async (newPage) => {
        // Próxima Página
        if (newPage > currentPage) {
            if (!nextPageCursor) return;

            const cursorUsed = nextPageCursor;
            setCursorStack(prev => [...prev, cursorUsed]);

            const result = await fetchClients({
                pageSize,
                lastDoc: cursorUsed
            });

            setNextPageCursor(result.lastDoc || null);
            setCurrentPage(newPage);
        }

        // Página Anterior
        else if (newPage < currentPage) {
            // Volta para página anterior removendo o último cursor
            const newStack = cursorStack.slice(0, newPage - 1);
            const cursorToUse = newStack.length > 0 ? newStack[newStack.length - 1] : null;

            setCursorStack(newStack);

            const result = await fetchClients({
                pageSize,
                lastDoc: cursorToUse
            });

            setNextPageCursor(result.lastDoc || null);
            setCurrentPage(newPage);
        }
    };

    const handlePageSizeChange = (newSize) => {
        setPageSize(newSize);
    };

    // Busca com debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            searchClients(localSearchTerm);
        }, 300);

        return () => clearTimeout(timer);
    }, [localSearchTerm, searchClients]);

    const handleCreateClient = () => {
        setEditingClient(null);
        setModalOpen(true);
    };

    const handleEditClient = (client) => {
        setEditingClient(client);
        setModalOpen(true);
    };

    const handleSubmit = async (data) => {
        if (editingClient) {
            return await updateClient(editingClient.id, data);
        } else {
            return await createClient(data);
        }
    };

    const handleDeleteClick = (client) => {
        setConfirmDelete(client);
    };

    const handleConfirmDelete = async () => {
        if (confirmDelete) {
            await deleteClient(confirmDelete.id);
            setConfirmDelete(null);
            setSelectedClient(null);
        }
    };

    // ✅ SOLUÇÃO P2-2: Loading State com Skeleton
    if (loading && clients.length === 0) {
        return <ListPageSkeleton />;
    }

    return (
        <div className="h-full flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Clientes</h1>
                    <p className="mt-1 text-gray-600 dark:text-gray-400">
                        Gerencie todos os seus clientes
                    </p>
                </div>
                <Button onClick={handleCreateClient}>
                    <Plus className="h-4 w-4" />
                    Novo Cliente
                </Button>
            </div>

            {/* Métricas */}
            {metrics && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <MetricCard
                        icon={Users}
                        label="Total"
                        value={metrics.total}
                        variant="default"
                    />
                    <MetricCard
                        icon={UserCheck}
                        label="Ativos"
                        value={metrics.active}
                        variant="success"
                    />
                    <MetricCard
                        icon={UserX}
                        label="Inativos"
                        value={metrics.inactive}
                        variant="default"
                    />
                </div>
            )}

            {/* Busca */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Buscar por nome, email, telefone, CPF/CNPJ..."
                    value={localSearchTerm}
                    onChange={(e) => setLocalSearchTerm(e.target.value)}
                    className="input pl-10"
                />
            </div>

            {/* Erro */}
            {error && (
                <div className="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                    <p className="text-red-900 dark:text-red-100">{error}</p>
                </div>
            )}

            {/* Conteúdo Principal */}
            <div className="flex-1 flex gap-6 min-h-0">
                {/* Lista de Clientes */}
                <div className={cn('flex-1 min-w-0', selectedClient && 'lg:flex-[2]')}>
                    <ClientsList
                        clients={clients}
                        onSelectClient={setSelectedClient}
                        selectedClientId={selectedClient?.id}
                        className="h-full"
                    />
                </div>

                {/* Painel de Detalhes (Desktop) */}
                {selectedClient && (
                    <div className="hidden lg:block lg:w-96 xl:w-[28rem]">
                        <ClientDetailsPanel
                            client={selectedClient}
                            onUpdate={updateClient}
                            onDelete={() => handleDeleteClick(selectedClient)}
                            onEdit={() => handleEditClient(selectedClient)}
                            onClose={() => setSelectedClient(null)}
                            className="sticky top-0"
                        />
                    </div>
                )}
            </div>

            {/* ✅ P2-4: Paginação */}
            {clients.length > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={metrics?.total || clients.length}
                    pageSize={pageSize}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    pageSizeOptions={[10, 20, 50, 100]}
                    showPageSize={true}
                    showInfo={true}
                    loading={loading}
                />
            )}

            {/* Modal de Criação/Edição */}
            <ClientModal
                isOpen={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setEditingClient(null);
                }}
                onSubmit={handleSubmit}
                client={editingClient}
            />

            {/* ✅ SOLUÇÃO P2-1: Modal de Confirmação de Deleção */}
            <ConfirmDialog
                isOpen={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Excluir Cliente"
                message={`Tem certeza que deseja excluir ${confirmDelete?.name || confirmDelete?.nome}? Todos os dados associados a este cliente serão permanentemente removidos.`}
                confirmText="Excluir Cliente"
                cancelText="Cancelar"
                variant="danger"
            />

            {/* Modal de Detalhes (Mobile) */}
            {selectedClient && (
                <div className="lg:hidden fixed inset-0 z-50 bg-white dark:bg-gray-900">
                    <ClientDetailsPanel
                        client={selectedClient}
                        onUpdate={updateClient}
                        onDelete={() => handleDeleteClick(selectedClient)}
                        onEdit={() => {
                            handleEditClient(selectedClient);
                            setSelectedClient(null);
                        }}
                        onClose={() => setSelectedClient(null)}
                    />
                </div>
            )}
        </div>
    );
};

/**
 * Card de métrica
 */
const MetricCard = ({ icon: Icon, label, value, variant = 'default' }) => {
    const variants = {
        default: 'bg-gray-50 dark:bg-gray-800',
        success: 'bg-green-50 dark:bg-green-900/20',
    };

    return (
        <div className={cn('rounded-lg p-4', variants[variant])}>
            <div className="flex items-center gap-3">
                <div className="rounded-full bg-white dark:bg-gray-900 p-2">
                    <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
                </div>
            </div>
        </div>
    );
};
