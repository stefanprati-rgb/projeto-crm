# 🚀 PLANO DE REFATORAÇÃO: MÓDULO DE CLIENTES PARA GD

**Data de Criação:** 09/12/2024  
**Versão:** 1.0.0  
**Objetivo:** Transformar módulo de clientes genérico em sistema completo para Geração Distribuída

---

## 📊 VISÃO GERAL

### Problemas Identificados
1. ❌ Schema de dados inadequado para GD (falta projetos, equipamentos, múltiplas instalações)
2. ❌ Layout comprimido (painel lateral ~400px)
3. ❌ Falta de filtros avançados (por projeto, usina, inadimplência)
4. ❌ Busca limitada (só dados do cliente, não projetos/usinas)
5. ❌ Painel deveria ser modal full-width

### Solução Proposta
- ✅ Expandir schema com relacionamentos complexos
- ✅ Implementar filtros contextuais
- ✅ Transformar painel em modal full-width
- ✅ Adicionar busca avançada
- ✅ Criar visualizações hierárquicas

---

## 🎯 FASE 1: EXPANDIR SCHEMA DE DADOS (FUNDAÇÃO)

### 1.1 Criar Novos Tipos TypeScript

**Arquivo:** `src/types/client.types.js`

```javascript
/**
 * Tipos de Cliente
 */
export const ClientType = {
  PESSOA_FISICA: 'PESSOA_FISICA',
  PESSOA_JURIDICA: 'PESSOA_JURIDICA'
};

export const ClientSegment = {
  RESIDENCIAL: 'RESIDENCIAL',
  COMERCIAL: 'COMERCIAL',
  INDUSTRIAL: 'INDUSTRIAL',
  RURAL: 'RURAL'
};

export const ClientStatus = {
  ATIVO: 'ATIVO',
  INATIVO: 'INATIVO',
  SUSPENSO: 'SUSPENSO',
  EM_ANALISE: 'EM_ANALISE'
};

/**
 * Tipos de Projeto GD
 */
export const ProjectType = {
  MINI_GERACAO: 'MINI_GERACAO',        // < 75 kW
  MICRO_GERACAO: 'MICRO_GERACAO',      // 75-300 kW
  PEQUENA_GERACAO: 'PEQUENA_GERACAO',  // 300-5000 kW
  MEDIA_GERACAO: 'MEDIA_GERACAO'       // > 5000 kW
};

export const ProjectStatus = {
  EM_ANALISE: 'EM_ANALISE',
  EM_CONSTRUCAO: 'EM_CONSTRUCAO',
  ATIVO: 'ATIVO',
  SUSPENSO: 'SUSPENSO',
  CANCELADO: 'CANCELADO'
};

/**
 * Tipos de Instalação
 */
export const InstallationType = {
  GERACAO: 'GERACAO',
  CONSUMO: 'CONSUMO',
  HIBRIDO: 'HIBRIDO'
};

export const InstallationStatus = {
  EM_INSTALACAO: 'EM_INSTALACAO',
  ATIVO: 'ATIVO',
  MANUTENCAO: 'MANUTENCAO',
  DESATIVADO: 'DESATIVADO'
};

/**
 * Tipos de Contrato
 */
export const ContractType = {
  COMPRA: 'COMPRA',
  LEASING: 'LEASING',
  ASSINATURA: 'ASSINATURA',
  PPA: 'PPA' // Power Purchase Agreement
};

/**
 * Tipos de Equipamento
 */
export const EquipmentType = {
  INVERSOR: 'INVERSOR',
  PAINEL_SOLAR: 'PAINEL_SOLAR',
  ESTRUTURA: 'ESTRUTURA',
  MEDIDOR: 'MEDIDOR',
  STRING_BOX: 'STRING_BOX',
  TRANSFORMADOR: 'TRANSFORMADOR'
};

/**
 * Tipos de Interação (Timeline)
 */
export const InteractionType = {
  WHATSAPP: 'WHATSAPP',
  EMAIL: 'EMAIL',
  LIGACAO: 'LIGACAO',
  VISITA_TECNICA: 'VISITA_TECNICA',
  REUNIAO: 'REUNIAO',
  NOTA: 'NOTA'
};

/**
 * Status de Fatura
 */
export const InvoiceStatus = {
  EM_ABERTO: 'EM_ABERTO',
  VENCIDO: 'VENCIDO',
  PAGO: 'PAGO',
  CANCELADO: 'CANCELADO'
};
```

