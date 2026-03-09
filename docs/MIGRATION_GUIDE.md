# 📋 Guia de Migração - Hube CRM

## 🎯 Objetivo

Migrar o Hube CRM de Vanilla JavaScript para React + Vite, seguindo o **Protocolo Mestre** com foco em performance, funcionalidade e "Vibe Coding".

## 📊 Status Atual

### ✅ Concluído (Fases 1-3)

1. **Fundação e Configuração**
   - Projeto React + Vite + SWC criado
   - Todas as dependências instaladas
   - Tailwind CSS configurado com paleta teal/emerald
   - Sistema de build otimizado com code splitting

2. **Núcleo Lógico**
   - Firebase configurado com persistência offline
   - Hook de autenticação (useAuth)
   - Store global Zustand com persist
   - Utilitários (cn helper)

3. **Sistema de Design**
   - Componentes base (Button, Modal, Badge, Input, Spinner)
   - Layout principal com sidebar responsiva
   - Dark mode funcional
   - Error Boundary

4. **Estrutura de Rotas**
   - React Router configurado
   - Lazy loading de páginas
   - Rotas protegidas e públicas
   - Páginas: Login, Dashboard

### ⏳ Pendente (Fases 4-5)

1. **Módulos de Negócio**
   - Tickets (lista, formulário, detalhes)
   - Clientes (lista, formulário, detalhes)
   - Hooks de dados (useTickets, useClients)

2. **Performance**
   - Virtualização de listas (@tanstack/react-virtual)
   - React.memo em componentes pesados
   - Paginação infinita

## 🔄 Processo de Migração

### Etapa 1: Análise do Código Existente

Antes de migrar cada módulo, analise:

1. **Estrutura de Dados**: Como os dados são armazenados no Firestore?
2. **Lógica de Negócio**: Quais são as regras de validação?
3. **UI/UX**: Como a interface funciona atualmente?

### Etapa 2: Migração de Serviços

Para cada serviço (ex: `ticketService.js`):

1. Copiar para `src/services/`
2. Adaptar imports do Firebase
3. Remover dependências do DOM
4. Exportar funções puras

**Exemplo:**

```javascript
// Antes (Vanilla JS)
import { db } from './firebaseConfig.js';
import { collection, getDocs } from 'firebase/firestore';

export async function getTickets() {
  const snapshot = await getDocs(collection(db, 'tickets'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Depois (React)
import { db } from './firebase';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';

export const ticketService = {
  async getAll(baseId, options = {}) {
    const { page = 1, pageSize = 50, status } = options;
    
    let q = query(
      collection(db, 'tickets'),
      where('baseId', '==', baseId),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    );
    
    if (status) {
      q = query(q, where('status', '==', status));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  
  // ... outros métodos
};
```

### Etapa 3: Criar Hooks Customizados

Para cada módulo, criar um hook que:

1. Gerencia estado local (loading, error)
2. Integra com Zustand store
3. Fornece funções de CRUD
4. Lida com otimistic updates

**Exemplo:**

```javascript
// src/hooks/useTickets.js
import { useState, useEffect } from 'react';
import { ticketService } from '../services/ticketService';
import useStore, { useCurrentBase, useTickets as useTicketsStore } from '../stores/useStore';
import toast from 'react-hot-toast';

export const useTickets = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const currentBase = useCurrentBase();
  const tickets = useTicketsStore();
  const { setTickets, addTicket, updateTicket, removeTicket } = useStore();

  // Buscar tickets
  const fetchTickets = async (options) => {
    if (!currentBase) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await ticketService.getAll(currentBase.id, options);
      setTickets(data);
    } catch (err) {
      setError(err.message);
      toast.error('Erro ao carregar tickets');
    } finally {
      setLoading(false);
    }
  };

  // Criar ticket
  const createTicket = async (ticketData) => {
    try {
      const newTicket = await ticketService.create({
        ...ticketData,
        baseId: currentBase.id,
      });
      
      addTicket(newTicket);
      toast.success('Ticket criado com sucesso!');
      return { success: true, data: newTicket };
    } catch (err) {
      toast.error('Erro ao criar ticket');
      return { success: false, error: err.message };
    }
  };

  // ... outros métodos

  useEffect(() => {
    if (currentBase) {
      fetchTickets();
    }
  }, [currentBase]);

  return {
    tickets,
    loading,
    error,
    fetchTickets,
    createTicket,
    // ... outros métodos
  };
};
```

### Etapa 4: Criar Componentes de UI

Para cada módulo:

