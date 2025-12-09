import { DollarSign, Phone, MessageCircle, Mail, Handshake, FileText, AlertTriangle, CheckCircle, Building } from 'lucide-react';
import { useClientTimeline } from '../../hooks/useClientTimeline';
import { EmptyState } from '../EmptyState';
import { Skeleton } from '../Skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../../utils/cn';

/**
 * Timeline do Cliente
 * Exibe histórico unificado de faturas e interações
 */
export const ClientTimeline = ({ client }) => {
    const { timelineItems, loading } = useClientTimeline(client);

    if (loading) {
        return (
            <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex gap-3">
                        <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (timelineItems.length === 0) {
        return (
            <EmptyState
                icon={FileText}
                title="Nenhuma atividade registrada"
                message="O histórico de interações e faturas aparecerá aqui."
            />
        );
    }

    return (
        <div className="relative">
            {/* Linha vertical */}
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

            {/* Items da timeline */}
            <div className="space-y-4">
                {timelineItems.map((item, index) => (
                    <TimelineItem
                        key={item.id}
                        item={item}
                        isLast={index === timelineItems.length - 1}
                    />
                ))}
            </div>
        </div>
    );
};

/**
 * Item individual da timeline
 */
const TimelineItem = ({ item, isLast }) => {
    const config = getItemConfig(item);

    return (
        <div className="relative flex gap-3 pl-0">
            {/* Ícone */}
            <div
                className={cn(
                    'relative z-10 flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0',
                    config.bgColor
                )}
            >
                <config.icon className={cn('h-5 w-5', config.iconColor)} />
            </div>

            {/* Conteúdo */}
            <div className="flex-1 pb-4">
                <div className={cn(
                    'p-3 rounded-lg border',
                    config.borderColor,
                    config.cardBg
                )}>
                    {/* Descrição */}
                    <p className="text-sm text-gray-900 dark:text-gray-100 font-medium mb-1">
                        {item.description}
                    </p>

                    {/* Metadata */}
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>{formatTimelineDate(item.createdAt)}</span>
                        {item.createdBy && (
                            <>
                                <span>•</span>
                                <span>{item.createdBy}</span>
                            </>
                        )}
                    </div>

                    {/* Detalhes adicionais para promessas */}
                    {item.eventType === 'promise' && item.metaData && (
                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                            {item.metaData.promiseDate && (
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                    📅 Data: {new Date(item.metaData.promiseDate).toLocaleDateString('pt-BR')}
                                </p>
                            )}
                            {item.metaData.amount && (
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                    💰 Valor: R$ {item.metaData.amount.toFixed(2)}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

/**
 * Configuração visual por tipo de evento
 */
const getItemConfig = (item) => {
    const configs = {
        // Faturas
        invoice_overdue: {
            icon: AlertTriangle,
            iconColor: 'text-red-600 dark:text-red-400',
            bgColor: 'bg-red-100 dark:bg-red-900/20',
            borderColor: 'border-red-200 dark:border-red-800',
            cardBg: 'bg-red-50 dark:bg-red-900/10',
        },
        invoice_open: {
            icon: DollarSign,
            iconColor: 'text-blue-600 dark:text-blue-400',
            bgColor: 'bg-blue-100 dark:bg-blue-900/20',
            borderColor: 'border-blue-200 dark:border-blue-800',
            cardBg: 'bg-blue-50 dark:bg-blue-900/10',
        },
        invoice_paid: {
            icon: CheckCircle,
            iconColor: 'text-green-600 dark:text-green-400',
            bgColor: 'bg-green-100 dark:bg-green-900/20',
            borderColor: 'border-green-200 dark:border-green-800',
            cardBg: 'bg-green-50 dark:bg-green-900/10',
        },

        // Eventos de contato
        call: {
            icon: Phone,
            iconColor: 'text-blue-600 dark:text-blue-400',
            bgColor: 'bg-blue-100 dark:bg-blue-900/20',
            borderColor: 'border-blue-200 dark:border-blue-800',
            cardBg: 'bg-white dark:bg-gray-800',
        },
        whatsapp: {
            icon: MessageCircle,
            iconColor: 'text-green-600 dark:text-green-400',
            bgColor: 'bg-green-100 dark:bg-green-900/20',
            borderColor: 'border-green-200 dark:border-green-800',
            cardBg: 'bg-white dark:bg-gray-800',
        },
        email: {
            icon: Mail,
            iconColor: 'text-purple-600 dark:text-purple-400',
            bgColor: 'bg-purple-100 dark:bg-purple-900/20',
            borderColor: 'border-purple-200 dark:border-purple-800',
            cardBg: 'bg-white dark:bg-gray-800',
        },
        promise: {
            icon: Handshake,
            iconColor: 'text-purple-600 dark:text-purple-400',
            bgColor: 'bg-purple-100 dark:bg-purple-900/20',
            borderColor: 'border-purple-200 dark:border-purple-800',
            cardBg: 'bg-purple-50 dark:bg-purple-900/10',
        },
        visit: {
            icon: Building,
            iconColor: 'text-orange-600 dark:text-orange-400',
            bgColor: 'bg-orange-100 dark:bg-orange-900/20',
            borderColor: 'border-orange-200 dark:border-orange-800',
            cardBg: 'bg-white dark:bg-gray-800',
        },
        note: {
            icon: FileText,
            iconColor: 'text-gray-600 dark:text-gray-400',
            bgColor: 'bg-gray-100 dark:bg-gray-800',
            borderColor: 'border-gray-200 dark:border-gray-700',
            cardBg: 'bg-white dark:bg-gray-800',
        },
    };

    return configs[item.eventType] || configs.note;
};

/**
 * Formata data para exibição na timeline
 */
const formatTimelineDate = (dateStr) => {
    if (!dateStr) return '';

    try {
        const date = new Date(dateStr);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);

        // Se foi há menos de 24 horas, mostra relativo
        if (diffInHours < 24) {
            if (diffInHours < 1) {
                const minutes = Math.floor(diffInHours * 60);
                return `Há ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
            }
            const hours = Math.floor(diffInHours);
            return `Há ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
        }

        // Senão, mostra data formatada
        return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
        return dateStr;
    }
};
