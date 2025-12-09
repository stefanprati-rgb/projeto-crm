/**
 * Aba de Projetos do Cliente
 * 
 * Exibe todos os projetos de Geração Distribuída do cliente
 * com informações detalhadas, status visual e ações rápidas.
 */

import { useState } from 'react';
import { Plus, Factory, Zap, Calendar, DollarSign, TrendingUp, MapPin, User, FileText, AlertCircle } from 'lucide-react';
import { Button, Badge } from '../../';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '../../../utils/formatters';
import { Labels, StatusColors } from '../../../types/client.types';
import { cn } from '../../../utils/cn';

export const ClientProjectsTab = ({ client, onUpdate }) => {
    const [showAddProject, setShowAddProject] = useState(false);

    const projetos = client.projetos || [];

    // Calcular métricas
    const metrics = {
        total: projetos.length,
        ativos: projetos.filter(p => p.status === 'ATIVO').length,
        emConstrucao: projetos.filter(p => p.status === 'EM_CONSTRUCAO').length,
        potenciaTotal: projetos.reduce((sum, p) => sum + (p.potencia || 0), 0),
        receitaMensal: projetos
            .filter(p => p.status === 'ATIVO')
            .reduce((sum, p) => sum + (p.valorMensalEstimado || 0), 0)
    };

    return (
        <div className="space-y-6">
            {/* Header com Métricas */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Projetos de Geração Distribuída
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {metrics.total} {metrics.total === 1 ? 'projeto' : 'projetos'} cadastrado{metrics.total === 1 ? '' : 's'}
                    </p>
                </div>
                <Button onClick={() => setShowAddProject(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Projeto
                </Button>
            </div>

            {/* Cards de Métricas */}
            {metrics.total > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricCard
                        label="Ativos"
                        value={metrics.ativos}
                        icon={Zap}
                        color="text-green-600"
                        bgColor="bg-green-50 dark:bg-green-900/20"
                    />
                    <MetricCard
                        label="Em Construção"
                        value={metrics.emConstrucao}
                        icon={Factory}
                        color="text-yellow-600"
                        bgColor="bg-yellow-50 dark:bg-yellow-900/20"
                    />
                    <MetricCard
                        label="Potência Total"
                        value={`${metrics.potenciaTotal.toFixed(1)} kW`}
                        icon={TrendingUp}
                        color="text-blue-600"
                        bgColor="bg-blue-50 dark:bg-blue-900/20"
                    />
                    <MetricCard
                        label="Receita Mensal"
                        value={formatCurrency(metrics.receitaMensal)}
                        icon={DollarSign}
                        color="text-purple-600"
                        bgColor="bg-purple-50 dark:bg-purple-900/20"
                    />
                </div>
            )}

            {/* Lista de Projetos */}
            {projetos.length === 0 ? (
                <EmptyState onAdd={() => setShowAddProject(true)} />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {projetos.map((projeto) => (
                        <ProjectCard key={projeto.id} projeto={projeto} />
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
            <div className={cn('rounded-full p-2', bgColor)}>
                <Icon className={cn('h-5 w-5', color)} />
            </div>
            <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">{label}</p>
                <p className={cn('text-lg font-bold', color)}>{value}</p>
            </div>
        </div>
    </div>
);

/**
 * Card de Projeto
 */
const ProjectCard = ({ projeto }) => {
    const statusColor = StatusColors.ProjectStatus[projeto.status] || 'default';
    const statusLabel = Labels.ProjectStatus[projeto.status] || projeto.status;
    const typeLabel = Labels.ProjectType[projeto.tipo] || projeto.tipo;

    return (
        <div className="card hover:shadow-lg transition-all cursor-pointer group">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-semibold text-primary-600 dark:text-primary-400">
                            {projeto.codigo}
                        </span>
                        <Badge variant={statusColor}>
                            {statusLabel}
                        </Badge>
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {projeto.nome}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {typeLabel}
                    </p>
                </div>
            </div>

            {/* Informações Principais */}
            <div className="space-y-3">
                {/* Potência */}
                <InfoItem
                    icon={Zap}
                    label="Potência"
                    value={`${projeto.potencia || 0} kW`}
                    iconColor="text-yellow-500"
                />

                {/* Tipo de Geração */}
                <InfoItem
                    icon={Factory}
                    label="Tipo"
                    value={typeLabel}
                    iconColor="text-blue-500"
                />

                {/* Valor Mensal */}
                {projeto.valorMensalEstimado > 0 && (
                    <InfoItem
                        icon={DollarSign}
                        label="Valor Mensal Estimado"
                        value={formatCurrency(projeto.valorMensalEstimado)}
                        iconColor="text-green-500"
                    />
                )}

                {/* Valor de Investimento */}
                {projeto.valorInvestimento > 0 && (
                    <InfoItem
                        icon={TrendingUp}
                        label="Investimento Total"
                        value={formatCurrency(projeto.valorInvestimento)}
                        iconColor="text-purple-500"
                    />
                )}

                {/* Data de Ativação */}
                {projeto.dataAtivacao && (
                    <InfoItem
                        icon={Calendar}
                        label="Ativado em"
                        value={format(new Date(projeto.dataAtivacao), 'dd/MM/yyyy', { locale: ptBR })}
                        iconColor="text-indigo-500"
                    />
                )}

                {/* Data de Início */}
                {!projeto.dataAtivacao && projeto.dataInicio && (
                    <InfoItem
                        icon={Calendar}
                        label="Iniciado em"
                        value={format(new Date(projeto.dataInicio), 'dd/MM/yyyy', { locale: ptBR })}
                        iconColor="text-indigo-500"
                    />
                )}

                {/* Responsável Técnico */}
                {projeto.responsavelTecnico && (
                    <InfoItem
                        icon={User}
                        label="Responsável Técnico"
                        value={projeto.responsavelTecnico}
                        iconColor="text-gray-500"
                    />
                )}

                {/* Responsável Comercial */}
                {projeto.responsavelComercial && (
                    <InfoItem
                        icon={User}
                        label="Responsável Comercial"
                        value={projeto.responsavelComercial}
                        iconColor="text-gray-500"
                    />
                )}

                {/* Usinas */}
                {projeto.usinas && projeto.usinas.length > 0 && (
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
                        <div className="flex items-center gap-2 mb-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                Usinas ({projeto.usinas.length})
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {projeto.usinas.map((usina, index) => (
                                <span
                                    key={index}
                                    className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded"
                                >
                                    {usina}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Observações */}
                {projeto.observacoes && (
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
                        <div className="flex items-start gap-2">
                            <FileText className="h-4 w-4 text-gray-400 mt-0.5" />
                            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                                {projeto.observacoes}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer com Ações */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {projeto.status === 'EM_CONSTRUCAO' && (
                        <span className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Em andamento
                        </span>
                    )}
                    {projeto.status === 'ATIVO' && (
                        <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            Operacional
                        </span>
                    )}
                </div>
                <Button variant="ghost" size="sm">
                    Ver Detalhes
                </Button>
            </div>
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
 * Estado Vazio
 */
const EmptyState = ({ onAdd }) => (
    <div className="text-center py-12">
        <Factory className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Nenhum projeto cadastrado
        </h4>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
            Adicione o primeiro projeto de Geração Distribuída para este cliente
        </p>
        <Button onClick={onAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Primeiro Projeto
        </Button>
    </div>
);
