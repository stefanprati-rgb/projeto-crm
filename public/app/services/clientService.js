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
import { auditLogger } from "./logService.js";

export class ClientService {
  constructor(db) {
    this.db = db;
    this.collectionName = 'clients';
  }

  // --- PAGINAÇÃO REAL COM FALLBACK ---
  async getPage(baseFilter, pageSize, lastDoc = null) {
    console.log(`[ClientService] Buscando página. Base: ${baseFilter}, LastDoc: ${!!lastDoc}`);

    // TENTATIVA 1: Busca Padrão (Ordenada por Nome)
    try {
      const result = await this._runQuery(baseFilter, pageSize, lastDoc, 'name');

      // Se encontrou dados ou se é paginação contínua (lastDoc existe), retorna.
      if (result.data.length > 0 || lastDoc) {
        return result;
      }

      // Se retornou 0 na primeira página, pode ser que os documentos não tenham o campo 'name'
      console.warn("[ClientService] Busca por nome retornou vazio. Tentando fallback por Data...");
    } catch (e) {
      console.warn("[ClientService] Erro na busca por nome:", e);
    }

    // TENTATIVA 2: Fallback (Ordenada por Data de Criação) - Mais segura para dados importados
    // Isso garante que você veja os dados mesmo se o campo 'name' estiver faltando ou index falhando
    try {
      console.log("[ClientService] Executando busca fallback por createdAt...");
      return await this._runQuery(baseFilter, pageSize, lastDoc, 'createdAt', 'desc');
    } catch (e) {
      console.error("[ClientService] Erro fatal na busca de clientes:", e);
      throw e;
    }
  }

  // Helper interno para montar e executar a query
  async _runQuery(baseFilter, pageSize, lastDoc, orderField, orderDir = 'asc') {
    const constraints = [];

    // Filtro de Base (Projeto)
    if (baseFilter && baseFilter !== 'TODOS') {
      constraints.push(where('database', '==', baseFilter));
    }

    // Ordenação
    constraints.push(orderBy(orderField, orderDir));

    // Paginação
    constraints.push(limit(pageSize));
    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    const q = query(collection(this.db, this.collectionName), ...constraints);
    const snapshot = await getDocs(q);

    console.log(`[ClientService] Query (${orderField}) retornou ${snapshot.docs.length} docs.`);

    return {
      data: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
      hasMore: snapshot.docs.length === pageSize
    };
  }

  // --- DADOS PARA DASHBOARD ---
  async getAllForDashboard(baseFilter) {
    // Para o dashboard, usamos uma query simplificada para garantir velocidade
    let q;
    if (baseFilter && baseFilter !== 'TODOS') {
      q = query(collection(this.db, this.collectionName), where('database', '==', baseFilter));
    } else {
      q = query(collection(this.db, this.collectionName));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  // --- OPERAÇÕES CRUD (COM AUDITORIA) ---

  async save(id, data) {
    const cleanData = this.removeUndefined(data);

    if (id) {
      // UPDATE
      const ref = doc(this.db, this.collectionName, id);
      await updateDoc(ref, cleanData);

      await auditLogger.log('UPDATE', 'clients', id, {
        updatedFields: Object.keys(cleanData),
        clientName: cleanData.name
      });

    } else {
      // CREATE
      cleanData.createdAt = new Date().toISOString();
      const docRef = await addDoc(collection(this.db, this.collectionName), cleanData);

      await auditLogger.log('CREATE', 'clients', docRef.id, {
        clientName: cleanData.name,
        database: cleanData.database
      });
    }
  }

  async delete(id) {
    const ref = doc(this.db, this.collectionName, id);
    await deleteDoc(ref);
    await auditLogger.log('DELETE', 'clients', id);
  }

  // Limpeza de Base
  async deleteAll(baseFilter) {
    if (!baseFilter || baseFilter === 'TODOS') {
      throw new Error("Segurança: Selecione um projeto específico para limpar.");
    }

    console.log(`Iniciando limpeza do projeto: ${baseFilter}...`);
    await auditLogger.log('BULK_DELETE_START', 'clients', 'ALL', { targetBase: baseFilter });

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

    await auditLogger.log('BULK_DELETE_COMPLETE', 'clients', 'ALL', { targetBase: baseFilter, count });
    return count;
  }

  async batchImport(rows, mapFunction, existingClients, batchSize = 400) {
    const items = rows.map(r => mapFunction ? mapFunction(r) : r);
    const chunks = [];

    for (let i = 0; i < items.length; i += batchSize) {
      chunks.push(items.slice(i, i + batchSize));
    }

    let count = 0;
    for (const chunk of chunks) {
      const batch = writeBatch(this.db);

      chunk.forEach(item => {
        if (item.id) {
          const ref = doc(this.db, this.collectionName, item.id);
          batch.set(ref, item, { merge: true });
        } else {
          const ref = doc(collection(this.db, this.collectionName));
          batch.set(ref, item);
        }
      });

      await batch.commit();
      count++;
      console.log(`Lote ${count}/${chunks.length} processado.`);
    }

    await auditLogger.log('IMPORT', 'clients', 'BATCH', {
      totalRecords: items.length,
      batches: count
    });
  }

  removeUndefined(obj) {
    return Object.fromEntries(
      Object.entries(obj).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );
  }
}