### 1.2 Atualizar Schema do Cliente

**Arquivo:** `src/schemas/clientSchema.js`

```javascript
import {
  ClientType,
  ClientSegment,
  ClientStatus,
  ProjectType,
  ProjectStatus,
  InstallationType,
  InstallationStatus,
  ContractType,
  EquipmentType,
  InteractionType,
  InvoiceStatus
} from '../types/client.types';

/**
 * Schema completo de Cliente para GD
 */
export const clientSchema = {
  // ─ Identidade ─
  id: '',
  tipo: ClientType.PESSOA_JURIDICA,
  nome: '',
  nomeFantasia: '',
  segmento: ClientSegment.COMERCIAL,
  status: ClientStatus.ATIVO,
  
  // ─ Documentação ─
  cnpj: '', // ou cpf
  inscricaoEstadual: '',
  dataConstituicao: null,
  
  // ─ Localização ─
  endereco: {
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    cep: '',
    coordenadas: { lat: null, lng: null }
  },
  
  // ─ Contatos (Array) ─
  contatos: [
    {
      id: '',
      tipo: 'COMERCIAL', // COMERCIAL, FINANCEIRO, TECNICO, JURIDICO
      nome: '',
      cargo: '',
      email: '',
      telefone: '',
      whatsapp: '',
      principal: true
    }
  ],
  
  // ─ Projetos GD (Array) ─
  projetos: [
    {
      id: '',
      codigo: '', // GD-SP-001
      nome: '',
      tipo: ProjectType.MICRO_GERACAO,
      potencia: 0, // kW
      status: ProjectStatus.ATIVO,
      dataInicio: null,
      dataAtivacao: null,
      valorMensalEstimado: 0,
      usinas: [], // Array de IDs
      responsavelTecnico: '',
      observacoes: ''
    }
  ],
  
  // ─ Instalações (Array) ─
  instalacoes: [
    {
      id: '',
      uc: '', // Unidade Consumidora
      tipo: InstallationType.GERACAO,
      usinaId: '',
      usinaName: '',
      endereco: '',
      tensao: '',
      medidor: '',
      dataInstalacao: null,
      status: InstallationStatus.ATIVO
    }
  ],
  
  // ─ Contratos (Array) ─
  contratos: [
    {
      id: '',
      numero: '',
      tipo: ContractType.LEASING,
      dataInicio: null,
      dataFim: null,
      valorTotal: 0,
      valorMensal: 0,
      descontoContratado: 0, // %
      status: 'ATIVO',
      documentoUrl: ''
    }
  ],
  
  // ─ Faturamento ─
  faturamento: {
    diaVencimento: 15,
    formaPagamento: 'BOLETO',
    saldoEmAberto: 0,
    totalFaturado: 0,
    totalPago: 0,
    inadimplente: false,
    ultimoPagamento: null
  },
  
  // ─ Faturas (Array ou Subcoleção) ─
  faturas: [
    {
      id: '',
      competencia: '',
      valor: 0,
      dataVencimento: null,
      dataPagamento: null,
      status: InvoiceStatus.EM_ABERTO,
      instalacaoId: '',
      boletoUrl: ''
    }
  ],
  
  // ─ Equipamentos (Array) ─
  equipamentos: [
    {
      id: '',
      tipo: EquipmentType.INVERSOR,
      marca: '',
      modelo: '',
      numeroSerie: '',
      potencia: 0,
      quantidade: 1,
      dataInstalacao: null,
      garantiaAte: null,
      instalacaoId: '',
      status: 'OPERACIONAL'
    }
  ],
  
  // ─ Timeline (Array ou Subcoleção) ─
  timeline: [
    {
      id: '',
      tipo: InteractionType.WHATSAPP,
      data: null,
      usuario: '',
      resumo: '',
      detalhes: ''
    }
  ],
  
  // ─ Metadata ─
  createdAt: null,
  updatedAt: null,
  createdBy: '',
  createdByEmail: '',
  database: 'EGS'
};
```

