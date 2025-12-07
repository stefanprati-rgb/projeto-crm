// security.js - Client-Side Security Utilities
// PRIORIDADE: ALTA | IMPACTO: CRÍTICO

import { showToast } from '../ui/toast.js';

/**
 * RATE LIMITER CLIENT-SIDE
 * Previne abuso de requisições repetidas (brute force, spam)
 */
export class RateLimiter {
  constructor() {
    this.requests = new Map(); // { action: [timestamps] }
    this.limits = {
      login: { maxAttempts: 5, windowMs: 15 * 60 * 1000 }, // 5 tentativas em 15min
      createClient: { maxAttempts: 10, windowMs: 60 * 1000 }, // 10 criações por minuto
      updateClient: { maxAttempts: 30, windowMs: 60 * 1000 }, // 30 atualizações por minuto
      searchQuery: { maxAttempts: 50, windowMs: 60 * 1000 }, // 50 buscas por minuto
      export: { maxAttempts: 3, windowMs: 60 * 1000 } // 3 exportações por minuto
    };
  }

  /**
   * Verifica se a ação pode ser executada
   * @param {string} action - Nome da ação (ex: 'login', 'createClient')
   * @returns {boolean} - true se permitido, false se bloqueado
   */
  checkLimit(action) {
    const now = Date.now();
    const limit = this.limits[action];
    
    if (!limit) {
      console.warn(`Rate limit não configurado para: ${action}`);
      return true; // Permite se não há limite definido
    }

    // Inicializa array de timestamps para esta ação
    if (!this.requests.has(action)) {
      this.requests.set(action, []);
    }

    const timestamps = this.requests.get(action);
    
    // Remove timestamps fora da janela de tempo
    const validTimestamps = timestamps.filter(
      t => now - t < limit.windowMs
    );

    // Verifica se excedeu o limite
    if (validTimestamps.length >= limit.maxAttempts) {
      const oldestTimestamp = Math.min(...validTimestamps);
      const waitTime = Math.ceil((limit.windowMs - (now - oldestTimestamp)) / 1000);
      
      showToast(
        `Muitas tentativas. Aguarde ${waitTime}s antes de tentar novamente.`,
        'error'
      );
      
      return false;
    }

    // Adiciona timestamp atual e atualiza
    validTimestamps.push(now);
    this.requests.set(action, validTimestamps);
    
    return true;
  }

  /**
   * Reseta o contador de uma ação específica
   */
  reset(action) {
    this.requests.delete(action);
  }

  /**
   * Limpa todos os contadores
   */
  clearAll() {
    this.requests.clear();
  }
}

/**
 * DATA ENCRYPTOR
 * Criptografa dados sensíveis antes de salvar no Firestore
 * Usa Web Crypto API (SubtleCrypto) - nativo do navegador
 */
export class DataEncryptor {
  constructor() {
    this.algorithm = 'AES-GCM';
    this.keyLength = 256;
    this.saltLength = 16;
    this.ivLength = 12;
  }

