# Convenções Específicas do Projeto

## Nomenclatura
- **Componentes**: PascalCase (`TicketCard.jsx`).
- **Hooks**: camelCase com prefixo "use" (`useTickets.js`).
- **Arquivos CSS/Styles**: Tailwind classes inline preferencialmente.
- **Variáveis/Funções**: camelCase em Inglês.
- **Comments/Logs**: Português (PT-BR) conforme diretrizes globais.

## Padrões de Código
- Preferir Functional Components e Hooks.
- Evitar prop drilling usando Zustand ou Context onde apropriado.
- Centralizar strings de status/tipos em constantes.

## Git & Commits
Usar Conventional Commits: `feat:`, `fix:`, `refactor:`, `docs:`.

## Testes
Localizados em `src/__tests__` ou junto aos componentes com extensão `.test.js`.
