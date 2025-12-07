import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Mail, Phone, MapPin, Building2, AlertCircle } from 'lucide-react';
import { Badge } from '../Badge';
import { cn } from '../../utils/cn';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const ClientsList = ({ clients, onSelectClient, selectedClientId, className }) => {
    const parentRef = useRef();

    // Virtualização para performance com listas grandes
    const virtualizer = useVirtualizer({
        count: clients.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 120,
        overscan: 5,
    });

    const virtualItems = virtualizer.getVirtualItems();

    if (clients.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                <AlertCircle className="h-12 w-12 mb-4" />
                <p className="text-lg font-medium">Nenhum cliente encontrado</p>
                <p className="text-sm">Cadastre um novo cliente para começar</p>
            </div>
        );
    }

    return (
        <div ref={parentRef} className={cn('h-full overflow-auto', className)}>
            <div
                style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                }}
            >
                {virtualItems.map((virtualItem) => {
                    const client = clients[virtualItem.index];
                    const isSelected = client.id === selectedClientId;
                    const isActive = client.status === 'active' || !client.status;

                    return (
                        <div
                            key={client.id}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: `${virtualItem.size}px`,
                                transform: `translateY(${virtualItem.start}px)`,
                            }}
                            className="px-2 py-1"
                        >
                            <div
                                onClick={() => onSelectClient(client)}
                                className={cn(
                                    'card cursor-pointer transition-all duration-200 h-full',
                                    isSelected
                                        ? 'ring-2 ring-primary-500 shadow-lg'
                                        : 'hover:shadow-md hover:border-primary-200 dark:hover:border-primary-800',
                                    client.pending && 'opacity-60'
                                )}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    {/* Avatar/Inicial */}
                                    <div
                                        className={cn(
                                            'flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center text-white font-semibold text-lg',
                                            isActive
                                                ? 'bg-primary-600'
                                                : 'bg-gray-400'
                                        )}
                                    >
                                        {client.name?.[0]?.toUpperCase() || 'C'}
                                    </div>

                                    {/* Conteúdo Principal */}
                                    <div className="flex-1 min-w-0">
                                        {/* Nome e Status */}
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                                {client.name || 'Sem nome'}
                                            </h3>
                                            <Badge variant={isActive ? 'success' : 'default'}>
                                                {isActive ? 'Ativo' : 'Inativo'}
                                            </Badge>
                                            {client.database && (
                                                <Badge variant="info" className="hidden sm:inline-flex">
                                                    <Building2 className="h-3 w-3 mr-1" />
                                                    {client.database}
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Informações de Contato */}
                                        <div className="space-y-1">
                                            {client.email && (
                                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                    <Mail className="h-3 w-3 flex-shrink-0" />
                                                    <span className="truncate">{client.email}</span>
                                                </div>
                                            )}

                                            {client.phone && (
                                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                    <Phone className="h-3 w-3 flex-shrink-0" />
                                                    <span>{client.phone}</span>
                                                </div>
                                            )}

                                            {client.address && (
                                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                    <MapPin className="h-3 w-3 flex-shrink-0" />
                                                    <span className="truncate">{client.address}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Metadata */}
                                        {client.createdAt && (
                                            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                                Cadastrado{' '}
                                                {formatDistanceToNow(new Date(client.createdAt), {
                                                    addSuffix: true,
                                                    locale: ptBR,
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* CPF/CNPJ */}
                                    {client.cpfCnpj && (
                                        <div className="hidden md:block flex-shrink-0 text-right">
                                            <p className="text-xs text-gray-500 dark:text-gray-400">CPF/CNPJ</p>
                                            <p className="text-sm font-mono text-gray-900 dark:text-gray-100">
                                                {client.cpfCnpj}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
