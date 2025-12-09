/**
 * Aba Técnico do Cliente
 * 
 * Exibe informações técnicas das instalações e unidades consumidoras.
 */

import { Zap, MapPin, Gauge, Factory, Calendar, AlertCircle } from 'lucide-react';
import { Badge } from '../../';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatInstallationId } from '../../../utils/formatters';
import { Labels, StatusColors } from '../../../types/client.types';
import { cn } from '../../../utils/cn';

export const ClientTechnicalTab = ({ client, onUpdate }) => {
    const instalacoes = client.instalacoes || [];

    // Fallback para campos legados
    const hasLegacyData = client.installationId || client.voltage || client.meter || client.plantName;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Instalações e Unidades Consumidoras
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {instalacoes.length} {instalacoes.length === 1 ? 'instalação' : 'instalações'} cadastrada{instalacoes.length === 1 ? '' : 's'}
                </p>
            </div>

            {/* Lista de Instalações */}
            {instalacoes.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {instalacoes.map((instalacao, index) => (
                        <InstallationCard key={instalacao.id || index} instalacao={instalacao} />
                    ))}
                </div>
            ) : hasLegacyData ? (
                // Exibir dados legados
                <LegacyInstallationCard client={client} />
            ) : (
                <EmptyState />
            )}

            {/* Múltiplas UCs (Sistema Legado) */}
            {client.installations && client.installations.length > 1 && (
                <Section title="Outras Unidades Consumidoras">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {client.installations.map((uc, index) => (
                            <div
                                key={index}
                                className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                            >
                                <div className="flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-primary-600" />
                                    <span className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">
                                        {formatInstallationId(uc)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </Section>
            )}
        </div>
    );
};

/**
 * Card de Instalação
 */
const InstallationCard = ({ instalacao }) => {
    const statusColor = StatusColors.InstallationStatus[instalacao.status] || 'default';
    const statusLabel = Labels.InstallationStatus[instalacao.status] || instalacao.status;
    const typeLabel = Labels.InstallationType[instalacao.tipo] || instalacao.tipo;

    return (
        <div className="card">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <Zap className="h-5 w-5 text-primary-600" />
                        <span className="font-mono text-lg font-semibold text-primary-600 dark:text-primary-400">
                            UC: {formatInstallationId(instalacao.uc)}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                        <Badge variant={statusColor}>
                            {statusLabel}
                        </Badge>
                        <Badge variant="default">
                            {typeLabel}
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Informações */}
            <div className="space-y-3">
                {/* Usina */}
                {instalacao.usinaName && (
                    <InfoItem
                        icon={Factory}
                        label="Usina"
                        value={instalacao.usinaName}
                        iconColor="text-blue-500"
                    />
                )}

                {/* Tensão */}
                {instalacao.tensao && (
                    <InfoItem
                        icon={Gauge}
                        label="Tensão"
                        value={instalacao.tensao}
                        iconColor="text-yellow-500"
                    />
                )}

                {/* Medidor */}
                {instalacao.medidor && (
                    <InfoItem
                        icon={Gauge}
                        label="Medidor"
                        value={instalacao.medidor}
                        iconColor="text-purple-500"
                    />
                )}

                {/* Número do Medidor */}
                {instalacao.numeroMedidor && (
                    <InfoItem
                        icon={Gauge}
                        label="Nº Medidor"
                        value={instalacao.numeroMedidor}
                        iconColor="text-purple-500"
                    />
                )}

                {/* Distribuidora */}
                {instalacao.distribuidora && (
                    <InfoItem
                        icon={Factory}
                        label="Distribuidora"
                        value={instalacao.distribuidora}
                        iconColor="text-indigo-500"
                    />
                )}

                {/* Endereço */}
                {instalacao.endereco && (
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
                        <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                            <div className="text-sm">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Localização</p>
                                <p className="text-gray-900 dark:text-gray-100">
                                    {instalacao.endereco.rua && `${instalacao.endereco.rua}${instalacao.endereco.numero ? ', ' + instalacao.endereco.numero : ''}`}
                                </p>
                                {instalacao.endereco.cidade && (
                                    <p className="text-gray-600 dark:text-gray-400">
                                        {instalacao.endereco.cidade}{instalacao.endereco.estado ? ' - ' + instalacao.endereco.estado : ''}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Datas */}
                {(instalacao.dataInstalacao || instalacao.dataAtivacao) && (
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-800 space-y-2">
                        {instalacao.dataInstalacao && (
                            <InfoItem
                                icon={Calendar}
                                label="Instalação"
                                value={format(new Date(instalacao.dataInstalacao), 'dd/MM/yyyy', { locale: ptBR })}
                                iconColor="text-green-500"
                            />
                        )}
                        {instalacao.dataAtivacao && (
                            <InfoItem
                                icon={Calendar}
                                label="Ativação"
                                value={format(new Date(instalacao.dataAtivacao), 'dd/MM/yyyy', { locale: ptBR })}
                                iconColor="text-green-500"
                            />
                        )}
                    </div>
                )}

                {/* Observações */}
                {instalacao.observacoes && (
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                            {instalacao.observacoes}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * Card de Instalação Legada
 */
const LegacyInstallationCard = ({ client }) => (
    <div className="card">
        <div className="flex items-start gap-3 mb-4">
            <Zap className="h-6 w-6 text-primary-600" />
            <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                    Instalação Principal
                </h4>
                {client.installationId && (
                    <p className="text-sm font-mono text-primary-600 dark:text-primary-400 mt-1">
                        UC: {formatInstallationId(client.installationId)}
                    </p>
                )}
            </div>
        </div>

        <div className="space-y-3">
            {client.plantName && (
                <InfoItem
                    icon={Factory}
                    label="Usina"
                    value={client.plantName}
                    iconColor="text-blue-500"
                />
            )}
            {client.voltage && (
                <InfoItem
                    icon={Gauge}
                    label="Tensão"
                    value={client.voltage}
                    iconColor="text-yellow-500"
                />
            )}
            {client.meter && (
                <InfoItem
                    icon={Gauge}
                    label="Medidor"
                    value={client.meter}
                    iconColor="text-purple-500"
                />
            )}
        </div>
    </div>
);

/**
 * Item de Informação
 */
const InfoItem = ({ icon: Icon, label, value, iconColor }) => (
    <div className="flex items-center gap-2 text-sm">
        <Icon className={cn('h-4 w-4', iconColor)} />
        <span className="text-gray-600 dark:text-gray-400">{label}:</span>
        <span className="font-medium text-gray-900 dark:text-gray-100">{value}</span>
    </div>
);

/**
 * Seção
 */
const Section = ({ title, children }) => (
    <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {title}
        </h3>
        {children}
    </div>
);

/**
 * Empty State
 */
const EmptyState = () => (
    <div className="text-center py-12">
        <Zap className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Nenhuma instalação cadastrada
        </h4>
        <p className="text-gray-600 dark:text-gray-400">
            As informações técnicas das instalações aparecerão aqui
        </p>
    </div>
);
