import { Component } from 'react';
import { Button } from '../components';
import { AlertTriangle } from 'lucide-react';

export class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error Boundary caught:', error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                            <AlertTriangle className="h-8 w-8 text-red-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                            Algo deu errado
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
                            Ocorreu um erro inesperado. Por favor, recarregue a página ou entre em contato com o suporte.
                        </p>
                        <div className="flex gap-3 justify-center">
                            <Button onClick={this.handleReload} variant="primary">
                                Recarregar Página
                            </Button>
                            <Button onClick={() => this.setState({ hasError: false })} variant="secondary">
                                Tentar Novamente
                            </Button>
                        </div>
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="mt-6 text-left">
                                <summary className="cursor-pointer text-sm text-gray-600 dark:text-gray-400">
                                    Detalhes do erro (apenas em desenvolvimento)
                                </summary>
                                <pre className="mt-2 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs overflow-auto">
                                    {this.state.error.toString()}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
