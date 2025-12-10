import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from '../';
import { cn } from '../../utils/cn';
import { TicketDetailsContent } from './TicketDetailsContent';

/**
 * Drawer/Modal Full-Screen para detalhes do ticket
 * Resolve o problema de layout espremido - ocupa 90% da tela
 * 
 * @param {object} props
 * @param {object} props.ticket - Ticket para exibir
 * @param {function} props.onUpdate - Callback de atualização
 * @param {function} props.onClose - Callback de fechar
 * @param {boolean} props.isOpen - Estado de visibilidade
 */
export const TicketDetailsDrawer = ({ ticket, onUpdate, onClose, isOpen }) => {
    const drawerRef = useRef(null);

    // Fecha ao clicar fora
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // Fecha com ESC
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen || !ticket) return null;

    return (
        <div
            className="fixed inset-0 z-50 overflow-hidden"
            onClick={handleBackdropClick}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />

            {/* Drawer Container */}
            <div className="absolute inset-y-0 right-0 flex max-w-full">
                {/* Drawer Panel - 90% width ou max 1600px */}
                <div
                    ref={drawerRef}
                    className={cn(
                        'w-screen max-w-[90vw] xl:max-w-[1600px]',
                        'bg-white dark:bg-gray-900',
                        'shadow-2xl',
                        'transform transition-transform duration-300 ease-out',
                        'flex flex-col',
                        isOpen ? 'translate-x-0' : 'translate-x-full'
                    )}
                >
                    {/* Header do Drawer */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-mono text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-700">
                                {ticket.protocol}
                            </span>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate max-w-lg">
                                {ticket.subject}
                            </h2>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="flex-shrink-0"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Conteúdo Principal - 3 Colunas */}
                    <div className="flex-1 overflow-hidden">
                        <TicketDetailsContent
                            ticket={ticket}
                            onUpdate={onUpdate}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
