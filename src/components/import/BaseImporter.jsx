import { useState } from 'react';
import { Upload, AlertCircle, CheckCircle, Database, Loader } from 'lucide-react';
import { Button } from '../Button';
import { readFile, validateFile, importBaseEGS } from '../../utils/importBaseEGS';
import toast from 'react-hot-toast';

/**
 * Componente de Importação de Base EGS
 * Permite upload de arquivo "Infos Clientes.csv" para popular clients e plants
 */
export const BaseImporter = ({ database = 'EGS', onComplete }) => {
    const [file, setFile] = useState(null);
    const [records, setRecords] = useState([]);
    const [validation, setValidation] = useState(null);
    const [importing, setImporting] = useState(false);
    const [progress, setProgress] = useState(null);
    const [results, setResults] = useState(null);

    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setRecords([]);
        setValidation(null);
        setResults(null);

        try {
            toast.loading('Lendo arquivo...');
            const { records: parsedRecords } = await readFile(selectedFile);
            setRecords(parsedRecords);

            const validation = validateFile(parsedRecords);
            setValidation(validation);

            toast.dismiss();
            if (validation.valid) {
                toast.success(`${parsedRecords.length} registros encontrados`);
            } else {
                toast.error('Arquivo com problemas');
            }
        } catch (error) {
            toast.dismiss();
            toast.error('Erro ao ler arquivo: ' + error.message);
            console.error(error);
        }
    };

    const handleImport = async () => {
        if (!records || records.length === 0) return;

        setImporting(true);
        setProgress({ current: 0, total: records.length, percent: 0 });

        try {
            const results = await importBaseEGS(records, {
                database,
                onProgress: (prog) => setProgress(prog),
            });

            setResults(results);
            toast.success(`✅ Importação concluída! ${results.success}/${results.total} registros`);

            if (onComplete) {
                onComplete(results);
            }
        } catch (error) {
            toast.error('Erro na importação: ' + error.message);
            console.error(error);
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="card">
            <div className="flex items-center gap-3 mb-6">
                <Database className="h-6 w-6 text-primary-600" />
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Importar Base de Clientes
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Faça upload do arquivo "Infos Clientes.csv" para popular a base
                    </p>
                </div>
            </div>

            {/* Upload Area */}
            <div className="mb-6">
                <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {file ? file.name : 'Clique para selecionar arquivo'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            CSV ou Excel (.xlsx, .xls)
                        </p>
                    </div>
                    <input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileChange}
                        disabled={importing}
                    />
                </label>
            </div>

            {/* Validation Results */}
            {validation && (
                <div className="mb-6 space-y-2">
                    {validation.errors.map((error, i) => (
                        <div
                            key={i}
                            className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                        >
                            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                        </div>
                    ))}

                    {validation.warnings.map((warning, i) => (
                        <div
                            key={i}
                            className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
                        >
                            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-yellow-800 dark:text-yellow-200">{warning}</p>
                        </div>
                    ))}

                    {validation.valid && validation.warnings.length === 0 && (
                        <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-green-800 dark:text-green-200">
                                Arquivo válido! {records.length} registros prontos para importar.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Progress */}
            {importing && progress && (
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            Importando...
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {progress.current}/{progress.total} ({progress.percent}%)
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress.percent}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Results */}
            {results && (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                        Resultado da Importação
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-600 dark:text-gray-400">Total:</span>
                            <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                                {results.total}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-600 dark:text-gray-400">Sucesso:</span>
                            <span className="ml-2 font-medium text-green-600 dark:text-green-400">
                                {results.success}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-600 dark:text-gray-400">Erros:</span>
                            <span className="ml-2 font-medium text-red-600 dark:text-red-400">
                                {results.errors.length}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-600 dark:text-gray-400">Usinas:</span>
                            <span className="ml-2 font-medium text-blue-600 dark:text-blue-400">
                                {results.plantsCreated.size}
                            </span>
                        </div>
                    </div>

                    {results.errors.length > 0 && (
                        <details className="mt-4">
                            <summary className="cursor-pointer text-sm text-red-600 dark:text-red-400 hover:underline">
                                Ver erros ({results.errors.length})
                            </summary>
                            <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                                {results.errors.map((err, i) => (
                                    <div key={i} className="text-xs text-gray-600 dark:text-gray-400">
                                        • {err.record.installationId}: {err.error}
                                    </div>
                                ))}
                            </div>
                        </details>
                    )}
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
                <Button
                    onClick={handleImport}
                    disabled={!validation?.valid || importing || !records.length}
                    className="flex-1"
                >
                    {importing ? (
                        <>
                            <Loader className="h-4 w-4 mr-2 animate-spin" />
                            Importando...
                        </>
                    ) : (
                        <>
                            <Database className="h-4 w-4 mr-2" />
                            Importar {records.length} Registros
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
};
