import { Modal, Button } from './';
import { AlertTriangle } from 'lucide-react';

export const ConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirmar Ação',
    message = 'Tem certeza que deseja continuar?',
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'danger',
    loading = false
}) => {
    const handleConfirm = async () => {
        await onConfirm();
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="sm"
            title=""
        >
            <div className="p-6">
                {/* Ícone */}
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>

                {/* Título */}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 text-center mb-2">
                    {title}
                </h3>

                {/* Mensagem */}
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
                    {message}
                </p>

                {/* Aviso */}
                <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3 mb-6">
                    <p className="text-xs text-yellow-800 dark:text-yellow-200 text-center">
                        ⚠️ Esta ação não pode ser desfeita
                    </p>
                </div>

                {/* Botões */}
                <div className="flex gap-3">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1"
                    >
                        {cancelText}
                    </Button>
                    <Button
                        variant={variant}
                        onClick={handleConfirm}
                        disabled={loading}
                        className="flex-1"
                    >
                        {loading ? 'Processando...' : confirmText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
