import { useForm } from 'react-hook-form';
import { Modal, Button } from '../';
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { validateCpfCnpj, validateEmail, validatePhone, maskCpfCnpj, maskPhone } from '../../utils/validators';

const TABS = [
    { id: 'identificacao', label: 'Identificação e Contato' },
    { id: 'comerciais', label: 'Dados Comercias/Contrato' },
    { id: 'portal', label: 'Portal e Segurança' }
];

export const ClientModal = ({ isOpen, onClose, onSubmit, client = null }) => {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('identificacao');
    const isEdit = !!client;

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm({
        defaultValues: {
            // Aba 1 - Identificação e Contato
            name: '',
            email: '',
            phone: '',
            cpfCnpj: '',
            cnpjAssinante: '',
            cnpjPagador: '',
            cnpjDistribuidora: '',
            address: '',
            city: '',
            state: '',
            zipCode: '',
            status: 'active',
            notes: '',
            // Aba 2 - Dados Comerciais
            idContaAcc: '',
            idUcNegociada: '',
            consorcio: '',
            grupoContas: '',
            canalEntrada: '',
            fidelidadeMeses: 0,
            // Aba 3 - Portal e Segurança
            portal_cadastrado: 'PENDENTE',
            portal_login: '',
            portal_senha: '',
            portal_fraudeMapeada: false,
            portal_pendenciaCadastral: false,
        },
    });

    useEffect(() => {
        // Reset tab
        setActiveTab('identificacao');

        if (client) {
            // Edição: preencher com dados do cliente
            reset({
                // Aba 1
                name: client.name || client.nome || '',
                email: client.email || '',
                phone: client.phone || client.telefone || '',
                cpfCnpj: client.cpfCnpj || client.cpf || client.cnpj || client.document || '',
                cnpjAssinante: client.cnpjAssinante || '',
                cnpjPagador: client.cnpjPagador || '',
                cnpjDistribuidora: client.cnpjDistribuidora || '',
                address: client.address || client.endereco?.rua || client.endereco || '',
                city: client.city || client.endereco?.cidade || client.cidade || '',
                state: client.state || client.endereco?.estado || client.estado || '',
                zipCode: client.zipCode || client.endereco?.cep || client.cep || '',
                status: client.status || 'active',
                notes: client.notes || client.observacoes || '',

                // Aba 2
                idContaAcc: client.idContaAcc || '',
                idUcNegociada: client.idUcNegociada || '',
                consorcio: client.consorcio || '',
                grupoContas: client.grupoContas || '',
                canalEntrada: client.canalEntrada || '',
                fidelidadeMeses: client.fidelidadeMeses || 0,

                // Aba 3
                portal_cadastrado: client.portal?.status || 'PENDENTE',
                portal_login: client.portal?.login || '',
                portal_senha: '', // Não carregamos a senha ofuscada de volta
                portal_fraudeMapeada: client.portal?.fraudeMapeada || false,
                portal_pendenciaCadastral: client.portal?.pendenciaCadastral || false
            });
        } else {
            // Novo: limpar campos
            reset({
                name: '', email: '', phone: '', cpfCnpj: '', cnpjAssinante: '',
                cnpjPagador: '', cnpjDistribuidora: '', address: '', city: '',
                state: '', zipCode: '', status: 'active', notes: '',
                idContaAcc: '', idUcNegociada: '', consorcio: '', grupoContas: '',
                canalEntrada: '', fidelidadeMeses: 0,
                portal_cadastrado: 'PENDENTE', portal_login: '', portal_senha: '',
                portal_fraudeMapeada: false, portal_pendenciaCadastral: false
            });
        }
    }, [client, reset, isOpen]);

    const handleFormSubmit = async (data) => {
        setLoading(true);

        try {
            // Mapeia os dados "flat" das abas de volta para a estrutura alinhada do Schema
            const structuredData = {
                ...data,
                portal: {
                    status: data.portal_cadastrado,
                    login: data.portal_login,
                    senhaPlana: data.portal_senha, // Só passamos se ele digitar. O backend ou store ofuscará
                    fraudeMapeada: data.portal_fraudeMapeada,
                    pendenciaCadastral: data.portal_pendenciaCadastral
                }
            };

            // LIMPANDO CAMPOS VIRTUAIS DO FLATTEN
            delete structuredData.portal_cadastrado;
            delete structuredData.portal_login;
            delete structuredData.portal_senha;
            delete structuredData.portal_fraudeMapeada;
            delete structuredData.portal_pendenciaCadastral;

            const result = await onSubmit(structuredData);

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
            {/* Tabs de Navegação */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4 overflow-x-auto">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`py-2 px-4 whitespace-nowrap border-b-2 font-medium text-sm focus:outline-none transition-colors ${activeTab === tab.id
                                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">

                {/* ----------------------------- */}
                {/* ABA 1: IDENTIFICAÇÃO E CONTATO */}
                {/* ----------------------------- */}
                <div className={activeTab === 'identificacao' ? 'block space-y-4' : 'hidden'}>
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

                    {/* CPFs/CNPJs Específicos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* CPF/CNPJ Principal */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                CPF / CNPJ (Principal)
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

                        {/* CNPJ Assinante */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                CNPJ Assinante
                            </label>
                            <input
                                type="text"
                                className="input"
                                placeholder="00.000.000/0000-00"
                                {...register('cnpjAssinante', {
                                    onChange: (e) => {
                                        e.target.value = maskCpfCnpj(e.target.value);
                                    }
                                })}
                            />
                        </div>

                        {/* CNPJ Pagador */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                CNPJ Pagador
                            </label>
                            <input
                                type="text"
                                className="input"
                                placeholder="00.000.000/0000-00"
                                {...register('cnpjPagador', {
                                    onChange: (e) => {
                                        e.target.value = maskCpfCnpj(e.target.value);
                                    }
                                })}
                            />
                        </div>

                        {/* CNPJ Distribuidora */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                CNPJ na Distribuidora
                            </label>
                            <input
                                type="text"
                                className="input"
                                placeholder="00.000.000/0000-00"
                                {...register('cnpjDistribuidora', {
                                    onChange: (e) => {
                                        e.target.value = maskCpfCnpj(e.target.value);
                                    }
                                })}
                            />
                        </div>
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
                            <select className="input" {...register('state')}>
                                <option value="">Selecione</option>
                                <option value="AC">AC</option>
                                <option value="AL">AL</option>
                                <option value="AP">AP</option>
                                <option value="AM">AM</option>
                                <option value="BA">BA</option>
                                <option value="CE">CE</option>
                                <option value="DF">DF</option>
                                <option value="ES">ES</option>
                                <option value="GO">GO</option>
                                <option value="MA">MA</option>
                                <option value="MT">MT</option>
                                <option value="MS">MS</option>
                                <option value="MG">MG</option>
                                <option value="PA">PA</option>
                                <option value="PB">PB</option>
                                <option value="PR">PR</option>
                                <option value="PE">PE</option>
                                <option value="PI">PI</option>
                                <option value="RJ">RJ</option>
                                <option value="RN">RN</option>
                                <option value="RS">RS</option>
                                <option value="RO">RO</option>
                                <option value="RR">RR</option>
                                <option value="SC">SC</option>
                                <option value="SP">SP</option>
                                <option value="SE">SE</option>
                                <option value="TO">TO</option>
                            </select>
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
                                {...register('zipCode', {
                                    onChange: (e) => {
                                        const value = e.target.value.replace(/\D/g, '');
                                        e.target.value = value.replace(/(\d{5})(\d{1,3})$/, '$1-$2');
                                    }
                                })}
                            />
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Status (Sistema)
                        </label>
                        <select className="input" {...register('status')}>
                            <option value="active">Ativo</option>
                            <option value="inactive">Inativo</option>
                        </select>
                    </div>

                    {/* Observações */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Observações Gerais
                        </label>
                        <textarea
                            className="input min-h-[80px] resize-y"
                            placeholder="Informações adicionais sobre o cliente..."
                            {...register('notes')}
                        />
                    </div>
                </div>

                {/* ----------------------------- */}
                {/* ABA 2: DADOS COMERCIAIS */}
                {/* ----------------------------- */}
                <div className={activeTab === 'comerciais' ? 'block space-y-4' : 'hidden'}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">ID Conta (__acc)</label>
                            <input type="text" className="input" placeholder="ID Salesforce" {...register('idContaAcc')} />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">ID UC Negociada</label>
                            <input type="text" className="input" placeholder="UC Negociada" {...register('idUcNegociada')} />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Consórcio</label>
                            <input type="text" className="input" placeholder="Ex: RZ AL" {...register('consorcio')} />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Grupo de Contas</label>
                            <input type="text" className="input" placeholder="Grupo de Faturamento" {...register('grupoContas')} />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Canal de Entrada</label>
                            <input type="text" className="input" placeholder="Ex: Interno - B2C" {...register('canalEntrada')} />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Fidelidade (Meses)</label>
                            <input type="number" className="input" placeholder="Ex: 12" {...register('fidelidadeMeses')} />
                        </div>
                    </div>
                </div>

                {/* ----------------------------- */}
                {/* ABA 3: PORTAL E SEGURANÇA */}
                {/* ----------------------------- */}
                <div className={activeTab === 'portal' ? 'block space-y-4' : 'hidden'}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Status Portal</label>
                            <select className="input" {...register('portal_cadastrado')}>
                                <option value="PENDENTE">Pendente</option>
                                <option value="CADASTRADO">Cadastrado</option>
                                <option value="BLOQUEADO">Bloqueado</option>
                            </select>
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Login</label>
                            <input type="text" className="input" placeholder="Login para acesso ao portal" {...register('portal_login')} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Senha (Opcional - Criar ou Redefinir)</label>
                            <input type="password" className="input" placeholder="A senha será ofuscada e não listada ao visualizar" {...register('portal_senha')} />
                            <p className="mt-1 text-xs text-gray-500">Deixe em branco se já estiver cadastrado ou não quiser alterar a senha.</p>
                        </div>
                        <div>
                            <label className="mt-4 flex items-center space-x-2">
                                <input type="checkbox" className="rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500" {...register('portal_fraudeMapeada')} />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Fraude Mapeada</span>
                            </label>
                        </div>
                        <div>
                            <label className="mt-4 flex items-center space-x-2">
                                <input type="checkbox" className="rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500" {...register('portal_pendenciaCadastral')} />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Pendência Cadastral</span>
                            </label>
                        </div>
                    </div>
                </div>

            </form>
        </Modal>
    );
};
