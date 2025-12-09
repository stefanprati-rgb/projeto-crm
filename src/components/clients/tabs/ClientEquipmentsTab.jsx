/**
 * Aba de Equipamentos do Cliente
 * 
 * Exibe todos os equipamentos instalados com informações de garantia,
 * manutenções e status operacional.
 */

import { Package, Wrench, AlertTriangle, CheckCircle, Calendar, DollarSign, Hash, Factory } from 'lucide-react';
import { Badge } from '../../';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '../../../utils/formatters';
import { Labels, StatusColors } from '../../../types/client.types';
import { cn } from '../../../utils/cn';

export const ClientEquipmentsTab = ({ client, onUpdate }) => {
    const equipamentos = client.equipamentos || [];

    // Calcular métricas
    const metrics = {
        total: equipamentos.length,
        operacionais: equipamentos.filter(e => e.status === 'OPERACIONAL').length,
        manutencao: equipamentos.filter(e => e.status === 'MANUTENCAO').length,
        defeito: equipamentos.filter(e => e.status === 'DEFEITO').length,
        garantiaVencendo: equipamentos.filter(e => {
            if (!e.garantiaAte) return false;
            const dias = differenceInDays(new Date(e.garantiaAte), new Date());
            return dias > 0 && dias <= 90;
        }).length
    };

    return (
        <div className="space-y-6">
            {/* Header com Métricas */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Equipamentos Instalados
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {metrics.total} {metrics.total === 1 ? 'equipamento' : 'equipamentos'} cadastrado{metrics.total === 1 ? '' : 's'}
                </p>
            </div>

            {/* Cards de Métricas */}
            {metrics.total > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricCard
                        label="Operacionais"
                        value={metrics.operacionais}
                        icon={CheckCircle}
                        color="text-green-600"
                        bgColor="bg-green-50 dark:bg-green-900/20"
                    />
                    <MetricCard
                        label="Em Manutenção"
                        value={metrics.manutencao}
                        icon={Wrench}
                        color="text-yellow-600"
                        bgColor="bg-yellow-50 dark:bg-yellow-900/20"
                    />
                    <MetricCard
                        label="Com Defeito"
                        value={metrics.defeito}
                        icon={AlertTriangle}
                        color="text-red-600"
                        bgColor="bg-red-50 dark:bg-red-900/20"
                    />
                    <MetricCard
                        label="Garantia Vencendo"
                        value={metrics.garantiaVencendo}
                        icon={Calendar}
                        color="text-orange-600"
                        bgColor="bg-orange-50 dark:bg-orange-900/20"
                    />
                </div>
            )}

            {/* Lista de Equipamentos */}
            {equipamentos.length === 0 ? (
                <EmptyState />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {equipamentos.map((equipamento, index) => (
                        <EquipmentCard key={equipamento.id || index} equipamento={equipamento} />
                    ))}
                </div>
            )}
        </div>
    );
};

/**
 * Card de Métrica
 */
const MetricCard = ({ label, value, icon: Icon, color, bgColor }) => (
    <div className={cn('rounded-lg p-4', bgColor)}>
        <div className="flex items-center gap-3">
            <Icon className={cn('h-5 w-5', color)} />
            <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">{label}</p>
                <p className={cn('text-lg font-bold', color)}>{value}</p>
            </div>
        </div>
    </div>
);

/**
 * Card de Equipamento
 */
