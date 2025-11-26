import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export class ClientService {
  constructor(db) {
    this.db = db;
    this.collectionName = 'clients';
  }

  // --- PAGINAÇÃO REAL (COM SUPORTE A MULTI-PROJETOS) ---
  async getPage(baseFilter, pageSize, lastDoc = null) {
    let q;
    const constraints = [];

    // 1. Filtro de Base (Opcional)
    // Se for 'TODOS' ou vazio, não aplica o filtro, trazendo todos os projetos (LNV, ALA, etc.)
    if (baseFilter && baseFilter !== 'TODOS') {
      constraints.push(where('database', '==', baseFilter));
    }

    // 2. Ordenação
    constraints.push(orderBy('name'));

    // 3. Limite (Paginação)
    constraints.push(limit(pageSize));

    // 4. Cursor (Continuar de onde parou)
    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    try {
      // Tenta criar a query com ordenação
      q = query(collection(this.db, this.collectionName), ...constraints);
    } catch (e) {
      console.warn("Erro de índice ou ordenação. Tentando fallback simples.");
      // Fallback em caso de erro de índice no Firebase (comum no início)
      const simpleConstraints = [];
      if (baseFilter && baseFilter !== 'TODOS') {
        simpleConstraints.push(where('database', '==', baseFilter));
      }
      simpleConstraints.push(limit(pageSize));
      if (lastDoc) simpleConstraints.push(startAfter(lastDoc));

      q = query(collection(this.db, this.collectionName), ...simpleConstraints);
    }

    const snapshot = await getDocs(q);

    return {
      data: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
      hasMore: snapshot.docs.length === pageSize
    };
  }

  // --- DADOS PARA DASHBOARD (KPIs) ---
  async getAllForDashboard(baseFilter) {
    let q;
    if (baseFilter && baseFilter !== 'TODOS') {
      // Filtra apenas o projeto selecionado
      q = query(collection(this.db, this.collectionName), where('database', '==', baseFilter));
    } else {
      // Traz TUDO para a visão consolidada (Diretoria)
      q = query(collection(this.db, this.collectionName));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  // --- OPERAÇÕES CRUD ---

  async save(id, data) {
    const cleanData = this.removeUndefined(data);

    if (id) {
      const ref = doc(this.db, this.collectionName, id);
      await updateDoc(ref, cleanData);
    } else {
      cleanData.createdAt = new Date().toISOString();
      await addDoc(collection(this.db, this.collectionName), cleanData);
    }
  }

  async delete(id) {
    const ref = doc(this.db, this.collectionName, id);
    await deleteDoc(ref);
  }

  // Limpeza de Base (Apenas se uma base específica for selecionada)
  async deleteAll(baseFilter) {
    if (!baseFilter || baseFilter === 'TODOS') {
      throw new Error("Segurança: Selecione um projeto específico (ex: LNV) para limpar.");
    }

    console.log(`Iniciando limpeza do projeto: ${baseFilter}...`);
    const q = query(collection(this.db, this.collectionName), where('database', '==', baseFilter));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return 0;

    const batchSize = 400;
    const chunks = [];
    let currentChunk = [];

    snapshot.docs.forEach((doc) => {
      currentChunk.push(doc.ref);
      if (currentChunk.length === batchSize) {
        chunks.push(currentChunk);
        currentChunk = [];
      }
    });
    if (currentChunk.length > 0) chunks.push(currentChunk);

    let count = 0;
    for (const chunk of chunks) {
      const batch = writeBatch(this.db);
      chunk.forEach(ref => batch.delete(ref));
      await batch.commit();
      count += chunk.length;
      console.log(`Apagados ${count} registos...`);
    }
    return count;
  }

  removeUndefined(obj) {
    return Object.fromEntries(
      Object.entries(obj).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );
  }
}