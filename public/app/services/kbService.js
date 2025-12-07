import {
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase.js";

export class KBService {
    constructor() {
        this.collectionName = 'knowledge_base';
    }

    /**
     * Garante que a KB está inicializada com dados
     * Chama automaticamente o seed se a coleção estiver vazia
     */
    static async ensureInitialized() {
        const ref = collection(db, 'knowledge_base');
        const snap = await getDocs(query(ref, limit(1)));

        if (snap.empty) {
            console.log('📚 Knowledge Base vazia. Iniciando seed automático...');
            const kbService = new KBService();
            await kbService.seedInitialData();
            return true;
        }

        return false;
    }


    /**
     * Busca artigos baseados em um termo ou retorna os mais populares
     * @param {string} term - Termo de busca (opcional)
     */
    async searchArticles(term = '') {
        const coll = collection(db, this.collectionName);
        let q;

        // Normaliza o termo para busca simples (lowercase)
        const searchTerm = term.toLowerCase().trim();

        if (!searchTerm) {
            // Se não tem termo, retorna os "Populares" ou Recentes
            q = query(coll, orderBy('views', 'desc'), limit(5));
        } else {
            // Busca simples: Artigos que contêm a tag ou categoria exata
            // Para MVP, faremos filtragem no client-side após buscar um lote
            q = query(coll, limit(20));
        }

        const snapshot = await getDocs(q);
        let articles = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Filtragem Client-Side (Ideal para MVPs e bases pequenas)
        if (searchTerm) {
            articles = articles.filter(a =>
                (a.title && a.title.toLowerCase().includes(searchTerm)) ||
                (a.content && a.content.toLowerCase().includes(searchTerm)) ||
                (a.category && a.category.toLowerCase().includes(searchTerm))
            );
        }

        return articles.slice(0, 5); // Retorna top 5 resultados
    }

    /**
     * Seed inicial para popular a base
     * Este é o método que estava faltando ou em cache antigo
     */
    async seedInitialData() {
        const samples = [
            {
                title: "Como corrigir valor da fatura de energia?",
                content: "Passo a passo para contestar valores: 1. Verifique a leitura do medidor. 2. Compare com o histórico. 3. Abra um chamado anexando a foto do medidor.",
                category: "Faturamento",
                keywords: ["fatura", "valor", "erro", "cobrança"],
                views: 150,
                readTime: "3 min",
                createdAt: serverTimestamp()
            },
            {
                title: "Procedimento de cancelamento de contrato",
                content: "O cancelamento deve ser solicitado com 30 dias de antecedência. Multas podem ser aplicadas conforme cláusula 5 do contrato.",
                category: "Cadastro",
                keywords: ["cancelamento", "sair", "rescisão", "contrato"],
                views: 89,
                readTime: "5 min",
                createdAt: serverTimestamp()
            },
            {
                title: "Entendendo a injeção de créditos na rede",
                content: "Os créditos de energia são injetados pela usina e aparecem na fatura como 'Energia Injetada'. O saldo pode ser usado em até 60 meses.",
                category: "Técnico",
                keywords: ["créditos", "injeção", "gd", "solar"],
                views: 210,
                readTime: "4 min",
                createdAt: serverTimestamp()
            },
            {
                title: "Atualização de dados cadastrais",
                content: "Para mudar o titular ou endereço, envie o comprovante de residência atualizado e documento com foto.",
                category: "Cadastro",
                keywords: ["mudança", "titularidade", "endereço", "dados"],
                views: 45,
                readTime: "2 min",
                createdAt: serverTimestamp()
            }
        ];

        try {
            for (const art of samples) {
                await addDoc(collection(db, this.collectionName), art);
            }
            console.log("Base de Conhecimento populada com sucesso!");
            return true;
        } catch (error) {
            console.error("Erro ao popular KB:", error);
            throw error;
        }
    }
}