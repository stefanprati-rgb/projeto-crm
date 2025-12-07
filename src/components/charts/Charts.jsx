import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { useDarkMode } from '../stores/useStore';

const COLORS = ['#14b8a6', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

/**
 * Gráfico de linha para tendências
 */
export const TrendChart = ({ data, dataKey, xKey = 'name', title }) => {
    const darkMode = useDarkMode();
    const textColor = darkMode ? '#f9fafb' : '#111827';
    const gridColor = darkMode ? '#374151' : '#e5e7eb';

    return (
        <div className="card">
            {title && (
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    {title}
                </h3>
            )}
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey={xKey} stroke={textColor} />
                    <YAxis stroke={textColor} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                            border: `1px solid ${gridColor}`,
                            borderRadius: '0.5rem',
                        }}
                    />
                    <Legend />
                    <Line
                        type="monotone"
                        dataKey={dataKey}
                        stroke="#14b8a6"
                        strokeWidth={2}
                        dot={{ fill: '#14b8a6' }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

/**
 * Gráfico de barras
 */
export const BarChartComponent = ({ data, dataKey, xKey = 'name', title }) => {
    const darkMode = useDarkMode();
    const textColor = darkMode ? '#f9fafb' : '#111827';
    const gridColor = darkMode ? '#374151' : '#e5e7eb';

    return (
        <div className="card">
            {title && (
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    {title}
                </h3>
            )}
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey={xKey} stroke={textColor} />
                    <YAxis stroke={textColor} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                            border: `1px solid ${gridColor}`,
                            borderRadius: '0.5rem',
                        }}
                    />
                    <Legend />
                    <Bar dataKey={dataKey} fill="#14b8a6" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

/**
 * Gráfico de pizza
 */
export const PieChartComponent = ({ data, dataKey, nameKey = 'name', title }) => {
    const darkMode = useDarkMode();

    return (
        <div className="card">
            {title && (
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    {title}
                </h3>
            )}
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey={dataKey}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                            border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                            borderRadius: '0.5rem',
                        }}
                    />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

/**
 * Gráfico de múltiplas linhas
 */
export const MultiLineChart = ({ data, lines, xKey = 'name', title }) => {
    const darkMode = useDarkMode();
    const textColor = darkMode ? '#f9fafb' : '#111827';
    const gridColor = darkMode ? '#374151' : '#e5e7eb';

    return (
        <div className="card">
            {title && (
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    {title}
                </h3>
            )}
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey={xKey} stroke={textColor} />
                    <YAxis stroke={textColor} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                            border: `1px solid ${gridColor}`,
                            borderRadius: '0.5rem',
                        }}
                    />
                    <Legend />
                    {lines.map((line, index) => (
                        <Line
                            key={line.dataKey}
                            type="monotone"
                            dataKey={line.dataKey}
                            stroke={COLORS[index % COLORS.length]}
                            strokeWidth={2}
                            name={line.name}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};
