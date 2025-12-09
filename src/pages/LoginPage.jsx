import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { Button, Input } from '../components';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

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
                toast.success('Login realizado com sucesso!');
                navigate('/');
            } else {
                toast.error(result.error || 'Erro ao fazer login');
            }
        } catch (error) {
            toast.error('Erro ao fazer login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 px-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-primary-600 mb-2">Hube CRM</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Faça login para continuar
                    </p>
                </div>

                {/* Login Card */}
                <div className="card">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {/* Email */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                <Mail className="inline h-4 w-4 mr-2" />
                                E-mail
                            </label>
                            <input
                                type="email"
                                className="input"
                                placeholder="seu@email.com"
                                {...register('email', {
                                    required: 'E-mail é obrigatório',
                                    pattern: {
                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                        message: 'E-mail inválido',
                                    },
                                })}
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                <Lock className="inline h-4 w-4 mr-2" />
                                Senha
                            </label>
                            <input
                                type="password"
                                className="input"
                                placeholder="••••••••"
                                {...register('password', {
                                    required: 'Senha é obrigatória',
                                    minLength: {
                                        value: 6,
                                        message: 'Senha deve ter no mínimo 6 caracteres',
                                    },
                                })}
                            />
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Entrando...
                                </>
                            ) : (
                                'Entrar'
                            )}
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

                {/* Version */}
                <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    Hube CRM v1.0.0
                </p>
            </div>
        </div>
    );
};
