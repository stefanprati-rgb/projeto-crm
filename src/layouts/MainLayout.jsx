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
    Activity,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { Button } from '../components';
import { ProjectSelector } from '../components/ProjectSelector';
import useStore, { useDarkMode, useSidebarOpen, useCurrentBase, useAllowedBases, useUser } from '../stores/useStore';
import { useAuth } from '../hooks/useAuth';

const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Clientes', href: '/clientes', icon: Users },
    { name: 'Esteira Onboarding', href: '/onboarding', icon: Activity },
    { name: 'Dashboard Onboarding', href: '/onboarding/dashboard', icon: BarChart3 },
    { name: 'Tickets', href: '/tickets', icon: Ticket },
    { name: 'Operações', href: '/operacoes', icon: Factory },
    { name: 'Relatórios', href: '/relatorios', icon: BarChart3 },
    { name: 'Admin', href: '/admin', icon: Database },
    { name: 'Configurações', href: '/configuracoes', icon: Settings },
];

/**
 * Layout principal da aplicação focado em Desktop.
 * Removeu-se a lógica de sidebar mobile para otimizar o fluxo de gestão de energia.
 */
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
        <div className={cn("min-h-screen", darkMode ? 'dark' : '')}>
            <div className="flex h-screen bg-slate-50 dark:bg-gray-950">
                {/* Sidebar - Focada em Desktop (Sempre visível se sidebarOpen estiver true) */}
                <aside
                    className={cn(
                        'flex flex-col fixed inset-y-0 z-50 w-64 transition-all duration-300 ease-in-out',
                        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    )}
                >
                    <div className="flex flex-col flex-1 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl">
                        {/* Logo */}
                        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-800">
                            <h1 className="text-2xl font-black bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">Hube CRM</h1>
                        </div>

                        {/* Base Selector */}
                        {allowedBases.length > 0 && (
                            <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-800">
                                <div className="relative">
                                    <button
                                        onClick={() => setBaseDropdownOpen(!baseDropdownOpen)}
                                        className="w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-700"
                                    >
                                        <span className="font-semibold truncate">
                                            {currentBase?.name || 'Selecione uma base'}
                                        </span>
                                        <ChevronDown className={cn("h-4 w-4 transition-transform", baseDropdownOpen && "rotate-180")} />
                                    </button>

                                    {baseDropdownOpen && (
                                        <div className="absolute z-10 mt-2 w-full rounded-xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                            {allowedBases.map((base) => (
                                                <button
                                                    key={base.id}
                                                    onClick={() => handleBaseChange(base)}
                                                    className={cn(
                                                        'w-full px-4 py-3 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
                                                        currentBase?.id === base.id && 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 font-bold'
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
                        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                            {navigation.map((item) => {
                                const isActive = location.pathname === item.href;
                                const Icon = item.icon;

                                return (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        className={cn(
                                            'flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all group',
                                            isActive
                                                ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                                                : 'text-slate-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-primary-600'
                                        )}
                                    >
                                        <Icon className={cn("h-5 w-5", isActive ? "text-white" : "group-hover:text-primary-600")} />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* User Section */}
                        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary-600 to-primary-400 flex items-center justify-center text-white font-bold shadow-md">
                                    {user?.displayName?.[0] || user?.email?.[0] || 'U'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                                        {user?.displayName || 'Usuário'}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate font-medium">
                                        {user?.email}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={toggleDarkMode}
                                    className="flex-1 rounded-lg"
                                >
                                    {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleLogout}
                                    className="flex-1 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
                                >
                                    <LogOut className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content Area */}
                <div className={cn(
                    'flex-1 flex flex-col transition-all duration-300 ease-in-out',
                    sidebarOpen ? 'ml-64' : 'ml-0'
                )}>
                    {/* Header */}
                    <header className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-6">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={toggleSidebar}
                            className="text-gray-500"
                        >
                            <Menu className="h-5 w-5" />
                        </Button>

                        <div className="flex items-center gap-4">
                            <ProjectSelector />
                        </div >
                    </header >

                    {/* Page Content */}
                    < main className="flex-1 overflow-y-auto p-8 max-w-7xl w-full mx-auto" >
                        {children}
                    </main >
                </div >
            </div >
        </div >
    );
};
