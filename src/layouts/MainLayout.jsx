import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    Menu,
    X,
    Home,
    Users,
    Ticket,
    BarChart3,
    Settings,
    LogOut,
    Moon,
    Sun,
    ChevronDown,
    Database,
    Factory,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { Button } from '../components';
import { ProjectSelector } from '../components/ProjectSelector';
import useStore, { useDarkMode, useSidebarOpen, useCurrentBase, useAllowedBases, useUser } from '../stores/useStore';
import { useAuth } from '../hooks/useAuth';

const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Clientes', href: '/clientes', icon: Users },
    { name: 'Tickets', href: '/tickets', icon: Ticket },
    { name: 'Operações', href: '/operacoes', icon: Factory },
    { name: 'Relatórios', href: '/relatorios', icon: BarChart3 },
    { name: 'Admin', href: '/admin', icon: Database },
    { name: 'Configurações', href: '/configuracoes', icon: Settings },
];

export const MainLayout = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuth();

    const darkMode = useDarkMode();
    const sidebarOpen = useSidebarOpen();
    const currentBase = useCurrentBase();
    const allowedBases = useAllowedBases();
    const user = useUser();

    const { toggleDarkMode, toggleSidebar, setCurrentBase } = useStore();

    const [baseDropdownOpen, setBaseDropdownOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleBaseChange = (base) => {
        setCurrentBase(base);
        setBaseDropdownOpen(false);
    };

    return (
        <div className={darkMode ? 'dark' : ''}>
            <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
                {/* Sidebar Desktop */}
                <aside
                    className={cn(
                        'hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:z-50 lg:w-64 transition-transform duration-300',
                        !sidebarOpen && 'lg:-translate-x-full'
                    )}
                >
                    <div className="flex flex-col flex-1 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                        {/* Logo */}
                        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-800">
                            <h1 className="text-xl font-bold text-primary-600">Hube CRM</h1>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={toggleSidebar}
                                className="lg:hidden"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* Base Selector */}
                        {allowedBases.length > 0 && (
                            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                                <div className="relative">
                                    <button
                                        onClick={() => setBaseDropdownOpen(!baseDropdownOpen)}
                                        className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <span className="font-medium truncate">
                                            {currentBase?.name || 'Selecione uma base'}
                                        </span>
                                        <ChevronDown className="h-4 w-4 flex-shrink-0" />
                                    </button>

                                    {baseDropdownOpen && (
                                        <div className="absolute z-10 mt-2 w-full rounded-lg bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700">
                                            {allowedBases.map((base) => (
                                                <button
                                                    key={base.id}
                                                    onClick={() => handleBaseChange(base)}
                                                    className={cn(
                                                        'w-full px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg',
                                                        currentBase?.id === base.id && 'bg-primary-50 dark:bg-primary-900/20 text-primary-600'
                                                    )}
                                                >
                                                    {base.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Navigation */}
                        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                            {navigation.map((item) => {
                                const isActive = location.pathname === item.href;
                                const Icon = item.icon;

                                return (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        className={cn(
                                            'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                                            isActive
                                                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600'
                                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                        )}
                                    >
                                        <Icon className="h-5 w-5 flex-shrink-0" />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* User Section */}
                        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold">
                                    {user?.displayName?.[0] || user?.email?.[0] || 'U'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                        {user?.displayName || 'Usuário'}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {user?.email}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={toggleDarkMode}
                                    className="flex-1"
                                >
                                    {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleLogout}
                                    className="flex-1"
                                >
                                    <LogOut className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Mobile Sidebar */}
                {sidebarOpen && (
                    <div className="lg:hidden fixed inset-0 z-50">
                        <div className="absolute inset-0 bg-black/50" onClick={toggleSidebar} />
                        <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white dark:bg-gray-900">
                            {/* Same content as desktop sidebar */}
                            <div className="flex flex-col h-full border-r border-gray-200 dark:border-gray-800">
                                <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-800">
                                    <h1 className="text-xl font-bold text-primary-600">Hube CRM</h1>
                                    <Button variant="ghost" size="sm" onClick={toggleSidebar}>
                                        <X className="h-5 w-5" />
                                    </Button>
                                </div>

                                {/* Rest of sidebar content (same as desktop) */}
                            </div>
                        </aside>
                    </div>
                )}

                {/* Main Content */}
                <div className={cn(
                    'flex-1 flex flex-col transition-all duration-300',
                    sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'
                )}>
                    {/* Header */}
                    <header className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between px-6">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={toggleSidebar}
                            className="lg:block"
                        >
                            <Menu className="h-5 w-5" />
                        </Button>

                        <div className="flex items-center gap-4">
                            <ProjectSelector />
                        </div>
                    </header>

                    {/* Page Content */}
                    <main className="flex-1 overflow-y-auto p-6">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
};
