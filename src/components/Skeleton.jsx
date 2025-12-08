import { cn } from '../utils/cn';

/**
 * Componente base de Skeleton
 */
export const Skeleton = ({ className, ...props }) => {
    return (
        <div
            className={cn(
                'animate-pulse rounded-md bg-gray-200 dark:bg-gray-700',
                className
            )}
            {...props}
        />
    );
};

/**
 * Skeleton para Card de Estatística
 */
export const StatCardSkeleton = () => {
    return (
        <div className="card">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-12 w-12 rounded-full" />
            </div>
        </div>
    );
};

/**
 * Skeleton para Item de Lista
 */
export const ListItemSkeleton = () => {
    return (
        <div className="card">
            <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-8 w-20" />
            </div>
        </div>
    );
};

/**
 * Skeleton para Tabela
 */
export const TableSkeleton = ({ rows = 5, columns = 4 }) => {
    return (
        <div className="card overflow-hidden">
            {/* Header */}
            <div className="border-b border-gray-200 dark:border-gray-700 p-4">
                <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
                    {Array.from({ length: columns }).map((_, i) => (
                        <Skeleton key={i} className="h-4 w-full" />
                    ))}
                </div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {Array.from({ length: rows }).map((_, rowIndex) => (
                    <div key={rowIndex} className="p-4">
                        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
                            {Array.from({ length: columns }).map((_, colIndex) => (
                                <Skeleton key={colIndex} className="h-4 w-full" />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

/**
 * Skeleton para Gráfico
 */
export const ChartSkeleton = () => {
    return (
        <div className="card">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-3">
                <div className="flex items-end gap-2 h-48">
                    {Array.from({ length: 7 }).map((_, i) => (
                        <Skeleton
                            key={i}
                            className="flex-1"
                            style={{ height: `${Math.random() * 60 + 40}%` }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

/**
 * Skeleton para Card de Detalhes
 */
export const DetailCardSkeleton = () => {
    return (
        <div className="card space-y-4">
            {/* Header */}
            <div className="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
            </div>

            {/* Content */}
            <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 flex-1" />
            </div>
        </div>
    );
};

/**
 * Skeleton para Dashboard completo
 */
export const DashboardSkeleton = () => {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <StatCardSkeleton key={i} />
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                    <ChartSkeleton key={i} />
                ))}
            </div>
        </div>
    );
};

/**
 * Skeleton para Lista de Clientes/Tickets
 */
export const ListPageSkeleton = () => {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <Skeleton className="h-8 w-32 mb-2" />
                    <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-10 w-32" />
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <StatCardSkeleton key={i} />
                ))}
            </div>

            {/* Search */}
            <Skeleton className="h-10 w-full" />

            {/* List */}
            <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                    <ListItemSkeleton key={i} />
                ))}
            </div>
        </div>
    );
};
