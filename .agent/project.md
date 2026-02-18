# Projeto: Hube CRM

## Objetivo
Sistema de CRM para atendimento CS (Customer Success) focado em gestão de energia. O objetivo é gerenciar o relacionamento com clientes e tickets de atendimento de forma eficiente.

## Tipo
Web App

## Stack Técnica
- **Linguagem**: JavaScript (ESNext)
- **Framework**: React 19 (Vite)
- **Estilo**: Tailwind CSS
- **Estado**: Zustand
- **Backend**: Firebase (Authentication + Firestore)
- **Outras dependências**: React Hook Form, TanStack Virtual, Lucide React

## Integrações Externas
- [x] Firebase (Auth & Firestore)
- [ ] Sugestão: Firebase Hosting para deploy

## Requisitos Críticos
- **Performance**: Virtualização de listas para grandes volumes de dados.
- **Segurança**: Autenticação robusta via Firebase.
- **LGPD**: Dados de consumo de energia e dados cadastrais de clientes.
- **UI/UX**: Foco em Desktop (mobile-first removido conforme solicitação).

## LGPD & Dados Pessoais
### Dados Coletados
- Nome/Email: [sim] - Finalidade: Identificação e Login.
- Dados de Consumo: [sim] - Finalidade: Gestão de energia.
- Unidade Consumidora (UC): [sim] - Finalidade: Vinculação técnica.

### Base Legal
- [X] Consentimento (usuário aceitou explicitamente)
- [X] Execução de Contrato (gestão de energia contratada)

### Compliance
- [ ] Função de exclusão de dados
- [x] HTTPS obrigatório (via Hosting)
- [x] Criptografia em repouso (Firestore padrão)

## Contexto do Time
- **Tamanho**: Solo Developer
- **Nível**: Sênior (foco em "Vibe Coding" e entregas completas)

## Ambiente
- **Desenvolvimento**: VS Code / Windows
- **Produção**: Firebase Hosting (Proposta)
