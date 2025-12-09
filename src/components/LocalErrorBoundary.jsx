import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

/**
 * Error Boundary Local - Para uso em componentes específicos
 * Mostra um card de erro compacto em vez de tela cheia
 */
export class LocalErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Local Error Boundary caught:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
        if (this.props.onReset) {
            this.props.onReset();
        }
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="card border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30">
                                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                                {this.props.title || 'Não foi possível carregar os detalhes'}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                {this.props.message || 'Ocorreu um erro ao processar esta informação. Tente novamente.'}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    onClick={this.handleReset}
                                    variant="primary"
                                    size="sm"
                                >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Tentar Novamente
                                </Button>
                                {this.props.onClose && (
                                    <Button
                                        onClick={this.props.onClose}
                                        variant="ghost"
                                        size="sm"
                                    >
                                        Fechar
                                    </Button>
                                )}
                            </div>
                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <details className="mt-4">
                                    <summary className="cursor-pointer text-xs text-gray-500 dark:text-gray-400">
                                        Detalhes técnicos
                                    </summary>
                                    <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto max-h-32">
                                        {this.state.error.toString()}
                                    </pre>
                                </details>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
