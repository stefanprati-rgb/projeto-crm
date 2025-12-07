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
import { setCursor, getCursor, clearCursor } from "../utils/indexedDB.js";
import { store } from "../core/store.js";
import { bus } from "../core/eventBus.js";

export class ClientService {
  constructor(db) {
    this.db = db;
    this.collectionName = 'clients';
  }

  // --- PAGINAÇÃO REAL (PERSISTENTE) ---
  /**
   * Carrega páginas de clientes.
   * @param {string} direction 'next' | 'first' | 'reload'
   * @param {object} cursorObj Objeto cursor opcional ({ id, createdAt }) para 'next'.
   */
  async loadPage(direction, baseFilter, cursorObj = null) {
    const cursorKey = `clients_${baseFilter}_cursor`;
    let effectiveCursor = null;

    // Set loading state
    store.set('ui.loading', true);
    bus.emit('ui:loading', true);

    try {
      if (direction === 'next' && cursorObj) {
        // Navegação: Usa cursor fornecido e SALVA
        effectiveCursor = cursorObj;
        await setCursor(cursorKey, effectiveCursor);
      } else if (direction === 'first') {
        // Reset: Limpa cursor
        await clearCursor(cursorKey);
        effectiveCursor = null;
      } else {
        // Reload/Resume: Tenta recuperar do banco
        effectiveCursor = await getCursor(cursorKey);
      }
    } catch (e) {
      console.warn("[ClientService] Erro ao manipular cursor:", e);
      // Fallback: sem cursor
    }

    // Monta Query
    const filters = [];
    if (baseFilter && baseFilter !== 'TODOS') filters.push(where('database', '==', baseFilter));

    // Ordenação por Data de Criação (Estável)
    filters.push(orderBy('createdAt', 'desc'));
    filters.push(orderBy('__name__', 'desc'));

    filters.push(limit(25));

    if (effectiveCursor) {
      filters.push(startAfter(effectiveCursor.createdAt, effectiveCursor.id));
    }

    const q = query(collection(this.db, this.collectionName), ...filters);

    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    // Prepara próximo cursor
    const lastDoc = snapshot.docs[snapshot.docs.length - 1];
    let nextCursor = null;
    if (lastDoc) {
      const d = lastDoc.data();
      nextCursor = { createdAt: d.createdAt, id: lastDoc.id };
    }

    const hasMore = snapshot.docs.length === 25;

    // Update store with batch
    store.batch({
      clients: direction === 'first' ? data : [...store.get('clients'), ...data],
      'pagination.hasMore': hasMore,
      'ui.loading': false
    });

    // Emit events
    bus.emit('clients:loaded', data);
    bus.emit('ui:loading', false);

    return {
      data,
      nextCursor,
      hasMore
    };
  }

  // --- PAGINAÇÃO REAL COM FALLBACK (LEGACY) ---
  async getPage(baseFilter, pageSize, lastDoc = null) {
    console.log(`[ClientService] Buscando página. Base: ${baseFilter}, LastDoc: ${!!lastDoc}`);

    // TENTATIVA 1: Busca Padrão (Ordenada por Nome)
    try {
      const result = await this._runQuery(baseFilter, pageSize, lastDoc, 'name');
      if (result.data.length > 0 || lastDoc) {
        return result;
      }
      console.warn("[ClientService] Busca por nome retornou vazio. Tentando fallback por Data...");
    } catch (e) {
      console.warn("[ClientService] Erro na busca por nome:", e);
    }

    // TENTATIVA 2: Fallback (Ordenada por Data de Criação)
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
    const clients = store.get('clients');

    if (id) {
      // UPDATE - Optimistic
      const oldClient = clients.find(c => c.id === id);
      const optimisticClient = { ...oldClient, ...cleanData, pending: true };

      // Update UI immediately
      store.set('clients', clients.map(c => c.id === id ? optimisticClient : c));
      bus.emit('clients:updated', optimisticClient);

      try {
        const ref = doc(this.db, this.collectionName, id);
        await updateDoc(ref, cleanData);

        // Success: remove pending flag
        store.set('clients', store.get('clients').map(c =>
          c.id === id ? { ...c, pending: false } : c
        ));

        await auditLogger.log('UPDATE', 'clients', id, {
          updatedFields: Object.keys(cleanData),
          clientName: cleanData.name
        });

        bus.emit('ui:success', 'Cliente atualizado com sucesso');
      } catch (error) {
        // Rollback on error
        store.set('clients', clients.map(c => c.id === id ? oldClient : c));
        bus.emit('ui:error', 'Falha ao atualizar cliente');
        throw error;
      }

    } else {
      // CREATE - Optimistic
      cleanData.createdAt = new Date().toISOString();
      const tempId = 'temp-' + Date.now();
      const optimisticClient = { ...cleanData, id: tempId, pending: true };

      // Add to UI immediately
      store.set('clients', [optimisticClient, ...clients]);
      bus.emit('clients:created', optimisticClient);

      try {
        const docRef = await addDoc(collection(this.db, this.collectionName), cleanData);

        // Success: replace temp ID with real ID
        store.set('clients', store.get('clients').map(c =>
          c.id === tempId ? { ...c, id: docRef.id, pending: false } : c
        ));

        await auditLogger.log('CREATE', 'clients', docRef.id, {
          clientName: cleanData.name,
          database: cleanData.database
        });

        bus.emit('ui:success', 'Cliente criado com sucesso');
        return docRef.id;
      } catch (error) {
        // Rollback: remove optimistic entry
        store.set('clients', store.get('clients').filter(c => c.id !== tempId));
        bus.emit('ui:error', 'Falha ao criar cliente');
        throw error;
      }
    }
  }

  async delete(id) {
    const clients = store.get('clients');
    const deletedClient = clients.find(c => c.id === id);

    // Optimistic: remove from UI immediately
    store.set('clients', clients.filter(c => c.id !== id));
    bus.emit('clients:deleted', id);

    try {
      const ref = doc(this.db, this.collectionName, id);
      await deleteDoc(ref);
      await auditLogger.log('DELETE', 'clients', id);
      bus.emit('ui:success', 'Cliente removido com sucesso');
    } catch (error) {
      // Rollback: restore deleted client
      store.set('clients', [...store.get('clients'), deletedClient]);
      bus.emit('ui:error', 'Falha ao remover cliente');
      throw error;
    }
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