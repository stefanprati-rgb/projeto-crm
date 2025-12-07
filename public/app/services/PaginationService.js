/**
 * PaginationService - Serviço de paginação robusta para Firestore
 * 
 * Implementa paginação com ordenação composta para evitar duplicatas
 * e garantir consistência mesmo com dados sendo adicionados/removidos.
 */

import { query, collection, orderBy, limit, startAfter, getDocs } from 'firebase/firestore';
import { db } from '../config/firebaseConfig.js';
import { firestoreWithRetry } from '../utils/retry.js';

export class PaginationService {
    constructor(collectionName, defaultPageSize = 20) {
        this.collectionName = collectionName;
        this.defaultPageSize = defaultPageSize;
        this.cache = new Map(); // Cache de páginas
    }

    /**
     * Busca uma página de documentos
     * 
     * @param {string} orderByField - Campo para ordenação (padrão: 'createdAt')
     * @param {number} pageSize - Tamanho da página
     * @param {DocumentSnapshot} lastDoc - Último documento da página anterior
     * @param {string} direction - Direção da ordenação ('desc' ou 'asc')
     * @returns {Promise<{data: Array, lastDoc: DocumentSnapshot, hasMore: boolean}>}
     */
    async getPage(orderByField = 'createdAt', pageSize = this.defaultPageSize, lastDoc = null, direction = 'desc') {
        try {
            // Ordenação composta garante consistência e evita duplicatas
            // O campo __name__ (ID do documento) serve como tiebreaker
            let constraints = [
                orderBy(orderByField, direction),
                orderBy('__name__', direction), // Tiebreaker crítico para evitar duplicatas
                limit(pageSize)
            ];

            // Se há um último documento, continua a partir dele
            if (lastDoc) {
                constraints.push(startAfter(lastDoc));
            }

            const q = query(collection(db, this.collectionName), ...constraints);

            // Executa query com retry automático
            const snapshot = await firestoreWithRetry(
                () => getDocs(q),
                `paginacao_${this.collectionName}`
            );

            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                _doc: doc // Mantém referência ao DocumentSnapshot para próxima página
            }));

            return {
                data,
                lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
                hasMore: snapshot.docs.length === pageSize,
                total: snapshot.size
            };

        } catch (error) {
            console.error(`❌ Erro ao buscar página de ${this.collectionName}:`, error);
            throw error;
        }
    }

    /**
     * Busca primeira página (helper)
     */
    async getFirstPage(orderByField = 'createdAt', pageSize = this.defaultPageSize, direction = 'desc') {
        return this.getPage(orderByField, pageSize, null, direction);
    }

    /**
     * Busca próxima página
     */
    async getNextPage(orderByField, pageSize, lastDoc, direction = 'desc') {
        if (!lastDoc) {
            throw new Error('lastDoc é obrigatório para buscar próxima página');
        }
        return this.getPage(orderByField, pageSize, lastDoc, direction);
    }

    /**
     * Limpa cache de páginas
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Busca com filtros adicionais
     * 
     * @param {Array} additionalConstraints - Constraints adicionais (where, etc)
     * @param {string} orderByField - Campo para ordenação
     * @param {number} pageSize - Tamanho da página
     * @param {DocumentSnapshot} lastDoc - Último documento
     */
    async getPageWithFilters(additionalConstraints = [], orderByField = 'createdAt', pageSize = this.defaultPageSize, lastDoc = null) {
        try {
            let constraints = [
                ...additionalConstraints,
                orderBy(orderByField, 'desc'),
                orderBy('__name__', 'desc'),
                limit(pageSize)
            ];

            if (lastDoc) {
                constraints.push(startAfter(lastDoc));
            }

            const q = query(collection(db, this.collectionName), ...constraints);

            const snapshot = await firestoreWithRetry(
                () => getDocs(q),
                `paginacao_filtrada_${this.collectionName}`
            );

            return {
                data: snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    _doc: doc
                })),
                lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
                hasMore: snapshot.docs.length === pageSize,
                total: snapshot.size
            };

        } catch (error) {
            console.error(`❌ Erro ao buscar página filtrada de ${this.collectionName}:`, error);
            throw error;
        }
    }
}

/**
 * Instâncias pré-configuradas para coleções comuns
 */
export const clientsPagination = new PaginationService('clients', 20);
export const ticketsPagination = new PaginationService('tickets', 20);
export const invoicesPagination = new PaginationService('invoices', 20);
