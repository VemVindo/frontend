# VemVindo Frontend

Interfaces web do VemVindo, plataforma multitenant de rastreamento de entregas.
Construído com Next.js 16 (App Router).

## Stack

- Next.js 16 (App Router)
- React com Tailwind CSS
- Consumo da API do backend via `fetch`

## Pré-requisitos

- Docker e Docker Compose
- Node 24 (apenas se for rodar fora de container)

## Ambiente de desenvolvimento

```bash
docker compose up
```

O frontend fica em `http://localhost:3000`. Ele espera o backend em
`http://localhost:8000`.

Para hot reload refletindo no container em execução, use o Compose Watch:

```bash
docker compose watch
```

### Serviços do Compose

- `nextjs-dev`: frontend em modo dev. Sobe no `up` padrão.
- `nextjs-prod`: imagem de produção, sob o profile `prod`
  (`docker compose --profile prod up`).

## Conexão com o backend

A URL do backend é injetada em build time pela variável `NEXT_PUBLIC_API_URL`
(default `http://localhost:8000`). Variáveis com o prefixo `NEXT_PUBLIC_` são
expostas ao navegador pelo Next.

As chamadas à API ficam concentradas em `app/lib/api.ts` (`checkHealth`,
`loginEmpresa`). A página inicial (`app/page.tsx`) mostra o status da conexão com
o backend e um formulário de login de empresa para teste da integração.

## Variáveis de ambiente

- `NEXT_PUBLIC_API_URL`: URL pública do backend usada pelo navegador.

## Scripts úteis

```bash
npm run dev     # dev com hot reload (fora de container)
npm run build   # build de producao
npm run start   # serve o build
npm run lint    # eslint
```

## Nota sobre a versão do Next

Este projeto usa Next.js 16, que traz mudanças de API e convenções em relação a
versões anteriores. Ao escrever código, consulte os guias em
`node_modules/next/dist/docs/` antes de assumir comportamentos de versões antigas.
