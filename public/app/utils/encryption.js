export class DataEncryption {
    constructor() {
        this.algorithm = 'AES-GCM';
    }

    // Gera chave única para sessão ou usuário (gerenciar armazenamento seguro desta chave é vital)
    async generateKey() {
        return await crypto.subtle.generateKey(
            { name: this.algorithm, length: 256 },
            true,
            ['encrypt', 'decrypt']
        );
    }

    async encrypt(text, key) {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const iv = crypto.getRandomValues(new Uint8Array(12));

        const encrypted = await crypto.subtle.encrypt(
            { name: this.algorithm, iv },
            key,
            data
        );

        return {
            ciphertext: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
            iv: btoa(String.fromCharCode(...iv))
        };
    }

    async decrypt(encryptedData, key) {
        const iv = Uint8Array.from(atob(encryptedData.iv), c => c.charCodeAt(0));
        const ciphertext = Uint8Array.from(
            atob(encryptedData.ciphertext),
            c => c.charCodeAt(0)
        );

        const decrypted = await crypto.subtle.decrypt(
            { name: this.algorithm, iv },
            key,
            ciphertext
        );

        return new TextDecoder().decode(decrypted);
    }
}
