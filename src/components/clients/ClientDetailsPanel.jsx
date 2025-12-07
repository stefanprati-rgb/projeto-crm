import { useState } from 'react';
import { X, Mail, Phone, MapPin, FileText, Calendar, User, Edit2, Trash2 } from 'lucide-react';
import { Button, Badge } from '../';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../../utils/cn';

export const ClientDetailsPanel = ({
    client,
    onUpdate,
    onDelete,
    onEdit,
    onClose,
    className,
}) => {
    const [deleting, setDeleting] = useState(false);

    if (!client) return null;

    const isActive = client.status === 'active' || !client.status;

    const handleDelete = async () => {
        if (!window.confirm('Tem certeza que deseja remover este cliente?')) {
            return;
        }

        setDeleting(true);
        try {
            await onDelete(client.id);
            onClose();
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className={cn('card h-full flex flex-col', className)}>
            {/* Header */}
            <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div
                        className={cn(
                            'h-12 w-12 rounded-full flex items-center justify-center text-white font-semibold text-lg',
                            isActive ? 'bg-primary-600' : 'bg-gray-400'
                        )}
                    >
                        {client.name?.[0]?.toUpperCase() || 'C'}
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {client.name || 'Sem nome'}
                        </h2>
                        <Badge variant={isActive ? 'success' : 'default'}>
                            {isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={onEdit}>
                        <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto space-y-4">
                {/* Informações de Contato */}
                <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Informações de Contato
                    </h3>
                    <div className="space-y-3">
                        {client.email && (
                            <InfoRow icon={Mail} label="E-mail" value={client.email} />
                        )}
                        {client.phone && (
                            <InfoRow icon={Phone} label="Telefone" value={client.phone} />
                        )}
                        {client.cpfCnpj && (
                            <InfoRow icon={FileText} label="CPF/CNPJ" value={client.cpfCnpj} />
                        )}
                    </div>
                </div>

                {/* Endereço */}
                {(client.address || client.city || client.state || client.zipCode) && (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Endereço
                        </h3>
                        <div className="space-y-3">
                            {client.address && (
                                <InfoRow icon={MapPin} label="Endereço" value={client.address} />
                            )}
                            {(client.city || client.state) && (
                                <InfoRow
                                    icon={MapPin}
                                    label="Cidade/Estado"
                                    value={`${client.city || ''}${client.city && client.state ? ', ' : ''}${client.state || ''}`}
                                />
                            )}
                            {client.zipCode && (
                                <InfoRow icon={MapPin} label="CEP" value={client.zipCode} />
                            )}
                        </div>
                    </div>
                )}

                {/* Observações */}
                {client.notes && (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Observações
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                            {client.notes}
                        </p>
                    </div>
                )}

                {/* Metadata */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Informações do Sistema
                    </h3>
                    <div className="space-y-3">
                        {client.createdAt && (
                            <InfoRow
                                icon={Calendar}
                                label="Cadastrado em"
                                value={format(new Date(client.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                                    locale: ptBR,
                                })}
                            />
                        )}
                        {client.updatedAt && (
                            <InfoRow
                                icon={Calendar}
                                label="Atualizado em"
                                value={format(new Date(client.updatedAt), "dd/MM/yyyy 'às' HH:mm", {
                                    locale: ptBR,
                                })}
                            />
                        )}
                        {client.createdByEmail && (
                            <InfoRow icon={User} label="Criado por" value={client.createdByEmail} />
                        )}
                    </div>
                </div>
            </div>

            {/* Footer - Ações */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                <Button
                    variant="danger"
                    className="w-full"
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
            </div>
        </div>
    );
};

/**
 * Linha de informação
 */
const InfoRow = ({ icon: Icon, label, value }) => {
    return (
        <div className="flex items-start gap-3">
            <Icon className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-400" />
            <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 break-words">
                    {value}
                </p>
            </div>
        </div>
    );
};
