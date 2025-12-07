/**
 * RetryHandler - Implementa retry logic com backoff exponencial
 * 
 * Previne falhas temporárias de rede e melhora a resiliência da aplicação.
 * Usa backoff exponencial com jitter para evitar "thundering herd problem".
 */

export class RetryHandler {
    constructor(maxAttempts = 3, baseDelay = 1000, maxDelay = 10000) {
        this.maxAttempts = maxAttempts;
        this.baseDelay = baseDelay;
        this.maxDelay = maxDelay;
    }

    async execute(fn, context = 'operation') {
        let lastError;

        for (let attempt = 0; attempt < this.maxAttempts; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;

                // Erros permanentes não devem ser retentados
                if (this.isPermanentError(error)) {
                    console.error(`❌ ${context}: Erro permanente detectado (${error.code})`);
                    throw error;
                }

                // Última tentativa - lançar erro
                if (attempt === this.maxAttempts - 1) {
                    console.error(`❌ ${context}: Falhou após ${this.maxAttempts} tentativas`);
                    throw error;
                }

                // Backoff Exponencial com Jitter (evita thundering herd)
                const exponentialDelay = this.baseDelay * Math.pow(2, attempt);
                const jitter = Math.random() * 200; // 0-200ms de variação
                const delay = Math.min(exponentialDelay, this.maxDelay) + jitter;

                console.warn(
                    `⚠️ ${context}: Tentativa ${attempt + 1}/${this.maxAttempts} falhou. ` +
                    `Retry em ${Math.round(delay)}ms. Erro: ${error.message}`
                );

                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        throw lastError;
    }

    /**
     * Identifica erros que não devem ser retentados
     * Baseado nos códigos de erro do Firebase
     */
    isPermanentError(error) {
        const permanentCodes = [
            'permission-denied',      // Sem permissão
            'unauthenticated',        // Não autenticado
            'invalid-argument',       // Argumento inválido
            'not-found',              // Documento não encontrado
            'already-exists',         // Documento já existe
            'failed-precondition',    // Pré-condição falhou
            'out-of-range',           // Fora do intervalo
            'unimplemented',          // Não implementado
            'data-loss',              // Perda de dados
            'auth/user-not-found',    // Usuário não encontrado
            'auth/wrong-password',    // Senha incorreta
            'auth/invalid-email'      // Email inválido
        ];

        return permanentCodes.includes(error.code);
    }
}

/**
 * Função auxiliar para uso direto com Firestore
 * 
 * @example
 * const data = await firestoreWithRetry(
 *   () => getDocs(query(collection(db, 'clients'))),
 *   'buscar_clientes'
 * );
 */
export async function firestoreWithRetry(queryFn, context = 'firestore_query') {
    const retryHandler = new RetryHandler(3, 1000, 10000);
    return retryHandler.execute(queryFn, context);
}

/**
 * Função auxiliar para operações de autenticação
 * Usa menos tentativas pois erros de auth geralmente são permanentes
 */
export async function authWithRetry(authFn, context = 'auth_operation') {
    const retryHandler = new RetryHandler(2, 500, 3000);
    return retryHandler.execute(authFn, context);
}