  /**
   * Deriva uma chave criptográfica a partir de uma senha
   * @private
   */
  async deriveKey(password, salt) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: this.algorithm, length: this.keyLength },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Criptografa um texto
   * @param {string} plaintext - Texto a ser criptografado
   * @param {string} password - Senha para derivação da chave
   * @returns {Promise<string>} - String Base64 com salt+iv+ciphertext
   */
  async encrypt(plaintext, password) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(plaintext);

      // Gera salt e IV aleatórios
      const salt = crypto.getRandomValues(new Uint8Array(this.saltLength));
      const iv = crypto.getRandomValues(new Uint8Array(this.ivLength));

      // Deriva chave a partir da senha
      const key = await this.deriveKey(password, salt);

      // Criptografa
      const ciphertext = await crypto.subtle.encrypt(
        { name: this.algorithm, iv: iv },
        key,
        data
      );

      // Combina salt + iv + ciphertext em um único buffer
      const combined = new Uint8Array(
        salt.length + iv.length + ciphertext.byteLength
      );
      combined.set(salt, 0);
      combined.set(iv, salt.length);
      combined.set(new Uint8Array(ciphertext), salt.length + iv.length);

      // Retorna em Base64 para armazenamento
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Erro ao criptografar:', error);
      throw new Error('Falha na criptografia');
    }
  }

  /**
   * Descriptografa um texto
   * @param {string} encryptedBase64 - String Base64 criptografada
   * @param {string} password - Senha usada na criptografia
   * @returns {Promise<string>} - Texto descriptografado
   */
  async decrypt(encryptedBase64, password) {
    try {
      // Decodifica Base64
      const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));

      // Extrai salt, iv e ciphertext
      const salt = combined.slice(0, this.saltLength);
      const iv = combined.slice(this.saltLength, this.saltLength + this.ivLength);
      const ciphertext = combined.slice(this.saltLength + this.ivLength);

      // Deriva chave
      const key = await this.deriveKey(password, salt);

      // Descriptografa
      const plaintext = await crypto.subtle.decrypt(
        { name: this.algorithm, iv: iv },
        key,
        ciphertext
      );

      // Decodifica bytes para string
      const decoder = new TextDecoder();
      return decoder.decode(plaintext);
    } catch (error) {
      console.error('Erro ao descriptografar:', error);
      throw new Error('Falha na descriptografia');
    }
  }
}

/**
 * INPUT SANITIZER
 * Remove caracteres perigosos de inputs do usuário
 */
export class InputSanitizer {
  /**
   * Remove tags HTML e scripts
   */
  static sanitizeHTML(input) {
    if (typeof input !== 'string') return input;
    
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }

  /**
   * Valida e sanitiza CPF
   */
  static sanitizeCPF(cpf) {
    if (!cpf) return '';
    // Remove tudo exceto números
    const cleaned = cpf.replace(/\D/g, '');
    // Valida comprimento
    if (cleaned.length !== 11) return '';
    return cleaned;
  }

  /**
   * Valida e sanitiza CNPJ
   */
  static sanitizeCNPJ(cnpj) {
    if (!cnpj) return '';
    const cleaned = cnpj.replace(/\D/g, '');
    if (cleaned.length !== 14) return '';
    return cleaned;
  }

  /**
   * Valida e sanitiza email
   */
  static sanitizeEmail(email) {
    if (!email) return '';
    const cleaned = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(cleaned) ? cleaned : '';
  }

  /**
   * Valida e sanitiza telefone brasileiro
   */
  static sanitizePhone(phone) {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    // Aceita 10 ou 11 dígitos (DDD + número)
    if (cleaned.length < 10 || cleaned.length > 11) return '';
    return cleaned;
  }

  /**
   * Remove caracteres SQL perigosos (prevenção adicional)
   */
  static sanitizeSQL(input) {
    if (typeof input !== 'string') return input;
    return input.replace(/['"`;\\]/g, '');
  }
}

/**
 * AUDIT LOGGER
 * Registra ações sensíveis para auditoria
 */
export class AuditLogger {
  constructor(db, auth) {
    this.db = db;
    this.auth = auth;
  }

  /**
   * Registra uma ação no log de auditoria
   * @param {string} action - Tipo de ação (ex: 'CREATE_CLIENT', 'UPDATE_CLIENT')
   * @param {object} metadata - Dados adicionais da ação
   */
  async log(action, metadata = {}) {
    try {
      const { addDoc, collection, serverTimestamp } = await import(
        'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js'
      );

      const logEntry = {
        action,
        userId: this.auth.currentUser?.uid || 'ANONYMOUS',
        userEmail: this.auth.currentUser?.email || 'UNKNOWN',
        timestamp: serverTimestamp(),
        metadata,
        userAgent: navigator.userAgent,
        ip: 'CLIENT_SIDE' // IP só disponível no backend
      };

      await addDoc(collection(this.db, 'audit_logs'), logEntry);
    } catch (error) {
      console.error('Erro ao criar log de auditoria:', error);
      // Não bloqueia a operação se o log falhar
    }
  }
}

// Instâncias globais (singleton)
export const rateLimiter = new RateLimiter();
export const dataEncryptor = new DataEncryptor();
