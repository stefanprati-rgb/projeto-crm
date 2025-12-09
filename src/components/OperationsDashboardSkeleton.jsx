import { Skeleton, StatCardSkeleton, ChartSkeleton } from './Skeleton';

/**
 * Skeleton para Dashboard Operacional
 * Imita o layout do OperationsDashboard
 */
export const OperationsDashboardSkeleton = () => {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-96" />
            </div>

            {/* Cards de Resumo - 4 cards quadrados */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <StatCardSkeleton key={i} />
                ))}
            </div>

            {/* Gráficos - 2 colunas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Array.from({ length: 2 }).map((_, i) => (
                    <ChartSkeleton key={i} />
                ))}
            </div>

            {/* Lista de Usinas - Retângulo grande */}
            <div className="card">
                <Skeleton className="h-6 w-48 mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-16" />
                    ))}
                </div>
            </div>
        </div>
    );
};