1. **Lista**: Componente com virtualização
2. **Formulário**: Modal com react-hook-form
3. **Detalhes**: Panel ou página separada

**Exemplo de Lista Virtualizada:**

```javascript
// src/components/tickets/TicketsList.jsx
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';
import { Badge } from '../Badge';

export const TicketsList = ({ tickets, onSelectTicket }) => {
  const parentRef = useRef();

  const virtualizer = useVirtualizer({
    count: tickets.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 5,
  });

  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const ticket = tickets[virtualItem.index];
          
          return (
            <div
              key={ticket.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <div
                onClick={() => onSelectTicket(ticket)}
                className="card cursor-pointer hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{ticket.title}</h3>
                    <p className="text-sm text-gray-600">{ticket.description}</p>
                  </div>
                  <Badge variant={ticket.status === 'open' ? 'warning' : 'success'}>
                    {ticket.status}
                  </Badge>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

### Etapa 5: Integrar com Páginas

Criar páginas que combinam os componentes:

```javascript
// src/pages/TicketsPage.jsx
import { useState } from 'react';
import { useTickets } from '../hooks/useTickets';
import { TicketsList } from '../components/tickets/TicketsList';
import { TicketModal } from '../components/tickets/TicketModal';
import { TicketDetailsPanel } from '../components/tickets/TicketDetailsPanel';
import { Button, Spinner } from '../components';
import { Plus } from 'lucide-react';

export const TicketsPage = () => {
  const { tickets, loading, createTicket, updateTicket } = useTickets();
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  if (loading) {
    return <Spinner size="lg" />;
  }

  return (
    <div className="h-full flex gap-6">
      {/* Lista */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Tickets</h1>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Novo Ticket
          </Button>
        </div>
        
        <TicketsList
          tickets={tickets}
          onSelectTicket={setSelectedTicket}
        />
      </div>

      {/* Detalhes (Desktop) */}
      {selectedTicket && (
        <div className="hidden lg:block w-96">
          <TicketDetailsPanel
            ticket={selectedTicket}
            onUpdate={updateTicket}
            onClose={() => setSelectedTicket(null)}
          />
        </div>
      )}

      {/* Modal de Criação */}
      <TicketModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={createTicket}
      />
    </div>
  );
};
```

## 🎨 Padrões de Design

### 1. Otimistic Updates

```javascript
const deleteTicket = async (id) => {
  // 1. Atualizar UI imediatamente
  removeTicket(id);
  
  try {
    // 2. Fazer requisição
    await ticketService.delete(id);
    toast.success('Ticket removido');
  } catch (err) {
    // 3. Reverter em caso de erro
    addTicket(originalTicket);
    toast.error('Erro ao remover ticket');
  }
};
```

### 2. Loading States

```javascript
// Skeleton loading
{loading ? (
  <div className="animate-pulse space-y-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="h-20 bg-gray-200 rounded" />
    ))}
  </div>
) : (
  <TicketsList tickets={tickets} />
)}
```

### 3. Error Handling

```javascript
{error && (
  <div className="card bg-red-50 border-red-200">
    <p className="text-red-600">{error}</p>
    <Button onClick={retry} variant="danger" size="sm">
      Tentar Novamente
    </Button>
  </div>
)}
```

## 📝 Checklist por Módulo

Para cada módulo a migrar:

- [ ] Analisar código existente
- [ ] Criar/adaptar service
- [ ] Criar hook customizado
- [ ] Criar componentes de UI (Lista, Form, Details)
- [ ] Criar página
- [ ] Adicionar rota no App.jsx
- [ ] Testar funcionalidades
- [ ] Verificar responsividade
- [ ] Otimizar performance (virtualização, memo)
- [ ] Adicionar loading/error states

## 🚀 Próximos Passos Imediatos

1. **Migrar Módulo de Tickets**
   - Criar `src/services/ticketService.js`
   - Criar `src/hooks/useTickets.js`
   - Criar componentes em `src/components/tickets/`
   - Criar `src/pages/TicketsPage.jsx`

2. **Migrar Módulo de Clientes**
   - Seguir mesmo padrão dos Tickets

3. **Otimizações**
   - Implementar virtualização
   - Adicionar paginação infinita
   - Implementar busca/filtros

## 📚 Recursos

- [React Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)
- [Zustand Docs](https://zustand-demo.pmnd.rs)
- [TanStack Virtual](https://tanstack.com/virtual)
- [React Hook Form](https://react-hook-form.com)
- [Tailwind CSS](https://tailwindcss.com)
