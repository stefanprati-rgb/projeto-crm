import { useState } from 'react';
import { User, Bell, Shield, Palette, Database } from 'lucide-react';
import { Button } from '../components';
import useStore, { useDarkMode, useUser } from '../stores/useStore';
import { cn } from '../utils/cn';

const SettingsSection = ({ title, description, icon: Icon, children }) => {
    return (
        <div className="card">
            <div className="flex items-start gap-4 mb-6">
                <div className="rounded-full p-3 bg-primary-50 dark:bg-primary-900/20">
                    <Icon className="h-6 w-6 text-primary-600" />
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {description}
                    </p>
                </div>
            </div>
            {children}
        </div>
    );
};

export const SettingsPage = () => {
    const darkMode = useDarkMode();
    const user = useUser();
    const { toggleDarkMode } = useStore();

    const [notifications, setNotifications] = useState({
        email: true,
        push: false,
        sms: false,
    });

    const handleNotificationChange = (type) => {
        setNotifications(prev => ({
            ...prev,
            [type]: !prev[type]
        }));
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    Configurações
                </h1>
                <p className="mt-1 text-gray-600 dark:text-gray-400">
                    Gerencie as configurações da sua conta e preferências do sistema
                </p>
            </div>

            {/* Perfil */}
            <SettingsSection
                title="Perfil"
                description="Informações básicas da sua conta"
                icon={User}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Nome de Exibição
                        </label>
                        <input
                            type="text"
                            className="input"
                            defaultValue={user?.displayName || ''}
                            placeholder="Seu nome"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            E-mail
                        </label>
                        <input
                            type="email"
                            className="input"
                            defaultValue={user?.email || ''}
                            disabled
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            O e-mail não pode ser alterado
                        </p>
                    </div>
                    <div className="flex justify-end">
                        <Button variant="primary" disabled>
                            Salvar Alterações
                        </Button>
                    </div>
                </div>
            </SettingsSection>

            {/* Aparência */}
            <SettingsSection
                title="Aparência"
                description="Personalize a aparência do sistema"
                icon={Palette}
            >
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                                Modo Escuro
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Ative o tema escuro para reduzir o cansaço visual
                            </p>
                        </div>
                        <button
                            onClick={toggleDarkMode}
                            className={cn(
                                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                                darkMode ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                            )}
                        >
                            <span
                                className={cn(
                                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                                    darkMode ? 'translate-x-6' : 'translate-x-1'
                                )}
                            />
                        </button>
                    </div>
                </div>
            </SettingsSection>

            {/* Notificações */}
            <SettingsSection
                title="Notificações"
                description="Gerencie como você recebe notificações"
                icon={Bell}
            >
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                                E-mail
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Receber notificações por e-mail
                            </p>
                        </div>
                        <button
                            onClick={() => handleNotificationChange('email')}
                            className={cn(
                                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                                notifications.email ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                            )}
                        >
                            <span
                                className={cn(
                                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                                    notifications.email ? 'translate-x-6' : 'translate-x-1'
                                )}
                            />
                        </button>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                                Push
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Receber notificações push no navegador
                            </p>
                        </div>
                        <button
                            onClick={() => handleNotificationChange('push')}
                            className={cn(
                                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                                notifications.push ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                            )}
                        >
                            <span
                                className={cn(
                                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                                    notifications.push ? 'translate-x-6' : 'translate-x-1'
                                )}
                            />
                        </button>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                                SMS
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Receber notificações por SMS
                            </p>
                        </div>
                        <button
                            onClick={() => handleNotificationChange('sms')}
                            className={cn(
                                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                                notifications.sms ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                            )}
                        >
                            <span
                                className={cn(
                                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                                    notifications.sms ? 'translate-x-6' : 'translate-x-1'
                                )}
                            />
                        </button>
                    </div>
                </div>
            </SettingsSection>

            {/* Segurança */}
            <SettingsSection
                title="Segurança"
                description="Gerencie a segurança da sua conta"
                icon={Shield}
            >
                <div className="space-y-4">
                    <div>
                        <Button variant="secondary" disabled>
                            Alterar Senha
                        </Button>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            Altere sua senha regularmente para manter sua conta segura
                        </p>
                    </div>
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button variant="danger" disabled>
                            Encerrar Todas as Sessões
                        </Button>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            Desconecte todos os dispositivos exceto este
                        </p>
                    </div>
                </div>
            </SettingsSection>

            {/* Dados */}
            <SettingsSection
                title="Dados e Privacidade"
                description="Gerencie seus dados e privacidade"
                icon={Database}
            >
                <div className="space-y-4">
                    <div>
                        <Button variant="secondary" disabled>
                            Exportar Dados
                        </Button>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            Baixe uma cópia de todos os seus dados
                        </p>
                    </div>
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button variant="danger" disabled>
                            Excluir Conta
                        </Button>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            Exclua permanentemente sua conta e todos os dados associados
                        </p>
                    </div>
                </div>
            </SettingsSection>

            {/* Info */}
            <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                    ℹ️ <strong>Nota:</strong> Algumas funcionalidades estão desabilitadas nesta versão.
                    Elas serão implementadas em atualizações futuras.
                </p>
            </div>
        </div>
    );
};
