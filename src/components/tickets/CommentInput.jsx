import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '../';
import { cn } from '../../utils/cn';

/**
 * Componente de input para adicionar comentários na timeline do ticket
 * @param {object} props
 * @param {function} props.onSubmit - Callback ao enviar comentário (message) => Promise
 * @param {boolean} props.disabled - Desabilita o input
 * @param {string} props.placeholder - Placeholder do textarea
 * @param {string} props.className - Classes CSS extras
 */
export const CommentInput = ({
    onSubmit,
    disabled = false,
    placeholder = 'Digite sua mensagem...',
    className
}) => {
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const trimmedMessage = message.trim();
        if (!trimmedMessage || sending) return;

        setSending(true);
        try {
            await onSubmit(trimmedMessage);
            setMessage(''); // Limpa input após sucesso
        } catch (error) {
            console.error('Erro ao enviar comentário:', error);
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e) => {
        // Submit com Ctrl+Enter ou Cmd+Enter
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            handleSubmit(e);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className={cn(
                'flex gap-2 p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50',
                className
            )}
        >
            <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled || sending}
                rows={1}
                className={cn(
                    'flex-1 resize-none rounded-lg border border-gray-300 dark:border-gray-600',
                    'bg-white dark:bg-gray-800 px-3 py-2 text-sm',
                    'text-gray-900 dark:text-gray-100',
                    'placeholder:text-gray-400 dark:placeholder:text-gray-500',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'min-h-[40px] max-h-[120px]'
                )}
                style={{
                    height: 'auto',
                    minHeight: '40px',
                }}
                onInput={(e) => {
                    // Auto-resize
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
            />

            <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={disabled || sending || !message.trim()}
                className="self-end h-10 px-4"
            >
                {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Send className="h-4 w-4" />
                )}
            </Button>
        </form>
    );
};
