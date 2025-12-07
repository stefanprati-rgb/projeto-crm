import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, FileText, X, Check, AlertCircle } from 'lucide-react';
import { Modal, Button } from '../';
import { importFromExcel, importFromCSV } from '../../utils/exportUtils';
import { cn } from '../../utils/cn';

export const ImportModal = ({ isOpen, onClose, onImport, type = 'clients' }) => {
    const [file, setFile] = useState(null);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef();

    const handleFileSelect = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setError(null);
        setLoading(true);

        try {
            let result;
            const fileExtension = selectedFile.name.split('.').pop().toLowerCase();

            if (fileExtension === 'xlsx' || fileExtension === 'xls') {
                result = await importFromExcel(selectedFile);
            } else if (fileExtension === 'csv') {
                result = await importFromCSV(selectedFile);
            } else {
                throw new Error('Formato de arquivo não suportado. Use Excel (.xlsx) ou CSV (.csv)');
            }

            if (result.success) {
                setData(result.data);
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        if (!data) return;

        setLoading(true);
        try {
            await onImport(data);
            handleClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setData(null);
        setError(null);
        onClose();
    };

    const handleRemoveFile = () => {
        setFile(null);
        setData(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={`Importar ${type === 'clients' ? 'Clientes' : 'Tickets'}`}
            size="lg"
            footer={
                <>
                    <Button variant="secondary" onClick={handleClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleImport}
                        disabled={!data || loading}
                    >
                        {loading ? 'Importando...' : `Importar ${data?.length || 0} registros`}
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                {/* Upload Area */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Selecione o arquivo
                    </label>

                    {!file ? (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center cursor-pointer hover:border-primary-500 dark:hover:border-primary-500 transition-colors"
                        >
                            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                                Clique para selecionar um arquivo
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Formatos suportados: Excel (.xlsx) ou CSV (.csv)
                            </p>
                        </div>
                    ) : (
                        <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {file.name.endsWith('.xlsx') || file.name.endsWith('.xls') ? (
                                        <FileSpreadsheet className="h-8 w-8 text-green-600" />
                                    ) : (
                                        <FileText className="h-8 w-8 text-blue-600" />
                                    )}
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {file.name}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {(file.size / 1024).toFixed(2)} KB
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleRemoveFile}
                                    disabled={loading}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                </div>

                {/* Loading */}
                {loading && (
                    <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                        <p className="ml-3 text-sm text-gray-600 dark:text-gray-400">
                            Processando arquivo...
                        </p>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-red-900 dark:text-red-100">
                                    Erro ao processar arquivo
                                </p>
                                <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Success Preview */}
                {data && !loading && (
                    <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4">
                        <div className="flex items-center gap-3">
                            <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                                    Arquivo processado com sucesso!
                                </p>
                                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                                    {data.length} registros encontrados
                                </p>
                            </div>
                        </div>

                        {/* Preview */}
                        {data.length > 0 && (
                            <div className="mt-4">
                                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Prévia dos dados:
                                </p>
                                <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3 max-h-40 overflow-auto">
                                    <pre className="text-xs text-gray-600 dark:text-gray-400">
                                        {JSON.stringify(data.slice(0, 3), null, 2)}
                                    </pre>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Instructions */}
                <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                        ℹ️ Instruções de Importação
                    </p>
                    <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                        <li>O arquivo deve conter cabeçalhos na primeira linha</li>
                        <li>Os nomes das colunas devem corresponder aos campos do sistema</li>
                        <li>Dados duplicados serão ignorados</li>
                        <li>A importação pode levar alguns minutos para arquivos grandes</li>
                    </ul>
                </div>
            </div>
        </Modal>
    );
};