### 1.3 Criar Serviços Auxiliares

#### Serviço de Projetos
**Arquivo:** `src/services/projectService.js`

```javascript
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  getDocs
} from 'firebase/firestore';
import { db, auth } from './firebase';

export const projectService = {
  /**
   * Criar novo projeto
   */
  async create(clientId, projectData) {
    const user = auth.currentUser;
    const projectRef = await addDoc(collection(db, `clients/${clientId}/projects`), {
      ...projectData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: user?.uid,
      createdByEmail: user?.email
    });
    return projectRef.id;
  },

  /**
   * Atualizar projeto
   */
  async update(clientId, projectId, updates) {
    const user = auth.currentUser;
    const projectRef = doc(db, `clients/${clientId}/projects`, projectId);
    await updateDoc(projectRef, {
      ...updates,
      updatedAt: serverTimestamp(),
      updatedBy: user?.uid,
      updatedByEmail: user?.email
    });
  },

  /**
   * Deletar projeto
   */
  async delete(clientId, projectId) {
    const projectRef = doc(db, `clients/${clientId}/projects`, projectId);
    await deleteDoc(projectRef);
  },

  /**
   * Listar projetos de um cliente
   */
  listen(clientId, onData, onError) {
    const q = query(
      collection(db, `clients/${clientId}/projects`),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const projects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      onData(projects);
    }, onError);
  },

  /**
   * Buscar projetos por status
   */
  async getByStatus(status) {
    // Usar collectionGroup para buscar em todos os clientes
    const q = query(
      collectionGroup(db, 'projects'),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      clientId: doc.ref.parent.parent.id,
      ...doc.data()
    }));
  }
};
```

#### Serviço de Equipamentos
**Arquivo:** `src/services/equipmentService.js`

```javascript
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from './firebase';

export const equipmentService = {
  /**
   * Criar novo equipamento
   */
  async create(clientId, equipmentData) {
    const user = auth.currentUser;
    const equipRef = await addDoc(collection(db, `clients/${clientId}/equipments`), {
      ...equipmentData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: user?.uid,
      createdByEmail: user?.email
    });
    return equipRef.id;
  },

  /**
   * Atualizar equipamento
   */
  async update(clientId, equipmentId, updates) {
    const user = auth.currentUser;
    const equipRef = doc(db, `clients/${clientId}/equipments`, equipmentId);
    await updateDoc(equipRef, {
      ...updates,
      updatedAt: serverTimestamp(),
      updatedBy: user?.uid,
      updatedByEmail: user?.email
    });
  },

  /**
   * Deletar equipamento
   */
  async delete(clientId, equipmentId) {
    const equipRef = doc(db, `clients/${clientId}/equipments`, equipmentId);
    await deleteDoc(equipRef);
  },

  /**
   * Listar equipamentos de um cliente
   */
  listen(clientId, onData, onError) {
    const q = query(
      collection(db, `clients/${clientId}/equipments`),
      orderBy('dataInstalacao', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const equipments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      onData(equipments);
    }, onError);
  },

  /**
   * Buscar equipamentos com garantia vencendo
   */
  async getExpiringWarranties(days = 90) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const q = query(
      collectionGroup(db, 'equipments'),
      where('garantiaAte', '<=', futureDate.toISOString()),
      where('garantiaAte', '>=', new Date().toISOString()),
      orderBy('garantiaAte', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      clientId: doc.ref.parent.parent.id,
      ...doc.data()
    }));
  }
};
```

---

## 🎯 FASE 2: IMPLEMENTAR FILTROS AVANÇADOS

### 2.1 Criar Componente de Filtros

**Arquivo:** `src/components/clients/ClientFilters.jsx`

