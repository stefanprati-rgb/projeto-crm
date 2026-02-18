import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { Button } from '../components';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

/**
 * Página de Login com estética premium.
 * Otimizada para Desktop, removendo paddings excessivos de mobile.
 */
export const LoginPage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm();

    const onSubmit = async (data) => {
        setLoading(true);

        try {
            const result = await login(data.email, data.password);

            if (result.success) {
                toast.success('Bem-vindo de volta!');
                navigate('/');
            } else {
                toast.error(result.error || 'Credenciais inválidas');
            }
        } catch (error) {
            toast.error('Erro de conexão com o servidor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-gray-950 overflow-hidden relative">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-primary-500/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-primary-600/5 rounded-full blur-3xl" />

            <div className="w-full max-w-md relative z-10">
                {/* Logo Section */}
                <div className="text-center mb-10">
                    <h1 className="text-5xl font-black bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent mb-3 tracking-tight">
                        Hube CRM
                    </h1>
                    <p className="text-slate-500 dark:text-gray-400 font-medium">
                        Plataforma de Gestão de Energia
                    </p>
                </div>

                {/* Login Card */}
                <div className="card glass !p-8 shadow-2xl shadow-primary-500/10">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Email Field */}
                        <div>
                            <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-gray-300">
                                <Mail className="inline h-4 w-4 mr-2 text-primary-500" />
                                E-mail Institucional
                            </label>
                            <input
                                type="email"
                                className="input"
                                placeholder="exemplo@hube.com"
                                {...register('email', {
                                    required: 'O e-mail é obrigatório para acesso',
                                    pattern: {
                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                        message: 'Formato de e-mail inválido',
                                    },
                                })}
                            />
                            {errors.email && (
                                <p className="mt-1.5 text-xs font-bold text-red-500">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        {/* Password Field */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-bold text-slate-700 dark:text-gray-300">
                                    <Lock className="inline h-4 w-4 mr-2 text-primary-500" />
                                    Senha
                                </label>
                                <a href="#" className="text-xs font-bold text-primary-600 hover:text-primary-700">
                                    Esqueceu?
                                </a>
                            </div>
                            <input
                                type="password"
                                className="input"
                                placeholder="••••••••"
                                {...register('password', {
                                    required: 'Senha é obrigatória',
                                    minLength: {
                                        value: 6,
                                        message: 'A senha deve possuir ao menos 6 caracteres',
                                    },
                                })}
                            />
                            {errors.password && (
                                <p className="mt-1.5 text-xs font-bold text-red-500">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        {/* Submit Action */}
                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full py-3.5 text-base"
                            loading={loading}
                        >
                            {loading ? 'Autenticando...' : 'Acessar Painel'}
                        </Button>
                    </form>

                    {/* Quick Test Login */}
                    <div className="mt-4">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">
                                    ou
                                </span>
                            </div>
                        </div>

                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <p className="text-xs text-blue-800 dark:text-blue-200 mb-2">
                                💡 <strong>Para testes:</strong> Crie um usuário no Firebase Console ou use:
                            </p>
                            <p className="text-xs text-blue-700 dark:text-blue-300 font-mono">
                                Email: teste@hubegd.com<br />
                                Senha: teste123456
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-6 text-center">
                        <a
                            href="https://console.firebase.google.com/project/crm-energia-solar/authentication/users"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary-600 hover:text-primary-700"
                        >
                            Criar usuário no Firebase →
                        </a>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="mt-10 text-center space-y-4">
                    <p className="text-xs text-slate-400 dark:text-gray-500 font-medium">
                        Enterprise Grade Security &bull; v1.2.0
                    </p>
                </div>
            </div>
        </div>
    );
};
