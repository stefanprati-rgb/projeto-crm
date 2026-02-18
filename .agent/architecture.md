# Decisões de Arquitetura

## Padrão Arquitetural
Arquitetura Modular baseada em responsabilidades claras para React.

## Estrutura de Pastas
- `src/components/`: Componentes UI atômicos e reutilizáveis.
- `src/layouts/`: Estruturas de página (Siderbar, Header, etc).
- `src/pages/`: Páginas completas da aplicação.
- `src/hooks/`: Lógica de React compartilhada e hooks de dados.
- `src/stores/`: Gerenciamento de estado global com Zustand.
- `src/services/`: Camada de abstração para Firebase e APIs externas.
- `src/utils/`: Funções puras e formatadores.

## Separação de Responsabilidades
- **UI**: Tailwind + React components puros.
- **Business Logic**: Hooks e Stores (Zustand).
- **Data Access**: Services (Firebase).

## Decisões Importantes
1. **Zustand para Estado**: Escolhido pela simplicidade e performance em relação ao Redux.
2. **Firebase Offline**: Firestore configurado com persistência em cache para resiliência.
3. **Desktop Focused**: Removidas diretrizes mobile-first para otimizar a experiência de gestão em telas grandes.
