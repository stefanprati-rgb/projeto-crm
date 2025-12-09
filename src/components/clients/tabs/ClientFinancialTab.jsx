/**
 * Aba Financeiro do Cliente
 * 
 * Exibe informações de faturamento, faturas e contratos.
 */

import { DollarSign, CreditCard, AlertTriangle, CheckCircle, Clock, TrendingUp, Calendar, FileText } from 'lucide-react';
import { Badge } from '../../';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '../../../utils/formatters';
import { Labels, StatusColors } from '../../../types/client.types';
import { cn } from '../../../utils/cn';

export const ClientFinancialTab = ({ client, onUpdate }) => {
    const faturamento = client.faturamento || {};
    const faturas = client.faturas || client.invoices || [];
    const contratos = client.contratos || [];

    // Calcular métricas
    const metrics = {
        totalFaturado: faturamento.totalFaturado || 0,
        totalPago: faturamento.totalPago || 0,
        saldoEmAberto: faturamento.saldoEmAberto || 0,
        totalVencido: faturamento.totalVencido || 0,
        inadimplente: faturamento.inadimplente || false
    };

    return (
        <div className="space-y-6">
            {/* Resumo Financeiro */}
            <Section title="Resumo Financeiro">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricCard
                        label="Total Faturado"
                        value={formatCurrency(metrics.totalFaturado)}
                        icon={TrendingUp}
                        color="text-blue-600"
                        bgColor="bg-blue-50 dark:bg-blue-900/20"
                    />
                    <MetricCard
                        label="Total Pago"
                        value={formatCurrency(metrics.totalPago)}
                        icon={CheckCircle}
                        color="text-green-600"
                        bgColor="bg-green-50 dark:bg-green-900/20"
                    />
                    <MetricCard
                        label="Em Aberto"
                        value={formatCurrency(metrics.saldoEmAberto)}
                        icon={Clock}
                        color="text-yellow-600"
                        bgColor="bg-yellow-50 dark:bg-yellow-900/20"
                    />
                    <MetricCard
                        label="Vencido"
                        value={formatCurrency(metrics.totalVencido)}
                        icon={AlertTriangle}
                        color="text-red-600"
                        bgColor="bg-red-50 dark:bg-red-900/20"
                    />
                </div>

                {/* Informações Adicionais */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <InfoRow
                        icon={Calendar}
                        label="Dia de Vencimento"
                        value={faturamento.diaVencimento || '-'}
                    />
                    <InfoRow
                        icon={CreditCard}
                        label="Forma de Pagamento"
                        value={Labels.PaymentMethod[faturamento.formaPagamento] || faturamento.formaPagamento || '-'}
                    />
                    {faturamento.ultimoPagamento && (
                        <InfoRow
                            icon={CheckCircle}
                            label="Último Pagamento"
                            value={format(new Date(faturamento.ultimoPagamento), 'dd/MM/yyyy', { locale: ptBR })}
                        />
                    )}
                    {faturamento.proximoVencimento && (
                        <InfoRow
                            icon={Clock}
                            label="Próximo Vencimento"
                            value={format(new Date(faturamento.proximoVencimento), 'dd/MM/yyyy', { locale: ptBR })}
                        />
                    )}
                </div>

                {/* Alerta de Inadimplência */}
                {metrics.inadimplente && (
                    <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            <span className="font-semibold text-red-900 dark:text-red-100">
                                Cliente Inadimplente
                            </span>
                        </div>
                        {faturamento.diasAtraso > 0 && (
                            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                                {faturamento.diasAtraso} dias de atraso
                            </p>
                        )}
                    </div>
                )}
            </Section>

            {/* Faturas */}
            <Section title={`Faturas (${faturas.length})`}>
                {faturas.length === 0 ? (
                    <EmptyState message="Nenhuma fatura cadastrada" />
                ) : (
                    <div className="space-y-3">
                        {faturas.map((fatura, index) => (
                            <InvoiceCard key={fatura.id || index} fatura={fatura} />
                        ))}
                    </div>
                )}
            </Section>

            {/* Contratos */}
            {contratos.length > 0 && (
                <Section title={`Contratos (${contratos.length})`}>
                    <div className="space-y-3">
                        {contratos.map((contrato, index) => (
                            <ContractCard key={contrato.id || index} contrato={contrato} />
                        ))}
                    </div>
                </Section>
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
 * Card de Fatura
 */
const InvoiceCard = ({ fatura }) => {
    const statusColor = StatusColors.InvoiceStatus[fatura.status] || 'default';
    const statusLabel = Labels.InvoiceStatus[fatura.status] || fatura.status;

    return (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between mb-3">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {fatura.competencia || 'Sem competência'}
                        </span>
                        <Badge variant={statusColor}>
                            {statusLabel}
                        </Badge>
                    </div>
                    {fatura.numero && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            NF: {fatura.numero}
                        </p>
                    )}
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(fatura.valor)}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
                {fatura.dataVencimento && (
                    <div>
                        <span className="text-gray-500 dark:text-gray-400">Vencimento:</span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                            {format(new Date(fatura.dataVencimento), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                    </div>
                )}
                {fatura.dataPagamento && (
                    <div>
                        <span className="text-gray-500 dark:text-gray-400">Pagamento:</span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                            {format(new Date(fatura.dataPagamento), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                    </div>
                )}
            </div>

            {fatura.boletoUrl && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <a
                        href={fatura.boletoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                    >
                        Ver Boleto →
                    </a>
                </div>
            )}
        </div>
    );
};

/**
 * Card de Contrato
 */
const ContractCard = ({ contrato }) => {
    const statusColor = StatusColors.ContractStatus[contrato.status] || 'default';
    const statusLabel = Labels.ContractStatus[contrato.status] || contrato.status;
    const typeLabel = Labels.ContractType[contrato.tipo] || contrato.tipo;

    return (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between mb-3">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {contrato.numero}
                        </span>
                        <Badge variant={statusColor}>
                            {statusLabel}
                        </Badge>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {typeLabel}
                    </p>
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(contrato.valorTotal)}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
                {contrato.dataInicio && (
                    <div>
                        <span className="text-gray-500 dark:text-gray-400">Início:</span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                            {format(new Date(contrato.dataInicio), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                    </div>
                )}
                {contrato.dataFim && (
                    <div>
                        <span className="text-gray-500 dark:text-gray-400">Fim:</span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                            {format(new Date(contrato.dataFim), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                    </div>
                )}
                {contrato.valorMensal > 0 && (
                    <div>
                        <span className="text-gray-500 dark:text-gray-400">Mensal:</span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                            {formatCurrency(contrato.valorMensal)}
                        </span>
                    </div>
                )}
            </div>

            {contrato.documentoUrl && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <a
                        href={contrato.documentoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                    >
                        Ver Contrato →
                    </a>
                </div>
            )}
        </div>
    );
};

/**
 * Seção
 */
const Section = ({ title, children }) => (
    <div className="pt-6 first:pt-0 border-t border-gray-200 dark:border-gray-800 first:border-t-0">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {title}
        </h3>
        {children}
    </div>
);

/**
 * Info Row
 */
const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-gray-400" />
        <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{value}</p>
        </div>
    </div>
);

/**
 * Empty State
 */
const EmptyState = ({ message }) => (
    <div className="text-center py-8">
        <FileText className="h-12 w-12 mx-auto text-gray-400 mb-3" />
        <p className="text-gray-600 dark:text-gray-400">{message}</p>
    </div>
);
