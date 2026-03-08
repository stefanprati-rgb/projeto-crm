import { useState, useEffect } from 'react';
import { Plus, Search, Users, UserCheck, UserX, Database } from 'lucide-react';
import { useClients } from '../hooks/useClients';
import { useAdvancedSearch } from '../hooks/useAdvancedSearch';
import { ClientsList } from '../components/clients/ClientsList';
import { ClientModal } from '../components/clients/ClientModal';
import { ClientDetailsModal } from '../components/clients/ClientDetailsModal';
import { ClientFilters } from '../components/clients/ClientFilters';
import { ClientImporter } from '../components/import/ClientImporter';
import { RateioImporter } from '../components/import/RateioImporter';
import { LocalErrorBoundary } from '../components/LocalErrorBoundary';
import { Button, ListPageSkeleton, ConfirmDialog, Pagination } from '../components';
import { cn } from '../utils/cn';

export const ClientsPage = () => {
    // Hooks e Estados
    const {
        clients,
        loading,
        error,
        metrics,
        fetchClients,
        createClient,
        updateClient,
        deleteClient,
    } = useClients();

    const [selectedClient, setSelectedClient] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [rateioModalOpen, setRateioModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);

    // -- FILTROS E BUSCA AVANÇADA --
    const [filters, setFilters] = useState({});
    const {
        searchTerm,
        setSearchTerm,
        filteredClients,
        metrics: searchMetrics,
        isSearching,
        hasFilters
    } = useAdvancedSearch(clients, filters);

    // -- LÓGICA DE PAGINAÇÃO --
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [cursorStack, setCursorStack] = useState([]);
    const [lastDoc, setLastDoc] = useState(null);

    // Carregar dados iniciais
    useEffect(() => {
        const loadData = async () => {
            const currentCursor = currentPage === 1 ? null : cursorStack[currentPage - 2];
            const result = await fetchClients({
                pageSize,
                lastDoc: currentCursor,
            });

            if (result && result.lastDoc) {
                setLastDoc(result.lastDoc);
            }
        };

        // Só buscar se não tiver busca/filtros ativos
        if (!isSearching && !hasFilters) {
            loadData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, pageSize, isSearching, hasFilters]);

    // Resetar paginação quando buscar/filtrar
    useEffect(() => {
        if (isSearching || hasFilters) {
            setCurrentPage(1);
            setCursorStack([]);
        }
    }, [isSearching, hasFilters]);

    // Handlers de UI
    const handlePageChange = (newPage) => {
        if (newPage > currentPage && lastDoc) {
            setCursorStack((prev) => [...prev, lastDoc]);
        }
        setCurrentPage(newPage);
    };

    const handlePageSizeChange = (newSize) => {
        setPageSize(newSize);
        setCurrentPage(1);
        setCursorStack([]);
    };

    const handleCreateClient = () => {
        setEditingClient(null);
        setModalOpen(true);
    };

    const handleEditClient = (client) => {
        setEditingClient(client);
        setModalOpen(true);
        setSelectedClient(null); // Fechar modal de detalhes
    };

    const handleSubmit = async (data) => {
        const result = editingClient
            ? await updateClient(editingClient.id, data)
            : await createClient(data);

        if (result?.success) {
            setModalOpen(false);
            setEditingClient(null);
            if (!editingClient) {
                fetchClients({ pageSize });
            }
        }

        return result;
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

    // Renderização Condicional (Skeleton)
    if (loading && clients.length === 0 && !isSearching) {
        return <ListPageSkeleton />;
    }

    // Usar clientes filtrados ou todos
    const displayClients = isSearching || hasFilters ? filteredClients : clients;
    const displayMetrics = isSearching || hasFilters ? searchMetrics : metrics;

    // Cálculo total páginas
    const totalPages = displayMetrics?.total ? Math.ceil(displayMetrics.total / pageSize) : 1;

    return (
        <div className="h-full flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Clientes</h1>
                    <p className="mt-1 text-gray-600 dark:text-gray-400">
                        Gerencie todos os seus clientes de Geração Distribuída
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setRateioModalOpen(true)}>
                        <Database className="h-4 w-4 mr-2" />
                        Atualizar Rateios
                    </Button>
                    <Button variant="outline" onClick={() => setImportModalOpen(true)}>
                        <Database className="h-4 w-4 mr-2" />
                        Importar Base (Raízen)
                    </Button>
                    <Button onClick={handleCreateClient}>
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Cliente
                    </Button>
                </div>
            </div>

            {/* Métricas */}
            {displayMetrics && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <MetricCard
                        icon={Users}
                        label="Total"
                        value={displayMetrics.total}
                        variant="default"
                    />
                    <MetricCard
                        icon={UserCheck}
                        label="Ativos"
                        value={displayMetrics.ativos || displayMetrics.active || 0}
                        variant="success"
                    />
                    <MetricCard
                        icon={UserX}
                        label="Inativos"
                        value={displayMetrics.inativos || displayMetrics.inactive || 0}
                        variant="default"
                    />
                </div>
            )}

            {/* Busca */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Buscar por nome, email, telefone, CPF/CNPJ, UC, projeto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input pl-10"
                />
                {loading && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                        Buscando...
                    </span>
                )}
            </div>

            {/* Filtros Avançados */}
            <ClientFilters
                onFilterChange={setFilters}
                plants={[]} // TODO: Buscar usinas do store
                projects={[]} // TODO: Buscar projetos do store
            />

            {/* Erro */}
            {error && (
                <div className="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                    <p className="text-red-900 dark:text-red-100">{error}</p>
                </div>
            )}

            {/* Conteúdo Principal - Lista de Clientes */}
            <div className="flex-1 min-h-0">
                <ClientsList
                    clients={displayClients}
                    onSelectClient={setSelectedClient}
                    selectedClientId={selectedClient?.id}
                    className="h-full"
                />
            </div>

            {/* Paginação */}
            {!isSearching && !hasFilters && displayClients.length > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={displayMetrics?.total || displayClients.length}
                    pageSize={pageSize}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    pageSizeOptions={[10, 20, 50, 100]}
                    showPageSize={true}
                    showInfo={true}
                    loading={loading}
                />
            )}

            {/* Modal de Detalhes do Cliente (Full-Width) */}
            <ClientDetailsModal
                client={selectedClient}
                isOpen={!!selectedClient}
                onClose={() => setSelectedClient(null)}
                onUpdate={updateClient}
                onDelete={handleDeleteClick}
                onEdit={handleEditClient}
            />

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

            {/* Modal de Importação (Usando uma sobreposição simples para o Importer) */}
            {importModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
                    <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-lg shadow-xl outline-none focus:outline-none">
                        <div className="flex items-start justify-between p-5 border-b border-solid border-gray-200 dark:border-gray-700 rounded-t">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                Importar Dados
                            </h3>
                            <button
                                className="p-1 ml-auto bg-transparent border-0 text-gray-900 dark:text-gray-100 float-right text-3xl leading-none font-semibold outline-none focus:outline-none"
                                onClick={() => setImportModalOpen(false)}
                            >
                                <span className="text-gray-500 h-6 w-6 text-2xl block outline-none focus:outline-none hover:text-gray-800 dark:hover:text-gray-200">
                                    ×
                                </span>
                            </button>
                        </div>
                        <div className="relative p-6 flex-auto max-h-[80vh] overflow-y-auto">
                            <ClientImporter onComplete={(results) => {
                                if (results && results.success > 0) {
                                    fetchClients({ pageSize }); // Recarrega a lista
                                }
                            }} />
                        </div>
                        <div className="flex items-center justify-end p-6 border-t border-solid border-gray-200 dark:border-gray-700 rounded-b">
                            <Button variant="ghost" onClick={() => setImportModalOpen(false)}>
                                Fechar
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Rateio (Usando uma sobreposição simples) */}
            {rateioModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
                    <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-lg shadow-xl outline-none focus:outline-none">
                        <div className="flex items-start justify-between p-5 border-b border-solid border-gray-200 dark:border-gray-700 rounded-t">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                Sincronizar Rateios
                            </h3>
                            <button
                                className="p-1 ml-auto bg-transparent border-0 text-gray-900 dark:text-gray-100 float-right text-3xl leading-none font-semibold outline-none focus:outline-none"
                                onClick={() => setRateioModalOpen(false)}
                            >
                                <span className="text-gray-500 h-6 w-6 text-2xl block outline-none focus:outline-none hover:text-gray-800 dark:hover:text-gray-200">
                                    ×
                                </span>
                            </button>
                        </div>
                        <div className="relative p-6 flex-auto max-h-[80vh] overflow-y-auto">
                            <RateioImporter onComplete={(results) => {
                                if (results && results.success > 0) {
                                    fetchClients({ pageSize }); // Recarrega a lista
                                }
                            }} />
                        </div>
                        <div className="flex items-center justify-end p-6 border-t border-solid border-gray-200 dark:border-gray-700 rounded-b">
                            <Button variant="ghost" onClick={() => setRateioModalOpen(false)}>
                                Fechar
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Confirmação de Deleção */}
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
