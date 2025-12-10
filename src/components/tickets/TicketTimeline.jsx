import { useState, useEffect, useRef } from 'react';
import {
    MessageSquare,
    RefreshCw,
    UserCheck,
    PlusCircle,
    AlertCircle,
    Clock
} from 'lucide-react';
import { ticketService } from '../../services/ticketService';
import { CommentInput } from './CommentInput';
import { Badge } from '../';
import { cn } from '../../utils/cn';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { auth } from '../../services/firebase';

/**
 * Componente de Timeline do Ticket
 * Exibe comentários e eventos do ticket em tempo real
 * 
 * @param {object} props
 * @param {string} props.ticketId - ID do ticket
 * @param {string} props.clientId - ID do cliente
 * @param {string} props.className - Classes CSS extras
 */
export const TicketTimeline = ({ ticketId, clientId, className }) => {
    const [timeline, setTimeline] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const timelineEndRef = useRef(null);

    // Scroll automático para o final quando novos itens são adicionados
    const scrollToBottom = () => {
        timelineEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Setup do listener em tempo real
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
                // Auto-scroll com pequeno delay para garantir renderização
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

    // Handler para enviar comentário
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

    // Formatação de data relativa
    const formatTimestamp = (dateString) => {
        if (!dateString) return '';
        try {
            return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
        } catch {
            return dateString;
        }
    };

    // Renderiza um item da timeline baseado no tipo
    const renderTimelineItem = (item) => {
        switch (item.type) {
            case 'comment':
                return <CommentItem key={item.id} item={item} formatTimestamp={formatTimestamp} />;
            case 'status_change':
                return <StatusChangeItem key={item.id} item={item} formatTimestamp={formatTimestamp} />;
            case 'assignment_change':
                return <AssignmentChangeItem key={item.id} item={item} formatTimestamp={formatTimestamp} />;
            case 'ticket_created':
                return <TicketCreatedItem key={item.id} item={item} formatTimestamp={formatTimestamp} />;
            default:
                return <GenericItem key={item.id} item={item} formatTimestamp={formatTimestamp} />;
        }
    };

    return (
        <div className={cn('flex flex-col h-full', className)}>
            {/* Header da Timeline */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <MessageSquare className="h-5 w-5 text-primary-600" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Histórico do Atendimento
                </h3>
                {timeline.length > 0 && (
                    <Badge variant="default" className="ml-auto">
                        {timeline.length} {timeline.length === 1 ? 'item' : 'itens'}
                    </Badge>
                )}
            </div>

            {/* Lista de items da timeline */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <RefreshCw className="h-6 w-6 animate-spin text-primary-500" />
                        <span className="ml-2 text-sm text-gray-500">Carregando histórico...</span>
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center py-8 text-red-500">
                        <AlertCircle className="h-5 w-5 mr-2" />
                        <span className="text-sm">{error}</span>
                    </div>
                ) : timeline.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                        <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
                        <span className="text-sm">Nenhum histórico ainda</span>
                        <span className="text-xs mt-1">Seja o primeiro a comentar!</span>
                    </div>
                ) : (
                    <>
                        {timeline.map(renderTimelineItem)}
                        <div ref={timelineEndRef} />
                    </>
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

// ========================================
// SUB-COMPONENTES DE TIMELINE
// ========================================

/**
 * Item de Comentário
 */
const CommentItem = ({ item, formatTimestamp }) => {
    const isCurrentUser = item.authorId === auth.currentUser?.uid;

    return (
        <div className={cn(
            'flex gap-3',
            isCurrentUser && 'flex-row-reverse'
        )}>
            {/* Avatar */}
            <div className={cn(
                'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium',
                isCurrentUser
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            )}>
                {item.authorName?.charAt(0)?.toUpperCase() || '?'}
            </div>

            {/* Conteúdo */}
            <div className={cn(
                'flex-1 max-w-[80%]',
                isCurrentUser && 'flex flex-col items-end'
            )}>
                <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                        'text-xs font-medium',
                        isCurrentUser
                            ? 'text-primary-600 dark:text-primary-400'
                            : 'text-gray-700 dark:text-gray-300'
                    )}>
                        {isCurrentUser ? 'Você' : (item.authorName || 'Sistema')}
                    </span>
                    <span className="text-xs text-gray-400">
                        {formatTimestamp(item.createdAt)}
                    </span>
                </div>
                <div className={cn(
                    'rounded-xl px-4 py-2 text-sm',
                    isCurrentUser
                        ? 'bg-primary-500 text-white rounded-br-sm'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-sm'
                )}>
                    <p className="whitespace-pre-wrap break-words">{item.message}</p>
                </div>
            </div>
        </div>
    );
};

/**
 * Item de Mudança de Status
 */
const StatusChangeItem = ({ item, formatTimestamp }) => (
    <div className="flex items-center gap-2 py-2">
        <div className="flex-1 flex items-center gap-2">
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
            <RefreshCw className="h-3 w-3 text-gray-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">
                <span className="font-medium">{item.authorName || 'Sistema'}</span>
                {' '}alterou o status
            </span>
            <Badge variant="warning" className="text-xs py-0.5">
                {item.oldStatus} → {item.newStatus}
            </Badge>
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
        </div>
        <Clock className="h-3 w-3 text-gray-400" />
        <span className="text-xs text-gray-400">{formatTimestamp(item.createdAt)}</span>
    </div>
);

/**
 * Item de Mudança de Responsável
 */
const AssignmentChangeItem = ({ item, formatTimestamp }) => (
    <div className="flex items-center gap-2 py-2">
        <div className="flex-1 flex items-center gap-2">
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
            <UserCheck className="h-3 w-3 text-blue-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">
                Responsável: <span className="font-medium text-blue-600 dark:text-blue-400">{item.newResponsible}</span>
            </span>
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
        </div>
        <Clock className="h-3 w-3 text-gray-400" />
        <span className="text-xs text-gray-400">{formatTimestamp(item.createdAt)}</span>
    </div>
);

/**
 * Item de Criação do Ticket
 */
const TicketCreatedItem = ({ item, formatTimestamp }) => (
    <div className="flex items-center gap-2 py-2">
        <div className="flex-1 flex items-center gap-2">
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
            <PlusCircle className="h-3 w-3 text-green-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">
                Ticket aberto por <span className="font-medium">{item.authorName || 'Sistema'}</span>
            </span>
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
        </div>
        <Clock className="h-3 w-3 text-gray-400" />
        <span className="text-xs text-gray-400">{formatTimestamp(item.createdAt)}</span>
    </div>
);

/**
 * Item Genérico (fallback)
 */
const GenericItem = ({ item, formatTimestamp }) => (
    <div className="flex items-center gap-2 py-2 text-xs text-gray-500">
        <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
        <span>{item.message}</span>
        <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
        <span>{formatTimestamp(item.createdAt)}</span>
    </div>
);
