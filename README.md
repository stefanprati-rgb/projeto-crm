# 🚀 Hube CRM - React + Vite

Sistema de CRM moderno construído com React, Vite, Firebase e Tailwind CSS.

## 📋 Stack Tecnológica

- **Build**: Vite + SWC (performance máxima)
- **Framework**: React 19
- **Linguagem**: JavaScript (ESNext)
- **Estilo**: Tailwind CSS (Mobile-first)
- **State**: Zustand (com persist e devtools)
- **Backend**: Firebase (Auth + Firestore com persistência offline)
- **Forms**: React Hook Form
- **Listas**: TanStack Virtual
- **Ícones**: Lucide React
- **Feedback**: React Hot Toast
- **Roteamento**: React Router DOM

## 🔧 Configuração Inicial

### 1. Instalar Dependências

```bash
cd hube-crm-react
npm install
```

### 2. Configurar Firebase

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite o arquivo `.env` e adicione suas credenciais do Firebase:

```env
VITE_FIREBASE_API_KEY=sua_api_key
VITE_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu_project_id
VITE_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
VITE_FIREBASE_APP_ID=seu_app_id
```

### 3. Executar em Desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`

## 📦 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm run preview` - Preview do build de produção
- `npm run lint` - Executa o linter

## 🏗️ Estrutura do Projeto

```
src/
├── components/       # Componentes reutilizáveis (Button, Modal, Badge, etc)
├── layouts/          # Layouts da aplicação (MainLayout)
├── pages/            # Páginas da aplicação
├── hooks/            # Custom hooks (useAuth, etc)
├── stores/           # Zustand stores (useStore)
├── services/         # Serviços (Firebase, API)
├── utils/            # Utilitários (cn, formatters, etc)
└── App.jsx           # Componente principal com rotas
```

## 🎨 Sistema de Design

### Cores Primárias (Teal)

- `primary-50` até `primary-950`
- Cor base: `primary-600` (#14b8a6)

### Componentes Base

- **Button**: Variantes (primary, secondary, danger, ghost, link)
- **Modal**: Genérico com backdrop e portal
- **Badge**: Para status (success, warning, danger, info)
- **Input**: Com validação e mensagens de erro
- **Spinner**: Loading states

### Classes Utilitárias

- `.btn-primary`, `.btn-secondary`, `.btn-danger`
- `.card` - Card com sombra e bordas arredondadas
- `.input` - Input estilizado
- `.badge-*` - Badges de status

## 🔐 Autenticação

O sistema usa Firebase Authentication com dados estendidos no Firestore:

```javascript
// Estrutura do documento do usuário no Firestore
{
  uid: string,
  email: string,
  displayName: string,
  role: 'admin' | 'user',
  allowedBases: string[],
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## 💾 Persistência Offline

O Firestore está configurado com `enableIndexedDbPersistence` para funcionamento offline completo.

## 🌙 Dark Mode

O dark mode é gerenciado pelo Zustand e persiste no LocalStorage. Toggle disponível na sidebar.

## 📱 Responsividade

- **Mobile First**: Design otimizado para mobile
- **Breakpoints**: sm, md, lg, xl (Tailwind padrão)
- **Sidebar**: Drawer em mobile, fixa em desktop

## ⚡ Performance

- **Code Splitting**: Lazy loading de páginas
- **Manual Chunks**: Vendor chunks otimizados
- **SWC**: Compilação ultra-rápida
- **Tree Shaking**: Remoção de código não utilizado

## 🛡️ Segurança

- **Error Boundary**: Captura erros de renderização
- **Protected Routes**: Rotas protegidas por autenticação
- **Firebase Rules**: Regras de segurança no Firestore
- **Env Variables**: Credenciais em variáveis de ambiente

## 📝 Próximos Passos

1. ✅ Fundação e Configuração
2. ✅ Núcleo Lógico (Firebase, Auth, Store)
3. ✅ Sistema de Design (Componentes Base)
4. ✅ Layout Principal
5. ⏳ Módulos de Negócio (Tickets, Clientes)
6. ⏳ Hooks de Dados (useTickets, useClients)
7. ⏳ Virtualização de Listas
8. ⏳ Formulários com React Hook Form

## 🤝 Contribuindo

Este projeto segue o **Protocolo Mestre** de migração com foco em:

- ✅ Código completo e funcional (sem trechos)
- ✅ Performance desde o início
- ✅ Vibe Coding (entrega rápida e visualmente agradável)

## 📄 Licença

Projeto privado - Uso interno
