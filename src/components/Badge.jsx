import { cn } from '../utils/cn';

const badgeVariants = {
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    info: 'badge-info',
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
};

export const Badge = ({
    children,
    variant = 'default',
    className,
    ...props
}) => {
    return (
        <span
            className={cn(
                'badge',
                badgeVariants[variant],
                className
            )}
            {...props}
        >
            {children}
        </span>
    );
};
