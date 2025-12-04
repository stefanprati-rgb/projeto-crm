import {
    collection,
    query,
    where,
    getDocs,
    orderBy,
    limit,
    doc,
    getDoc,
    updateDoc,
    increment,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase.js";

export class KBService {
    constructor() {
        this.collectionName = 'kb_articles';
    }

    /**
     * Busca artigos baseados em um termo ou retorna populares se não houver termo.
     * Implementa uma busca "inteligente" simples no client-side para contornar limitações do Firestore.
     * @param {string} searchTerm - Termo de busca
     * @returns {Promise<Array>} Lista de artigos
     */
    async searchArticles(searchTerm = '') {
        try {
            // Se não houver termo, retorna os populares
            if (!searchTerm || searchTerm.trim().length === 0) {
                return await this.getPopularArticles();
            }

            const term = searchTerm.toLowerCase().trim();

            // Busca todos os artigos (ou um subconjunto razoável) para filtrar no cliente
            // Nota: Em produção com muitos dados, ideal usar Algolia/ElasticSearch
            const q = query(
                collection(db, this.collectionName),
                orderBy('views', 'desc'),
                limit(50)
            );

            const snapshot = await getDocs(q);
            const allArticles = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Filtro Client-side (Título, Tags ou Conteúdo)
            const results = allArticles.filter(article => {
                const titleMatch = article.title?.toLowerCase().includes(term);
                const tagsMatch = article.tags?.some(tag => tag.toLowerCase().includes(term));
                const categoryMatch = article.category?.toLowerCase().includes(term);
                return titleMatch || tagsMatch || categoryMatch;
            });

            // Fallback: Se a busca não retornar nada, retorna populares com uma flag
            if (results.length === 0) {
                console.log(`Nenhum artigo encontrado para "${term}". Retornando populares.`);
                const popular = await this.getPopularArticles();
                return popular.map(p => ({ ...p, isFallback: true }));
            }

            return results;

        } catch (error) {
            console.error("Erro ao buscar artigos da KB:", error);
            throw error;
        }
    }

    /**
     * Retorna os artigos mais visualizados.
     * @param {number} limitCount - Quantidade de artigos
     */
    async getPopularArticles(limitCount = 5) {
        try {
            const q = query(
                collection(db, this.collectionName),
                orderBy('views', 'desc'),
                limit(limitCount)
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error("Erro ao buscar artigos populares:", error);
            return [];
        }
    }

    /**
     * Busca artigos por categoria específica.
     * @param {string} category 
     */
    async getArticlesByCategory(category) {
        try {
            const q = query(
                collection(db, this.collectionName),
                where('category', '==', category),
                orderBy('views', 'desc'),
                limit(10)
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error(`Erro ao buscar categoria ${category}:`, error);
            return [];
        }
    }

    /**
     * Obtém detalhes de um artigo e incrementa visualizações.
     * @param {string} articleId 
     */
    async getArticle(articleId) {
        try {
            const docRef = doc(db, this.collectionName, articleId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                // Incrementa view count em background
                this.incrementViewCount(articleId);
                return { id: docSnap.id, ...docSnap.data() };
            } else {
                throw new Error("Artigo não encontrado");
            }
        } catch (error) {
            console.error("Erro ao obter artigo:", error);
            throw error;
        }
    }

    /**
     * Incrementa o contador de visualizações atomicamente.
     * @param {string} articleId 
     */
    async incrementViewCount(articleId) {
        try {
            const docRef = doc(db, this.collectionName, articleId);
            await updateDoc(docRef, {
                views: increment(1)
            });
        } catch (error) {
            console.error("Erro ao incrementar views:", error);
        }
    }

    /**
     * Cria um novo artigo (útil para seeds ou admin).
     */
    async createArticle(data) {
        try {
            const docData = {
                ...data,
                views: 0,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };
            const docRef = await addDoc(collection(db, this.collectionName), docData);
            return docRef.id;
        } catch (error) {
            console.error("Erro ao criar artigo:", error);
            throw error;
        }
    }
}
