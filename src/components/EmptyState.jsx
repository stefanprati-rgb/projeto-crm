import { Inbox } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../utils/cn';

/**
 * Componente Empty State
 * Exibe mensagem amigável quando não há dados para mostrar
 */
export const EmptyState = ({
    icon: Icon = Inbox,
    title = 'Nenhum dado encontrado',
    message = 'Não há informações para exibir no momento.',
    actionLabel,
    onAction,
    className,
}) => {
    return (
        <div className={cn('flex flex-col items-center justify-center py-12 px-4', className)}>
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                <Icon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            </div>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {title}
            </h3>

            <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-md mb-6">
                {message}
            </p>

            {actionLabel && onAction && (
                <Button onClick={onAction} variant="primary">
                    {actionLabel}
                </Button>
            )}
        </div>
    );
};
