import { useForm } from 'react-hook-form';
import { Modal, Button } from '../';
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { validateCpfCnpj, validateEmail, validatePhone, maskCpfCnpj, maskPhone } from '../utils/validators';

export const ClientModal = ({ isOpen, onClose, onSubmit, client = null }) => {
    const [loading, setLoading] = useState(false);
    const isEdit = !!client;

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm({
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            cpfCnpj: '',
            address: '',
            city: '',
            state: '',
            zipCode: '',
            status: 'active',
            notes: '',
        },
    });

    // ✅ SOLUÇÃO P0-2: Reset form quando client mudar
    useEffect(() => {
        if (client) {
            // Edição: preencher com dados do cliente
            reset({
                name: client.name || client.nome || '',
                email: client.email || '',
                phone: client.phone || client.telefone || '',
                cpfCnpj: client.cpfCnpj || client.cpf || client.cnpj || '',
                address: client.address || client.endereco || '',
                city: client.city || client.cidade || '',
                state: client.state || client.estado || '',
                zipCode: client.zipCode || client.cep || '',
                status: client.status || 'active',
                notes: client.notes || client.observacoes || '',
            });
        } else {
            // Novo: limpar campos
            reset({
                name: '',
                email: '',
                phone: '',
                cpfCnpj: '',
                address: '',
                city: '',
                state: '',
                zipCode: '',
                status: 'active',
                notes: '',
            });
        }
    }, [client, reset, isOpen]);

    const handleFormSubmit = async (data) => {
        setLoading(true);

        try {
            const result = await onSubmit(data);

            if (result?.success) {
                reset();
                onClose();
            }
        } catch (error) {
            console.error('Erro ao salvar cliente:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={isEdit ? 'Editar Cliente' : 'Novo Cliente'}
            size="lg"
            footer={
                <>
                    <Button variant="secondary" onClick={handleClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit(handleFormSubmit)}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>{isEdit ? 'Salvar' : 'Criar Cliente'}</>
                        )}
                    </Button>
                </>
            }
        >
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                {/* Nome */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Nome Completo / Razão Social <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        className="input"
                        placeholder="Ex: João Silva ou Empresa LTDA"
                        {...register('name', {
                            required: 'Nome é obrigatório',
                            minLength: {
                                value: 3,
                                message: 'Nome deve ter no mínimo 3 caracteres',
                            },
                        })}
                    />
                    {errors.name && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                            {errors.name.message}
                        </p>
                    )}
                </div>

                {/* Email e Telefone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Email */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            E-mail
                        </label>
                        <input
                            type="email"
                            className="input"
                            placeholder="email@exemplo.com"
                            {...register('email', {
                                validate: validateEmail
                            })}
                        />
                        {errors.email && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                {errors.email.message}
                            </p>
                        )}
                    </div>

                    {/* Telefone */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Telefone
                        </label>
                        <input
                            type="tel"
                            className="input"
                            placeholder="(11) 98765-4321"
                            {...register('phone', {
                                validate: validatePhone,
                                onChange: (e) => {
                                    e.target.value = maskPhone(e.target.value);
                                }
                            })}
                        />
                        {errors.phone && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                {errors.phone.message}
                            </p>
                        )}
                    </div>
                </div>

                {/* CPF/CNPJ */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        CPF / CNPJ
                    </label>
                    <input
                        type="text"
                        className="input"
                        placeholder="000.000.000-00 ou 00.000.000/0000-00"
                        {...register('cpfCnpj', {
                            validate: validateCpfCnpj,
                            onChange: (e) => {
                                e.target.value = maskCpfCnpj(e.target.value);
                            }
                        })}
                    />
                    {errors.cpfCnpj && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                            {errors.cpfCnpj.message}
                        </p>
                    )}
                </div>

                {/* Endereço */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Endereço
                    </label>
                    <input
                        type="text"
                        className="input"
                        placeholder="Rua, número, complemento"
                        {...register('address')}
                    />
                </div>

                {/* Cidade, Estado e CEP */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Cidade */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Cidade
                        </label>
                        <input
                            type="text"
                            className="input"
                            placeholder="São Paulo"
                            {...register('city')}
                        />
                    </div>

                    {/* Estado */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Estado
                        </label>
                        <input
                            type="text"
                            className="input"
                            placeholder="SP"
                            maxLength={2}
                            {...register('state')}
                        />
                    </div>

                    {/* CEP */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            CEP
                        </label>
                        <input
                            type="text"
                            className="input"
                            placeholder="00000-000"
                            {...register('zipCode')}
                        />
                    </div>
                </div>

                {/* Status */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Status
                    </label>
                    <select className="input" {...register('status')}>
                        <option value="active">Ativo</option>
                        <option value="inactive">Inativo</option>
                    </select>
                </div>

                {/* Observações */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Observações
                    </label>
                    <textarea
                        className="input min-h-[80px] resize-y"
                        placeholder="Informações adicionais sobre o cliente..."
                        {...register('notes')}
                    />
                </div>
            </form>
        </Modal>
    );
};