const EquipmentCard = ({ equipamento }) => {
    const statusColor = StatusColors.EquipmentStatus[equipamento.status] || 'default';
    const statusLabel = Labels.EquipmentStatus[equipamento.status] || equipamento.status;
    const typeLabel = Labels.EquipmentType[equipamento.tipo] || equipamento.tipo;

    // Calcular dias até vencimento da garantia
    const diasGarantia = equipamento.garantiaAte
        ? differenceInDays(new Date(equipamento.garantiaAte), new Date())
        : null;

    const garantiaStatus = diasGarantia !== null
        ? diasGarantia < 0
            ? 'vencida'
            : diasGarantia <= 90
                ? 'vencendo'
                : 'ativa'
        : null;

    return (
        <div className="card">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <Package className="h-5 w-5 text-primary-600" />
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {typeLabel}
                        </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {equipamento.marca} {equipamento.modelo}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                        <Badge variant={statusColor}>
                            {statusLabel}
                        </Badge>
                        {garantiaStatus && (
                            <Badge variant={
                                garantiaStatus === 'vencida' ? 'danger' :
                                    garantiaStatus === 'vencendo' ? 'warning' : 'success'
                            }>
                                {garantiaStatus === 'vencida' ? 'Garantia Vencida' :
                                    garantiaStatus === 'vencendo' ? `${diasGarantia}d restantes` : 'Em Garantia'}
                            </Badge>
                        )}
                    </div>
                </div>
            </div>

            {/* Informações Principais */}
            <div className="space-y-3">
                {/* Número de Série */}
                {equipamento.numeroSerie && (
                    <InfoItem
                        icon={Hash}
                        label="Nº Série"
                        value={equipamento.numeroSerie}
                        iconColor="text-gray-500"
                    />
                )}

                {/* Potência */}
                {(equipamento.potencia || equipamento.potenciaTotal) && (
                    <InfoItem
                        icon={Factory}
                        label="Potência"
                        value={`${equipamento.potenciaTotal || equipamento.potencia} kW`}
                        iconColor="text-yellow-500"
                    />
                )}

                {/* Quantidade */}
                {equipamento.quantidade > 1 && (
                    <InfoItem
                        icon={Package}
                        label="Quantidade"
                        value={equipamento.quantidade}
                        iconColor="text-blue-500"
                    />
                )}

                {/* Fornecedor */}
                {equipamento.fornecedor && (
                    <InfoItem
                        icon={Factory}
                        label="Fornecedor"
                        value={equipamento.fornecedor}
                        iconColor="text-purple-500"
                    />
                )}

                {/* Valor de Aquisição */}
                {equipamento.valorAquisicao > 0 && (
                    <InfoItem
                        icon={DollarSign}
                        label="Valor de Aquisição"
                        value={formatCurrency(equipamento.valorAquisicao)}
                        iconColor="text-green-500"
                    />
                )}

                {/* Datas */}
                <div className="pt-2 border-t border-gray-200 dark:border-gray-800 space-y-2">
                    {equipamento.dataInstalacao && (
                        <InfoItem
                            icon={Calendar}
                            label="Instalação"
                            value={format(new Date(equipamento.dataInstalacao), 'dd/MM/yyyy', { locale: ptBR })}
                            iconColor="text-indigo-500"
                        />
                    )}
                    {equipamento.garantiaAte && (
                        <InfoItem
                            icon={Calendar}
                            label="Garantia até"
                            value={format(new Date(equipamento.garantiaAte), 'dd/MM/yyyy', { locale: ptBR })}
                            iconColor={
                                garantiaStatus === 'vencida' ? 'text-red-500' :
                                    garantiaStatus === 'vencendo' ? 'text-orange-500' : 'text-green-500'
                            }
                        />
                    )}
                </div>

                {/* Manutenções */}
                {equipamento.manutencoes && equipamento.manutencoes.length > 0 && (
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
                        <div className="flex items-center gap-2 mb-2">
                            <Wrench className="h-4 w-4 text-gray-400" />
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                Manutenções ({equipamento.manutencoes.length})
                            </span>
                        </div>
                        <div className="space-y-2">
                            {equipamento.manutencoes.slice(0, 3).map((manutencao, index) => (
                                <div
                                    key={index}
                                    className="text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded"
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium text-gray-900 dark:text-gray-100">
                                            {manutencao.tipo || 'Manutenção'}
                                        </span>
                                        {manutencao.data && (
                                            <span className="text-gray-500 dark:text-gray-400">
                                                {format(new Date(manutencao.data), 'dd/MM/yy', { locale: ptBR })}
                                            </span>
                                        )}
                                    </div>
                                    {manutencao.descricao && (
                                        <p className="text-gray-600 dark:text-gray-400 line-clamp-1">
                                            {manutencao.descricao}
                                        </p>
                                    )}
                                </div>
                            ))}
                            {equipamento.manutencoes.length > 3 && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                    + {equipamento.manutencoes.length - 3} manutenções
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Observações */}
                {equipamento.observacoes && (
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                            {equipamento.observacoes}
                        </p>
                    </div>
                )}
            </div>

            {/* Alertas */}
            {(equipamento.status === 'DEFEITO' || garantiaStatus === 'vencendo' || garantiaStatus === 'vencida') && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                    {equipamento.status === 'DEFEITO' && (
                        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                            <AlertTriangle className="h-4 w-4" />
                            <span>Equipamento com defeito - Ação necessária</span>
                        </div>
                    )}
                    {garantiaStatus === 'vencendo' && (
                        <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
                            <AlertTriangle className="h-4 w-4" />
                            <span>Garantia vence em {diasGarantia} dias</span>
                        </div>
                    )}
                    {garantiaStatus === 'vencida' && (
                        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                            <AlertTriangle className="h-4 w-4" />
                            <span>Garantia vencida</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

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
 * Empty State
 */
const EmptyState = () => (
    <div className="text-center py-12">
        <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Nenhum equipamento cadastrado
        </h4>
        <p className="text-gray-600 dark:text-gray-400">
            Os equipamentos instalados aparecerão aqui
        </p>
    </div>
);
