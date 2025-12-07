import { Loader2 } from 'lucide-react';
import { cn } from '../utils/cn';

export const Spinner = ({ size = 'md', className }) => {
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-8 w-8',
        lg: 'h-12 w-12',
        xl: 'h-16 w-16',
    };

    return (
        <Loader2
            className={cn(
                'animate-spin text-primary-600',
                sizeClasses[size],
                className
            )}
        />
    );
};

export const LoadingScreen = ({ message = 'Carregando...' }) => {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4">
            <Spinner size="xl" />
            <p className="text-lg text-gray-600 dark:text-gray-400">{message}</p>
        </div>
    );
};