```javascript
import { useState, useEffect } from 'react';
import { Filter, X, Save, Trash2 } from 'lucide-react';
import { Button } from '../';
import { cn } from '../../utils/cn';
import { ClientStatus, ProjectStatus } from '../../types/client.types';

export const ClientFilters = ({ onFilterChange, plants, projects }) => {
  const [filters, setFilters] = useState({
    status: 'TODOS',
    projectId: 'TODOS',
    plantId: 'TODOS',
    state: 'TODOS',
    overdue: false,
    minRevenue: '',
    maxRevenue: '',
    dateFrom: '',
    dateTo: ''
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    onFilterChange(filters);
  }, [filters]);

  const handleReset = () => {
    setFilters({
      status: 'TODOS',
      projectId: 'TODOS',
      plantId: 'TODOS',
      state: 'TODOS',
      overdue: false,
      minRevenue: '',
      maxRevenue: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  const activeFiltersCount = Object.values(filters).filter(v => 
    v !== 'TODOS' && v !== '' && v !== false
  ).length;

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            Filtros
          </h3>
          {activeFiltersCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? 'Ocultar' : 'Avançado'}
          </Button>
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
            >
              <Trash2 className="h-4 w-4" />
              Limpar
            </Button>
          )}
        </div>
      </div>

      {/* Filtros Básicos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Status */}
        <div>
          <label className="label">Status</label>
          <select
            className="input"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="TODOS">Todos</option>
            <option value={ClientStatus.ATIVO}>Ativo</option>
            <option value={ClientStatus.INATIVO}>Inativo</option>
            <option value={ClientStatus.SUSPENSO}>Suspenso</option>
            <option value={ClientStatus.EM_ANALISE}>Em Análise</option>
          </select>
        </div>

        {/* Projeto */}
        <div>
          <label className="label">Projeto</label>
          <select
            className="input"
            value={filters.projectId}
            onChange={(e) => setFilters({ ...filters, projectId: e.target.value })}
          >
            <option value="TODOS">Todos os Projetos</option>
            {projects?.map(project => (
              <option key={project.id} value={project.id}>
                {project.codigo} - {project.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Usina */}
        <div>
          <label className="label">Usina</label>
          <select
            className="input"
            value={filters.plantId}
            onChange={(e) => setFilters({ ...filters, plantId: e.target.value })}
          >
            <option value="TODOS">Todas as Usinas</option>
            {plants?.map(plant => (
              <option key={plant.id} value={plant.id}>
                {plant.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filtros Avançados */}
      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
          {/* Estado */}
          <div>
            <label className="label">Estado</label>
            <select
              className="input"
              value={filters.state}
              onChange={(e) => setFilters({ ...filters, state: e.target.value })}
            >
              <option value="TODOS">Todos os Estados</option>
              <option value="SP">São Paulo</option>
              <option value="RJ">Rio de Janeiro</option>
              <option value="MG">Minas Gerais</option>
              {/* Adicionar mais estados */}
            </select>
          </div>

          {/* Inadimplência */}
          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="overdue"
              checked={filters.overdue}
              onChange={(e) => setFilters({ ...filters, overdue: e.target.checked })}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="overdue" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Apenas clientes inadimplentes
            </label>
          </div>

          {/* Faturamento Mínimo */}
          <div>
            <label className="label">Faturamento Mínimo (R$)</label>
            <input
              type="number"
              className="input"
              value={filters.minRevenue}
              onChange={(e) => setFilters({ ...filters, minRevenue: e.target.value })}
              placeholder="0"
            />
          </div>

          {/* Faturamento Máximo */}
          <div>
            <label className="label">Faturamento Máximo (R$)</label>
            <input
              type="number"
              className="input"
              value={filters.maxRevenue}
              onChange={(e) => setFilters({ ...filters, maxRevenue: e.target.value })}
              placeholder="∞"
            />
          </div>

          {/* Data Cadastro De */}
          <div>
            <label className="label">Cadastrado De</label>
            <input
              type="date"
              className="input"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            />
          </div>

          {/* Data Cadastro Até */}
          <div>
            <label className="label">Cadastrado Até</label>
            <input
              type="date"
              className="input"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  );
};
```

### 2.2 Integrar Filtros na Página de Clientes

**Modificar:** `src/pages/ClientsPage.jsx`

