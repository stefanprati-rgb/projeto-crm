import { useState, useEffect, useRef } from 'react';
import {
    MessageSquare,
    RefreshCw,
    UserCheck,
    PlusCircle,
    AlertCircle,
    Clock,
    Loader2,
    DollarSign
} from 'lucide-react';
import { ticketService } from '../../services/ticketService';
import { CommentInput } from './CommentInput';
import { Badge } from '../';
import { cn } from '../../utils/cn';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { auth } from '../../services/firebase';

/**
 * Componente de Timeline do Ticket - Design de Linha do Tempo Vertical
 * Exibe comentários e eventos do ticket em tempo real com linha conectando os itens
 */
export const TicketTimeline = ({ ticketId, clientId, className }) => {
    const [timeline, setTimeline] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const timelineEndRef = useRef(null);

    const scrollToBottom = () => {
        timelineEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (!ticketId || !clientId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const unsubscribe = ticketService.getTicketTimeline(
            clientId,
            ticketId,
            (data) => {
                setTimeline(data);
                setLoading(false);
                setTimeout(scrollToBottom, 100);
            },
            (err) => {
                console.error('Erro ao carregar timeline:', err);
                setError('Erro ao carregar histórico do ticket');
                setLoading(false);
            }
        );

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [ticketId, clientId]);

    const handleSendComment = async (message) => {
        const user = auth.currentUser;
        await ticketService.addComment(
            clientId,
            ticketId,
            message,
            user?.uid || null,
            user?.email || 'Sistema'
        );
    };

    return (
        <div className={cn('flex flex-col h-full', className)}>
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <MessageSquare className="h-5 w-5 text-primary-600" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Histórico
                </h3>
                {timeline.length > 0 && (
                    <Badge variant="default" className="ml-auto text-xs">
                        {timeline.length}
                    </Badge>
                )}
            </div>

            {/* Timeline com linha vertical */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center py-8 text-red-500">
                        <AlertCircle className="h-5 w-5 mr-2" />
                        <span className="text-sm">{error}</span>
                    </div>
                ) : timeline.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                        <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
                        <span className="text-sm">Nenhum histórico</span>
                    </div>
                ) : (
                    <div className="relative">
                        {/* Linha vertical conectora */}
                        <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary-300 via-gray-200 to-gray-200 dark:from-primary-700 dark:via-gray-700 dark:to-gray-700" />

                        <div className="space-y-4">
                            {timeline.map((item, index) => (
                                <TimelineItem
                                    key={item.id}
                                    item={item}
                                    isLast={index === timeline.length - 1}
                                />
                            ))}
                            <div ref={timelineEndRef} />
                        </div>
                    </div>
                )}
            </div>

            {/* Input de comentário */}
            <CommentInput
                onSubmit={handleSendComment}
                disabled={loading || !ticketId || !clientId}
                placeholder="Adicionar comentário..."
            />
        </div>
    );
};

/**
 * Item da Timeline - Renderiza baseado no tipo
 */
const TimelineItem = ({ item, isLast }) => {
    switch (item.type) {
        case 'comment':
            return <CommentItem item={item} />;
        case 'status_change':
            return <EventItem item={item} icon={RefreshCw} color="yellow" />;
        case 'assignment_change':
            return <EventItem item={item} icon={UserCheck} color="blue" />;
        case 'ticket_created':
            return <EventItem item={item} icon={PlusCircle} color="green" />;
        case 'financial_update':
            return <EventItem item={item} icon={DollarSign} color="green" />;
        default:
            return <EventItem item={item} icon={Clock} color="gray" />;
    }
};

/**
 * Item de Comentário - Balão de chat
 */
const CommentItem = ({ item }) => {
    const isCurrentUser = item.authorId === auth.currentUser?.uid;

    const formatTime = (dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
        } catch {
            return '';
        }
    };

    return (
        <div className="relative pl-10">
            {/* Dot na linha */}
            <div className={cn(
                'absolute left-2.5 top-3 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900',
                isCurrentUser ? 'bg-primary-500' : 'bg-gray-400'
            )} />

            {/* Balão de comentário */}
            <div className={cn(
                'rounded-xl shadow-sm',
                isCurrentUser
                    ? 'bg-primary-500 text-white ml-auto max-w-[85%]'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 max-w-[90%]'
            )}>
                {/* Header do balão */}
                <div className={cn(
                    'px-3 pt-2 pb-1 flex items-center justify-between gap-2',
                    isCurrentUser ? 'text-primary-100' : 'text-gray-500 dark:text-gray-400'
                )}>
                    <span className="text-xs font-medium">
                        {isCurrentUser ? 'Você' : (item.authorName || 'Sistema')}
                    </span>
                </div>

                {/* Conteúdo */}
                <div className={cn(
                    'px-3 pb-2 text-sm',
                    isCurrentUser ? 'text-white' : 'text-gray-800 dark:text-gray-200'
                )}>
                    <p className="whitespace-pre-wrap break-words leading-relaxed">
                        {item.message}
                    </p>
                </div>

                {/* Footer com data */}
                <div className={cn(
                    'px-3 pb-2 text-right',
                    isCurrentUser ? 'text-primary-200' : 'text-gray-400 dark:text-gray-500'
                )}>
                    <span className="text-xs">
                        {formatTime(item.createdAt)}
                    </span>
                </div>
            </div>
        </div>
    );
};

/**
 * Item de Evento (Status, Atribuição, etc.) - Centralizado na linha
 */
const EventItem = ({ item, icon: Icon, color = 'gray' }) => {
    const colorClasses = {
        gray: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
        blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
        green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
        yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
        red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    };

    const formatTime = (dateString) => {
        if (!dateString) return '';
        try {
            return format(new Date(dateString), "dd/MM 'às' HH:mm", { locale: ptBR });
        } catch {
            return '';
        }
    };

    return (
        <div className="relative pl-10">
            {/* Ícone na linha */}
            <div className={cn(
                'absolute left-1 top-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900',
                colorClasses[color]
            )}>
                <Icon className="h-3 w-3" />
            </div>

            {/* Conteúdo do evento */}
            <div className="py-1">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                    {item.message}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {formatTime(item.createdAt)}
                </p>
            </div>
        </div>
    );
};
