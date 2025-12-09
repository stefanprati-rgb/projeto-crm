import { useState } from 'react';
import {
    X,
    Mail,
    Phone,
    MapPin,
    FileText,
    Calendar,
    User,
    Edit2,
    Trash2,
    Zap,
    Factory,
    Gauge,
    CreditCard,
    Wrench,
    Info,
} from 'lucide-react';
import { Button, Badge } from '../';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../../utils/cn';
import {
    formatCurrency,
    formatDocument,
    formatPhone,
    formatInstallationId,
} from '../../utils/formatters';
import { QuickActions } from './actions/QuickActions';
import { ClientTimeline } from './ClientTimeline';

export const ClientDetailsPanel = ({
    client,
    onUpdate,
    onDelete,
    onEdit,
    onClose,
    className,
}) => {
    const [deleting, setDeleting] = useState(false);
    const [activeTab, setActiveTab] = useState('overview'); // overview, financial, technical

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
            {/* Breadcrumb - Voltar */}
            <div className="mb-3">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                >
                    ← Voltar para Lista
                </Button>
            </div>

            {/* Header */}
            <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Avatar */}
                    <div
                        className={cn(
                            'h-12 w-12 rounded-full flex items-center justify-center text-white font-semibold text-lg flex-shrink-0',
                            isActive ? 'bg-primary-600' : 'bg-gray-400'
                        )}
                    >
                        {client.name?.[0]?.toUpperCase() || 'C'}
                    </div>

                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {client.name || 'Sem nome'}
                        </h2>

                        {/* Instalação - DESTAQUE */}
                        {client.installationId && (
                            <div className="flex items-center gap-2 mt-1">
                                <Zap className="h-3.5 w-3.5 text-primary-600" />
                                <span className="text-sm font-mono font-medium text-primary-600">
                                    UC: {formatInstallationId(client.installationId)}
                                </span>
                            </div>
                        )}

                        {/* Usina Badge */}
                        <div className="flex items-center gap-2 mt-2">
                            <Badge variant={isActive ? 'success' : 'default'}>
                                {isActive ? 'Ativo' : 'Inativo'}
                            </Badge>
                            {client.plantName && (
                                <Badge variant="default" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                    <Factory className="h-3 w-3 mr-1" />
                                    {client.plantName}
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                    <Button variant="ghost" size="sm" onClick={onEdit}>
                        <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Quick Actions - Ações Rápidas de Cobrança */}
            <div className="mb-4">
                <QuickActions client={client} />
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-4 border-b border-gray-200 dark:border-gray-800">
                <TabButton
                    active={activeTab === 'overview'}
                    onClick={() => setActiveTab('overview')}
                    icon={Info}
                >
                    Visão Geral
                </TabButton>
                <TabButton
                    active={activeTab === 'financial'}
                    onClick={() => setActiveTab('financial')}
                    icon={CreditCard}
                >
                    Financeiro
                </TabButton>
                <TabButton
                    active={activeTab === 'technical'}
                    onClick={() => setActiveTab('technical')}
                    icon={Wrench}
                >
                    Técnico
                </TabButton>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {activeTab === 'overview' && <OverviewTab client={client} />}
                {activeTab === 'financial' && <FinancialTab client={client} />}
                {activeTab === 'technical' && <TechnicalTab client={client} />}
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

/**
 * Overview Tab - Dados Cadastrais
 */
const OverviewTab = ({ client }) => (
    <div className="space-y-4">
        {/* Informações de Contato */}
        <Section title="Informações de Contato">
            {client.email && <InfoRow icon={Mail} label="E-mail" value={client.email} />}
            {client.phone && (
                <InfoRow icon={Phone} label="Telefone" value={formatPhone(client.phone)} />
            )}
            {client.document && (
                <InfoRow icon={FileText} label="CPF/CNPJ" value={formatDocument(client.document)} />
            )}
        </Section>

        {/* Endereço */}
        {(client.address || client.city || client.state || client.zipCode) && (
            <Section title="Endereço">
                {client.address && <InfoRow icon={MapPin} label="Endereço" value={client.address} />}
                {(client.city || client.state) && (
                    <InfoRow
                        icon={MapPin}
                        label="Cidade/Estado"
                        value={`${client.city || ''}${client.city && client.state ? ', ' : ''}${client.state || ''}`}
                    />
                )}
                {client.zipCode && <InfoRow icon={MapPin} label="CEP" value={client.zipCode} />}
            </Section>
        )}

        {/* Observações */}
        {client.notes && (
            <Section title="Observações">
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {client.notes}
                </p>
            </Section>
        )}

        {/* Timeline de Atividades */}
        <Section title="Histórico de Atividades">
            <ClientTimeline client={client} />
        </Section>

        {/* Metadata */}
        <Section title="Informações do Sistema">
            {client.createdAt && (() => {
                try {
                    return (
                        <InfoRow
                            icon={Calendar}
                            label="Cadastrado em"
                            value={format(new Date(client.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                                locale: ptBR,
                            })}
                        />
                    );
                } catch (e) {
                    return <InfoRow icon={Calendar} label="Cadastrado em" value={client.createdAt} />;
                }
            })()}
            {client.updatedAt && (() => {
                try {
                    return (
                        <InfoRow
                            icon={Calendar}
                            label="Atualizado em"
                            value={format(new Date(client.updatedAt), "dd/MM/yyyy 'às' HH:mm", {
                                locale: ptBR,
                            })}
                        />
                    );
                } catch (e) {
                    return <InfoRow icon={Calendar} label="Atualizado em" value={client.updatedAt} />;
                }
            })()}
            {client.createdByEmail && (
                <InfoRow icon={User} label="Criado por" value={client.createdByEmail} />
            )}
        </Section>
    </div>
);

/**
 * Financial Tab - Faturas e Cobranças
 */
const FinancialTab = ({ client }) => (
    <div className="space-y-4">
        <Section title="Faturas">
            {client.invoices && client.invoices.length > 0 ? (
                <div className="space-y-2">
                    {client.invoices.map((invoice, i) => (
                        <div
                            key={i}
                            className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {invoice.competence || 'Sem competência'}
                                </span>
                                <Badge
                                    variant={
                                        invoice.status === 'paid'
                                            ? 'success'
                                            : invoice.status === 'overdue'
                                                ? 'danger'
                                                : 'default'
                                    }
                                >
                                    {invoice.status === 'paid'
                                        ? 'Pago'
                                        : invoice.status === 'overdue'
                                            ? 'Vencido'
                                            : 'Aberto'}
                                </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                    <span className="text-gray-500">Valor:</span>
                                    <span className="ml-1 font-medium text-gray-900 dark:text-gray-100">
                                        {formatCurrency(invoice.amount)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Vencimento:</span>
                                    <span className="ml-1 font-medium text-gray-900 dark:text-gray-100">
                                        {invoice.dueDate}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                    Nenhuma fatura cadastrada
                </p>
            )}
        </Section>
    </div>
);

/**
 * Technical Tab - Dados Técnicos
 */
const TechnicalTab = ({ client }) => (
    <div className="space-y-4">
        <Section title="Dados Técnicos da Instalação">
            {client.installationId && (
                <InfoRow
                    icon={Zap}
                    label="Unidade Consumidora (UC)"
                    value={formatInstallationId(client.installationId)}
                />
            )}
            {client.voltage && (
                <InfoRow icon={Gauge} label="Tensão" value={client.voltage} />
            )}
            {client.meter && (
                <InfoRow icon={Gauge} label="Medidor" value={client.meter} />
            )}
            {client.plantName && (
                <InfoRow icon={Factory} label="Usina" value={client.plantName} />
            )}

            {!client.voltage && !client.meter && !client.plantName && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                    Nenhum dado técnico cadastrado
                </p>
            )}
        </Section>

        {/* Múltiplas Instalações */}
        {client.installations && client.installations.length > 1 && (
            <Section title="Outras Instalações">
                <div className="space-y-2">
                    {client.installations.map((inst, i) => (
                        <div
                            key={i}
                            className="p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
                        >
                            <span className="text-sm font-mono text-gray-900 dark:text-gray-100">
                                {formatInstallationId(inst)}
                            </span>
                        </div>
                    ))}
                </div>
            </Section>
        )}
    </div>
);

/**
 * Section Component
 */
const Section = ({ title, children }) => (
    <div className="pt-4 first:pt-0 border-t border-gray-200 dark:border-gray-800 first:border-t-0">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{title}</h3>
        <div className="space-y-3">{children}</div>
    </div>
);

/**
 * Info Row Component
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
