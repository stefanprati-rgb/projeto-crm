import { cn } from '../utils/cn';
import { Loader2 } from 'lucide-react';

const buttonVariants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
    ghost: 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 active:scale-[0.98]',
    link: 'text-primary-600 hover:text-primary-700 underline-offset-4 hover:underline',
};

const buttonSizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
};

/**
 * Componente de Botão estilizado com suporte a estados de loading e variantes premium.
 * @param {Object} props - Propriedades do botão.
 * @param {React.ReactNode} props.children - Conteúdo do botão.
 * @param {string} props.variant - Variante visual (primary, secondary, danger, ghost, link).
 * @param {string} props.size - Tamanho (sm, md, lg).
 * @param {boolean} props.loading - Estado de carregamento.
 */
export const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    className,
    ...props
}) => {
    const isDisabled = disabled || loading;

    return (
        <button
            className={cn(
                'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
                buttonVariants[variant],
                buttonSizes[size],
                className
            )}
            disabled={isDisabled}
            {...props}
        >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {children}
        </button>
    );
};
