export class ClientRateLimiter {
    constructor(maxRequests = 10, windowMs = 60000) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
        this.requests = new Map();
    }

    canMakeRequest(userId) {
        const now = Date.now();
        const userRequests = this.requests.get(userId) || [];

        // Filtra requisições fora da janela de tempo atual
        const validRequests = userRequests.filter(
            timestamp => now - timestamp < this.windowMs
        );

        if (validRequests.length >= this.maxRequests) {
            return false;
        }

        validRequests.push(now);
        this.requests.set(userId, validRequests);
        return true;
    }

    async throttle(userId, fn) {
        if (!this.canMakeRequest(userId)) {
            throw new Error('Limite de requisições excedido. Tente novamente em alguns minutos.');
        }
        return await fn();
    }
}

// Instância Singleton para uso global
export const dbRateLimiter = new ClientRateLimiter(20, 60000); // 20 reqs/min
