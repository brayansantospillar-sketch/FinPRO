# FinPro — Controle Financeiro

Aplicação web de controle financeiro pessoal com dashboard, transações, filtros, gráficos e persistência local.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/finpro/src/pages/dashboard.tsx` — visão geral com filtros, indicadores e gráficos.
- `artifacts/finpro/src/pages/transactions.tsx` — pesquisa, filtros, tabela, edição e exclusão.
- `artifacts/finpro/src/components/transaction-dialog.tsx` — formulário compartilhado de lançamentos.
- `artifacts/finpro/src/lib/finance.ts` — serviço de persistência local e dados iniciais.
- `artifacts/finpro/src/lib/finance-utils.ts` — formatação e cálculos financeiros centralizados.
- `artifacts/finpro/src/hooks/use-finance.tsx` — estado compartilhado e atualização das telas.
- `artifacts/finpro/src/index.css` — tokens e tema visual dark do FinPro.

## Architecture decisions

- O MVP usa `localStorage` atrás de `financeService`, mantendo os componentes desacoplados do mecanismo de persistência.
- Valores monetários são armazenados em centavos inteiros e convertidos para BRL apenas na apresentação.
- Dashboard e transações compartilham o mesmo `FinanceProvider`, garantindo atualização imediata após criar, editar ou excluir.
- O escopo inicial não inclui cartões, contas bancárias, parcelamentos, recorrências, relatórios avançados, importação ou IA.

## Product

- Dashboard em português do Brasil com saldo acumulado, entradas, saídas, resultado do período e filtros de mês, ano e categoria.
- Gráficos de fluxo de caixa e distribuição de despesas baseados nos lançamentos cadastrados.
- Tela de transações com busca, filtros, cadastro, edição, exclusão com confirmação e feedback por toast.
- Layout responsivo com navegação desktop e mobile, mantendo `+ Lançar` acessível.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
