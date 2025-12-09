import { useState, useEffect, useRef } from 'react';
import { Search, User, ChevronDown } from 'lucide-react';
import { useClients } from '../../stores/useStore';
import { cn } from '../../utils/cn';

export const ClientSelector = ({
    value,
    onChange,
    required = false,
    error = null,
    disabled = false
}) => {
    const clients = useClients();
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const dropdownRef = useRef(null);

    // Detectar quando dados terminam de carregar
    useEffect(() => {
        // Se há clientes, não está mais carregando
        if (clients.length > 0) {
            setIsLoading(false);
        }
        // Após 3 segundos, assumir que não há clientes (timeout)
        const timeout = setTimeout(() => {
            setIsLoading(false);
        }, 3000);

        return () => clearTimeout(timeout);
    }, [clients.length]);

    // Cliente selecionado
    const selectedClient = clients.find(c => c.id === value);

    // Filtrar clientes
    const filteredClients = clients.filter(client =>
        client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.cpfCnpj?.includes(searchTerm) ||
        client.phone?.includes(searchTerm) ||
        client.telefone?.includes(searchTerm)
    ).slice(0, 50); // Limitar a 50 resultados

    const handleSelect = (clientId) => {
        onChange(clientId);
        setIsOpen(false);
        setSearchTerm('');
    };

    // Fechar dropdown ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className="relative" ref={dropdownRef}>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Cliente {required && <span className="text-red-500">*</span>}
            </label>

            {/* Botão de Seleção */}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={cn(
                    "input w-full flex items-center justify-between",
                    error && "border-red-500 focus:border-red-500",
                    disabled && "opacity-50 cursor-not-allowed"
                )}
            >
                <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className={cn(
                        !selectedClient && "text-gray-400"
                    )}>
                        {selectedClient
                            ? (selectedClient.name || selectedClient.nome)
                            : "Selecione um cliente"}
                    </span>
                </div>
                <ChevronDown className={cn(
                    "h-4 w-4 text-gray-400 transition-transform",
                    isOpen && "rotate-180"
                )} />
            </button>

            {/* Erro */}
            {error && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {error}
                </p>
            )}

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-20 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-80 overflow-hidden">
                    {/* Busca */}
                    <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar cliente..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="input pl-10 py-2"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>

                    {/* Lista */}
                    <div className="overflow-y-auto max-h-64">
                        {isLoading ? (
                            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                                <div className="flex items-center justify-center gap-2">
                                    <div className="animate-spin h-4 w-4 border-2 border-primary-600 border-t-transparent rounded-full"></div>
                                    Carregando clientes...
                                </div>
                            </div>
                        ) : filteredClients.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                                {searchTerm
                                    ? 'Nenhum cliente encontrado'
                                    : 'Nenhum cliente cadastrado'}
                            </div>
                        ) : (
                            filteredClients.map((client) => (
                                <button
                                    key={client.id}
                                    type="button"
                                    onClick={() => handleSelect(client.id)}
                                    className={cn(
                                        "w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors",
                                        value === client.id && "bg-primary-50 dark:bg-primary-900/20"
                                    )}
                                >
                                    <div className="font-medium text-gray-900 dark:text-gray-100">
                                        {client.name || client.nome}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {client.email || client.cpfCnpj || client.phone || client.telefone}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