```javascript
// Adicionar estado de filtros
const [filters, setFilters] = useState({});
const [filteredClients, setFilteredClients] = useState([]);

// Aplicar filtros
useEffect(() => {
  let result = clients;

  // Filtro por status
  if (filters.status && filters.status !== 'TODOS') {
    result = result.filter(c => c.status === filters.status);
  }

  // Filtro por projeto
  if (filters.projectId && filters.projectId !== 'TODOS') {
    result = result.filter(c => 
      c.projetos?.some(p => p.id === filters.projectId)
    );
  }

  // Filtro por usina
  if (filters.plantId && filters.plantId !== 'TODOS') {
    result = result.filter(c => 
      c.instalacoes?.some(i => i.usinaId === filters.plantId)
    );
  }

  // Filtro por inadimplência
  if (filters.overdue) {
    result = result.filter(c => c.faturamento?.inadimplente === true);
  }

  // Filtro por faturamento
  if (filters.minRevenue) {
    result = result.filter(c => 
      c.faturamento?.totalFaturado >= parseFloat(filters.minRevenue)
    );
  }

  if (filters.maxRevenue) {
    result = result.filter(c => 
      c.faturamento?.totalFaturado <= parseFloat(filters.maxRevenue)
    );
  }

  setFilteredClients(result);
}, [clients, filters]);
```

---

## 🎯 FASE 3: TRANSFORMAR PAINEL EM MODAL FULL-WIDTH

### 3.1 Criar Novo Componente de Modal

**Arquivo:** `src/components/clients/ClientDetailsModal.jsx`

```javascript
import { useState, useEffect } from 'react';
import { X, Edit2, Trash2 } from 'lucide-react';
import { Button } from '../';
import { cn } from '../../utils/cn';
import { ClientOverviewTab } from './tabs/ClientOverviewTab';
import { ClientProjectsTab } from './tabs/ClientProjectsTab';
import { ClientFinancialTab } from './tabs/ClientFinancialTab';
import { ClientTechnicalTab } from './tabs/ClientTechnicalTab';
import { ClientEquipmentsTab } from './tabs/ClientEquipmentsTab';

export const ClientDetailsModal = ({
  client,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onEdit
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!isOpen || !client) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="absolute inset-0 flex items-start justify-center p-4 overflow-y-auto">
        <div className="relative w-full max-w-6xl bg-white dark:bg-gray-900 rounded-lg shadow-2xl my-8">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="h-16 w-16 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-2xl">
                  {client.nome?.[0]?.toUpperCase() || 'C'}
                </div>

                {/* Info */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {client.nome}
                  </h2>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={cn(
                      'px-2 py-1 text-xs font-medium rounded-full',
                      client.status === 'ATIVO' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                    )}>
                      {client.status}
                    </span>
                    {client.segmento && (
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {client.segmento}
                      </span>
                    )}
                    {client.cnpj && (
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        CNPJ: {client.cnpj}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={onEdit}>
                  <Edit2 className="h-4 w-4" />
                  Editar
                </Button>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mt-4 border-b border-gray-200 dark:border-gray-800">
              <TabButton
                active={activeTab === 'overview'}
                onClick={() => setActiveTab('overview')}
              >
                Visão Geral
              </TabButton>
              <TabButton
                active={activeTab === 'projects'}
                onClick={() => setActiveTab('projects')}
              >
                Projetos ({client.projetos?.length || 0})
              </TabButton>
              <TabButton
                active={activeTab === 'financial'}
                onClick={() => setActiveTab('financial')}
              >
                Financeiro
              </TabButton>
              <TabButton
                active={activeTab === 'technical'}
                onClick={() => setActiveTab('technical')}
              >
                Técnico
              </TabButton>
              <TabButton
                active={activeTab === 'equipments'}
                onClick={() => setActiveTab('equipments')}
              >
                Equipamentos ({client.equipamentos?.length || 0})
              </TabButton>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            {activeTab === 'overview' && <ClientOverviewTab client={client} />}
            {activeTab === 'projects' && <ClientProjectsTab client={client} />}
            {activeTab === 'financial' && <ClientFinancialTab client={client} />}
            {activeTab === 'technical' && <ClientTechnicalTab client={client} />}
            {activeTab === 'equipments' && <ClientEquipmentsTab client={client} />}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-6 py-4">
            <div className="flex items-center justify-between">
              <Button variant="danger" onClick={() => onDelete(client.id)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Remover Cliente
              </Button>
              <Button variant="ghost" onClick={onClose}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={cn(
      'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
      active
        ? 'border-primary-600 text-primary-600'
        : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
    )}
  >
    {children}
  </button>
);
```

