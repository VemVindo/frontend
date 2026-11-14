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

## Testes de tela (Selenium)

Os roteiros de `e2e/` abrem o Chrome e percorrem as telas como a empresa, o
entregador e o recebedor. Precisam do backend em `http://localhost:8000` (com o
seed) e do frontend em `http://localhost:3000`.

```bash
npm run test:e2e
```

- `e2e/autenticacao.e2e.ts`: login das duas personas, menu do painel, rota
  protegida e link de rastreio inexistente. Só lê os dados do seed.
- `e2e/jornada-da-entrega.e2e.ts`: cadastra uma empresa e um entregador novos a
  cada execução e leva um pedido do cadastro até a avaliação do recebedor.
- `e2e/caminhos-alternativos.e2e.ts`: cadastro por CPF, CPF já cadastrado que
  vira convite, recusa de convite, saída da frota, reatribuição com histórico,
  troca do link de rastreio, filtros de data, menu de celular, compartilhamento
  da localização (posição simulada no Chrome) e bloqueio do código do recebedor.

Sem as chaves do Google Maps o mapa não aparece, e o backend só aceita pedido
com o pino da empresa e o da entrega. Por isso os roteiros conferem na tela que
o pedido sem pino é recusado e depois gravam os pinos e criam o pedido pela API,
com a sessão da própria empresa.

Quando um teste falha, a captura da tela e o texto da página ficam em
`reports/e2e/`.

### Rodar contra o ambiente publicado

```bash
E2E_PRODUCAO=1 E2E_URL_FRONT=https://frontend-or4i.onrender.com E2E_URL_API=https://backend-ker5.onrender.com npm run test:e2e
```

Nesse modo a suíte espera o Render acordar (até 3 minutos), usa 30 segundos de
espera por elemento e pula a checagem do pedido sem pino, que só vale sem as
chaves do Google. Os roteiros não usam o seed: criam as próprias contas, com
e-mail `e2e-selenium-...@example.com`.

Cada execução deixa dados no banco, e o app não tem rota para apagar empresa
nem pedido. Depois de rodar, limpe com o endereço do banco (no Render,
External Database URL):

```bash
E2E_DATABASE_URL='postgresql://...' npm run test:e2e:limpar
```

```bash
E2E_DATABASE_URL='postgresql://...' npm run test:e2e:limpar -- --apagar
```

O primeiro só mostra quantas empresas, entregadores e pedidos sairiam. O
segundo apaga. O comando executa `e2e/limpeza.sql`, que só alcança empresas com
o e-mail da suíte, os pedidos delas e entregadores que não trabalham para
nenhuma outra empresa.

| Variável | Para que serve | Padrão |
|---|---|---|
| `E2E_SEM_TELA` | `1` roda sem abrir a janela | janela visível |
| `E2E_PAUSA_MS` | pausa antes de cada clique, para dar tempo de acompanhar | `350` |
| `E2E_NAVEGADOR` | `chrome` ou `firefox` | `chrome` |
| `E2E_URL_FRONT` e `E2E_URL_API` | endereços do frontend e do backend | `localhost:3000` e `localhost:8000` |

O backend aceita 5 tentativas de login por minuto em cada rota. Quando o limite
estoura, os roteiros esperam 20 segundos e tentam de novo, então a execução
pode demorar mais, mas não falha por isso.

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
