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
npm test        # testes (Vitest)
npm run test:ci # testes com cobertura e relatorios (o mesmo do CI)
```

## CI/CD

Cada PR para a `main` roda `.github/workflows/ci.yml`. O merge só é liberado com:

- o check **CI ok** verde (ele agrega os jobs abaixo);
- o check **Titulo do PR** verde: título em Conventional Commits, porque com squash merge o título vira o commit na main;
- nenhum alerta alto do CodeQL;
- **1 aprovação** de outra pessoa, dada depois do último push.

| Job | Barra o merge quando |
|---|---|
| Lint | ESLint aponta erro |
| Typecheck | `tsc` falha, inclusive nos testes |
| Testes unitarios | algum teste falha, linhas de `app/lib` abaixo de 60% ou queda de mais de 1 ponto em relação à main |
| Seguranca | vulnerabilidade alta em dependência de produção, ou dependência nova com vulnerabilidade ou licença GPL/AGPL |
| Imagem Docker | o build falha ou o Trivy acha vulnerabilidade crítica com correção |

O job **Relatorio** publica no resumo da execução e num comentário fixo do PR:

- a porcentagem de testes passando;
- a cobertura comparada com a main;
- o resultado de cada etapa.

O push na main publica a imagem no GHCR, faz o deploy no Render e confere a URL pública.

Configuração única, feita por quem é admin do repositório:

```bash
# protecao da main (aprovacao, checks obrigatorios, squash)
gh api -X POST repos/VemVindo/frontend/rulesets --input .github/rulesets/main.json
```

Em Settings > Secrets and variables > Actions:

- secret `RENDER_DEPLOY_HOOK`;
- variáveis `API_URL` (URL da API embutida na imagem) e `WEB_PUBLIC_URL` (smoke test do deploy).

Para rodar o mesmo que o CI, localmente: `npm run lint && npm run typecheck && npm run test:ci`.

## Nota sobre a versão do Next

Este projeto usa Next.js 16, que traz mudanças de API e convenções em relação a
versões anteriores. Ao escrever código, consulte os guias em
`node_modules/next/dist/docs/` antes de assumir comportamentos de versões antigas.