### 3.2 Criar Aba de Projetos

**Arquivo:** `src/components/clients/tabs/ClientProjectsTab.jsx`

```javascript
import { useState } from 'react';
import { Plus, Factory, Zap, Calendar, DollarSign } from 'lucide-react';
import { Button, Badge } from '../../';
import { formatCurrency } from '../../../utils/formatters';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const ClientProjectsTab = ({ client }) => {
  const [showAddProject, setShowAddProject] = useState(false);

  const projetos = client.projetos || [];

  const getStatusColor = (status) => {
    const colors = {
      ATIVO: 'success',
      EM_CONSTRUCAO: 'warning',
      EM_ANALISE: 'default',
      SUSPENSO: 'danger',
      CANCELADO: 'danger'
    };
    return colors[status] || 'default';
  };

  const getStatusLabel = (status) => {
    const labels = {
      ATIVO: 'Ativo',
      EM_CONSTRUCAO: 'Em Construção',
      EM_ANALISE: 'Em Análise',
      SUSPENSO: 'Suspenso',
      CANCELADO: 'Cancelado'
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Projetos de Geração Distribuída
        </h3>
        <Button onClick={() => setShowAddProject(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Projeto
        </Button>
      </div>

      {/* Lista de Projetos */}
      {projetos.length === 0 ? (
        <div className="text-center py-12">
          <Factory className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Nenhum projeto cadastrado
          </p>
          <Button 
            variant="ghost" 
            className="mt-4"
            onClick={() => setShowAddProject(true)}
          >
            Adicionar Primeiro Projeto
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projetos.map((projeto) => (
            <div
              key={projeto.id}
              className="card hover:shadow-lg transition-shadow cursor-pointer"
            >
              {/* Header do Card */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-medium text-primary-600">
                      {projeto.codigo}
                    </span>
                    <Badge variant={getStatusColor(projeto.status)}>
                      {getStatusLabel(projeto.status)}
                    </Badge>
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                    {projeto.nome}
                  </h4>
                </div>
              </div>

              {/* Informações */}
              <div className="space-y-3">
                {/* Potência */}
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Potência:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {projeto.potencia} kW
                  </span>
                </div>

                {/* Tipo */}
                <div className="flex items-center gap-2 text-sm">
                  <Factory className="h-4 w-4 text-blue-500" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Tipo:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {projeto.tipo.replace('_', ' ')}
                  </span>
                </div>

                {/* Valor Mensal */}
                {projeto.valorMensalEstimado > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <span className="text-gray-600 dark:text-gray-400">
                      Valor Mensal:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {formatCurrency(projeto.valorMensalEstimado)}
                    </span>
                  </div>
                )}

                {/* Data de Ativação */}
                {projeto.dataAtivacao && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-purple-500" />
                    <span className="text-gray-600 dark:text-gray-400">
                      Ativado em:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {format(new Date(projeto.dataAtivacao), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                  </div>
                )}

                {/* Usinas */}
                {projeto.usinas && projeto.usinas.length > 0 && (
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Usinas: {projeto.usinas.join(', ')}
                    </span>
                  </div>
                )}

                {/* Observações */}
                {projeto.observacoes && (
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {projeto.observacoes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

---

## 🎯 FASE 4: IMPLEMENTAR BUSCA AVANÇADA

### 4.1 Criar Hook de Busca Avançada

**Arquivo:** `src/hooks/useAdvancedSearch.js`

```javascript
import { useState, useEffect } from 'react';

