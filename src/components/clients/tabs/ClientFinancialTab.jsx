/**
 * Aba Financeiro do Cliente (V2)
 * 
 * Exibe informações de faturamento e gerenciamento de cobranças.
 */

import { useState, useEffect } from 'react';
import {
    DollarSign,
    AlertTriangle,
    CheckCircle,
    Clock,
    TrendingUp,
    FileText,
    Plus,
    Check
} from 'lucide-react';
import { Badge, Button, Spinner } from '../../';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '../../../utils/formatters';
import { cobrancasService } from '../../../services/cobrancasService';
import { toast } from 'react-hot-toast';
import { cn } from '../../../utils/cn';

export const ClientFinancialTab = ({ client }) => {
    const [cobrancas, setCobrancas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);

    const clienteId = client?.id;

    const loadCobrancas = async () => {
        if (!clienteId) return;
        setLoading(true);
        try {
            const data = await cobrancasService.getCobrancasByCliente(clienteId);
            setCobrancas(data);
        } catch (error) {
            console.error('Erro ao buscar cobranças:', error);
            toast.error('Erro ao carregar dados financeiros');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCobrancas();
    }, [clienteId]);

    // Botão de Teste: Simular Inadimplência
    const handleSimulateInadimplencia = async () => {
        setIsActionLoading(true);
        try {
            await cobrancasService.addCobranca({
                clienteId,
                valor: Math.floor(Math.random() * 500) + 100,
                status: 'inadimplente',
                tipo: 'cobranca_mensal',
                dataVencimento: new Date(),
                competencia: format(new Date(), 'MM/yyyy')
            });
            toast.success('Simulação: Cliente agora está Inadimplente');
            await loadCobrancas();
        } catch (error) {
            toast.error('Erro ao simular');
        } finally {
            setIsActionLoading(false);
        }
    };

    // Botão de Teste: Resolver Pendências
    const handleResolvePendencias = async () => {
        setIsActionLoading(true);
        try {
            const pendentes = cobrancas.filter(c => c.status === 'inadimplente' || c.status === 'aberta');
            await Promise.all(
                pendentes.map(c => cobrancasService.updateStatusCobranca(c.id, 'paga'))
            );
            toast.success('Todas as pendências foram resolvidas!');
            await loadCobrancas();
        } catch (error) {
            toast.error('Erro ao resolver');
        } finally {
            setIsActionLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'paga': return <Badge variant="success">Paga</Badge>;
            case 'inadimplente': return <Badge variant="danger">Inadimplente</Badge>;
            case 'aberta': return <Badge variant="warning">Aberta</Badge>;
            default: return <Badge variant="default">{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Controles de Teste (Kanban Lock Test) */}
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">🛠️ Ferramentas de Teste (Trava Kanban)</p>
                <div className="flex gap-3">
                    <Button
                        onClick={handleSimulateInadimplencia}
                        disabled={isActionLoading}
                        className="bg-red-600 hover:bg-red-700 text-white border-none text-xs"
                    >
                        <AlertTriangle className="h-4 w-4 mr-2" /> Simular Inadimplência
                    </Button>
                    <Button
                        onClick={handleResolvePendencias}
                        disabled={isActionLoading}
                        className="bg-green-600 hover:bg-green-700 text-white border-none text-xs"
                    >
                        <Check className="h-4 w-4 mr-2" /> Resolver Pendências
                    </Button>
                </div>
            </div>

            {/* Listagem de Cobranças */}
            <Section title="Histórico de Cobranças">
                {cobrancas.length === 0 ? (
                    <EmptyState message="Nenhuma cobrança registrada para este cliente." />
                ) : (
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Vencimento</th>
                                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Tipo</th>
                                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-right">Valor</th>
                                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {cobrancas.map((cob) => {
                                    const dateStr = cob.dataVencimento?.toDate
                                        ? format(cob.dataVencimento.toDate(), 'dd/MM/yyyy')
                                        : (cob.dataVencimento ? format(new Date(cob.dataVencimento), 'dd/MM/yyyy') : '-');

                                    return (
                                        <tr key={cob.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 font-medium">{dateStr}</td>
                                            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 capitalize">{cob.tipo?.replace('_', ' ') || 'Cobrança'}</td>
                                            <td className="px-4 py-3 text-sm font-mono font-bold text-gray-900 dark:text-gray-100 text-right">{formatCurrency(cob.valor)}</td>
                                            <td className="px-4 py-3 text-center">{getStatusBadge(cob.status)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Section>
        </div>
    );
};

const Section = ({ title, children }) => (
    <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary-500" />
            {title}
        </h3>
        {children}
    </div>
);

const EmptyState = ({ message }) => (
    <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/20 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
        <FileText className="h-10 w-10 mx-auto text-gray-300 mb-2" />
        <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
    </div>
);