export const useAdvancedSearch = (clients) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    if (!searchTerm || searchTerm.length < 2) {
      setSearchResults(clients);
      return;
    }

    const term = searchTerm.toLowerCase();
    const results = clients.filter(client => {
      // Busca no nome
      if (client.nome?.toLowerCase().includes(term)) return true;
      
      // Busca no email
      if (client.email?.toLowerCase().includes(term)) return true;
      
      // Busca no telefone
      if (client.telefone?.includes(term)) return true;
      
      // Busca no CNPJ/CPF
      if (client.cnpj?.includes(term)) return true;
      if (client.cpf?.includes(term)) return true;
      
      // Busca em projetos
      if (client.projetos?.some(p => 
        p.codigo?.toLowerCase().includes(term) ||
        p.nome?.toLowerCase().includes(term)
      )) return true;
      
      // Busca em instalações (UC)
      if (client.instalacoes?.some(i => 
        i.uc?.includes(term)
      )) return true;
      
      // Busca em usinas
      if (client.instalacoes?.some(i => 
        i.usinaName?.toLowerCase().includes(term)
      )) return true;
      
      // Busca em equipamentos
      if (client.equipamentos?.some(e => 
        e.numeroSerie?.toLowerCase().includes(term) ||
        e.marca?.toLowerCase().includes(term) ||
        e.modelo?.toLowerCase().includes(term)
      )) return true;
      
      return false;
    });

    setSearchResults(results);
  }, [searchTerm, clients]);

  return {
    searchTerm,
    setSearchTerm,
    searchResults
  };
};
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### FASE 1: Schema de Dados
- [ ] Criar `src/types/client.types.js`
- [ ] Criar `src/schemas/clientSchema.js`
- [ ] Criar `src/services/projectService.js`
- [ ] Criar `src/services/equipmentService.js`
- [ ] Atualizar `src/services/clientService.js` para suportar novo schema
- [ ] Criar migração de dados existentes

### FASE 2: Filtros Avançados
- [ ] Criar `src/components/clients/ClientFilters.jsx`
- [ ] Integrar filtros em `ClientsPage.jsx`
- [ ] Adicionar lógica de filtragem
- [ ] Testar todos os filtros

### FASE 3: Modal Full-Width
- [ ] Criar `src/components/clients/ClientDetailsModal.jsx`
- [ ] Criar `src/components/clients/tabs/ClientOverviewTab.jsx`
- [ ] Criar `src/components/clients/tabs/ClientProjectsTab.jsx`
- [ ] Criar `src/components/clients/tabs/ClientFinancialTab.jsx`
- [ ] Criar `src/components/clients/tabs/ClientTechnicalTab.jsx`
- [ ] Criar `src/components/clients/tabs/ClientEquipmentsTab.jsx`
- [ ] Substituir painel lateral por modal em `ClientsPage.jsx`

### FASE 4: Busca Avançada
- [ ] Criar `src/hooks/useAdvancedSearch.js`
- [ ] Integrar busca avançada em `ClientsPage.jsx`
- [ ] Adicionar destaque de resultados
- [ ] Testar busca por todos os campos

### FASE 5: Testes e Validação
- [ ] Testar criação de cliente com novo schema
- [ ] Testar edição de cliente
- [ ] Testar filtros
- [ ] Testar busca avançada
- [ ] Testar modal em diferentes resoluções
- [ ] Validar performance com muitos dados

---

## 🚀 PRÓXIMOS PASSOS

1. **Começar pela FASE 1** - Expandir schema é a fundação
2. **Criar migração de dados** - Converter clientes existentes
3. **Implementar FASE 2** - Filtros são críticos para usabilidade
4. **Implementar FASE 3** - Modal melhora UX drasticamente
5. **Implementar FASE 4** - Busca avançada completa a experiência

---

**Estimativa de Tempo:**
- FASE 1: 4-6 horas
- FASE 2: 3-4 horas
- FASE 3: 6-8 horas
- FASE 4: 2-3 horas
- **Total: 15-21 horas**

**Prioridade:** 🔴 **CRÍTICA**  
**Impacto:** 🚀 **ALTO**  
**Complexidade:** 🟡 **MÉDIA-ALTA**
