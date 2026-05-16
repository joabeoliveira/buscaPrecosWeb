# PLANO DE IMPLEMENTACAO: PORTAL DO CLIENTE B2B
## BuscaPrecosWeb (Algorise/Infore) - Versao 2.0

Este documento orienta a implementacao incremental do Portal do Cliente B2B no projeto BuscaPrecosWeb.

O plano considera o estado atual do repositorio:

- O banco PostgreSQL e o Redis ja estao rodando via Docker Desktop.
- As migrations existentes vao ate `backend/migrations/015_fix_names_encoding.sql`.
- A tabela `clients` ja existe, criada em `backend/migrations/004_pro_flow_expansion.sql`.
- A coluna `shopping_lists.client_id` ja existe.
- A aplicacao principal usa API Routes do Next.js em `/api/*`.
- Existe tambem um backend Express com rotas `/api/v1/*`, mas a implementacao atual do frontend consome majoritariamente as rotas Next em `/api`.

O objetivo principal desta refatoracao e permitir que clientes corporativos acessem apenas suas proprias cotacoes, criem novas solicitacoes, acompanhem status e recebam uma experiencia simplificada em relacao ao painel interno.

---

## Principios de Implementacao

1. Implementar uma fase por vez.
2. Preservar compatibilidade com as rotas e telas internas ja existentes.
3. Fazer alteracoes de banco apenas por migration incremental.
4. Tratar isolamento multitenant como requisito de seguranca, nao apenas filtro visual.
5. Nao recriar estruturas que ja existem no banco.
6. Validar cada fase antes de seguir para a proxima.
7. Fazer commits pequenos por fase, quando solicitado.

---

## FASE 0: PREPARACAO

### 0.1 Branch de trabalho

Criar uma branch dedicada:

```bash
git checkout -b feature/b2b-portal-cliente
```

### 0.2 Validacao inicial

Confirmar que os servicos locais estao disponiveis:

- Docker Desktop rodando.
- PostgreSQL acessivel.
- Redis acessivel.
- Frontend Next.js iniciando sem erro.
- Worker de busca iniciando sem erro, quando aplicavel.

Comandos sugeridos:

```bash
npm run dev:frontend
npm run dev:worker
```

Se necessario, validar tambem a conexao com o banco usando os scripts/migrations ja existentes no projeto.

### 0.3 Conferencia do estado do banco

Antes de criar novas migrations, confirmar quais colunas ja existem nas tabelas:

- `clients`
- `users`
- `shopping_lists`
- `shopping_list_items`
- `search_jobs`

Esta etapa evita duplicar colunas e reduz risco de conflito entre ambientes.

---

## FASE 1: BANCO DE DADOS E MODELOS

### 1.1 Criar migration incremental

Criar a migration:

```text
backend/migrations/016_b2b_client_portal.sql
```

Nao usar o numero `007`, pois ele ja existe no repositorio.

### 1.2 Evoluir a tabela `clients`

A tabela `clients` atual usa os campos:

- `id`
- `name`
- `document`
- `email`
- `phone`
- `created_at`
- `updated_at`

Para evitar quebrar telas e repositorios existentes, manter esses campos como base e adicionar apenas campos complementares:

```sql
ALTER TABLE clients ADD COLUMN IF NOT EXISTS trade_name VARCHAR(150);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_document_unique
ON clients (document)
WHERE document IS NOT NULL AND document <> '';
```

Observacao: `document` continua representando CNPJ/CPF. Se no futuro for necessario renomear para `cnpj`, isso deve ser feito em uma refatoracao separada, com migracao de dados e ajuste de todas as telas.

### 1.3 Vincular usuarios a clientes

Adicionar `client_id` em `users` para usuarios externos:

```sql
ALTER TABLE users
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_client_id ON users(client_id);
```

### 1.4 Atualizar roles

O projeto hoje usa roles como `admin`, `helper`, `auditor` e `user`. O portal B2B precisa incluir:

- `client_admin`: usuario externo que administra usuarios e dados do proprio cliente.
- `client_buyer`: usuario externo que cria e acompanha cotacoes do proprio cliente.

A migration deve ajustar a constraint de roles existente com cuidado, pois `004_pro_flow_expansion.sql` criou uma constraint mais restritiva em alguns ambientes.

Exemplo de abordagem:

```sql
DO $$
BEGIN
    ALTER TABLE users DROP CONSTRAINT IF EXISTS check_user_role;
    ALTER TABLE users ADD CONSTRAINT check_user_role
    CHECK (role IN ('super_admin', 'admin', 'helper', 'auditor', 'user', 'client_admin', 'client_buyer'));
END $$;
```

### 1.5 Categorias por cliente

Criar tabela de categorias customizadas:

```sql
CREATE TABLE IF NOT EXISTS item_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (client_id, name)
);

CREATE INDEX IF NOT EXISTS idx_item_categories_client_id
ON item_categories(client_id);
```

### 1.6 Campos B2B nos itens da cotacao

Adicionar campos opcionais em `shopping_list_items`:

```sql
ALTER TABLE shopping_list_items
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES item_categories(id) ON DELETE SET NULL;

ALTER TABLE shopping_list_items
ADD COLUMN IF NOT EXISTS sku_grade VARCHAR(100);

ALTER TABLE shopping_list_items
ADD COLUMN IF NOT EXISTS target_price DECIMAL(10,2);

CREATE INDEX IF NOT EXISTS idx_items_category_id
ON shopping_list_items(category_id);
```

### 1.7 Status e integracao com notificacoes

Evitar criar uma estrutura grande de notificacoes nesta fase. Primeiro, garantir que `shopping_lists.status` e `search_jobs.status` tenham atualizacao consistente.

Se necessario para automacoes n8n, adicionar campos leves:

```sql
ALTER TABLE shopping_lists
ADD COLUMN IF NOT EXISTS client_notified_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE shopping_lists
ADD COLUMN IF NOT EXISTS notification_status VARCHAR(30) DEFAULT 'pending';
```

Valores sugeridos para `notification_status`:

- `pending`
- `queued`
- `sent`
- `failed`

### 1.8 Atualizar tipos e repositorios

Atualizar:

- `frontend/src/types/database.ts`
- `frontend/src/services/api.ts`
- `frontend/src/app/api/repositories/UserRepository.ts`
- `frontend/src/app/api/repositories/ClientRepository.ts`
- `frontend/src/app/api/repositories/ListRepository.ts`

Requisitos:

- `User` deve incluir `client_id?: string | null`.
- `ShoppingListItem` deve incluir `category_id`, `sku_grade` e `target_price`.
- `ListItemInput` deve aceitar os novos campos opcionais.
- `ListRepository.create` deve salvar os novos campos dos itens.
- `ClientRepository` deve continuar aceitando `name`, `document`, `email` e `phone`, com suporte opcional a `trade_name`, `active` e `metadata`.

### 1.9 Validacao da fase

Validar:

- Migration roda em banco ja existente.
- Migration e idempotente.
- Criacao de cotacao legada continua funcionando sem os novos campos.
- Listagem de clientes continua funcionando.
- Criacao de cliente continua funcionando.

---

## FASE 2: AUTENTICACAO, AUTORIZACAO E ISOLAMENTO MULTITENANT

Esta e a fase mais importante de seguranca.

O portal B2B so deve ser considerado implementado quando usuarios com `client_id` nao conseguirem acessar dados de outro cliente por nenhuma rota.

### 2.1 Atualizar JWT

Atualizar `frontend/src/app/api/lib/auth.ts`:

- Incluir `client_id?: string | null` em `JwtPayload`.
- Atualizar union de roles para incluir `client_admin` e `client_buyer`.
- Manter expiracao do token.

Atualizar login em `frontend/src/app/api/users/login/route.ts`:

- Buscar `client_id` do usuario.
- Incluir `client_id` no token.
- Retornar `client_id` no objeto `user`.

Atualizar `frontend/src/context/AuthContext.tsx`:

- Incluir as novas roles.
- Incluir `client_id` no usuario autenticado.

### 2.2 Criar helpers de autorizacao

Criar ou expandir helpers em `frontend/src/app/api/lib/auth.ts` ou arquivo dedicado:

- `verifyAuth(request)`
- `requireAuth(request)`
- `hasRole(user, roles)`
- `isInternalUser(user)`
- `isClientUser(user)`
- `canAccessClient(user, clientId)`

Regras sugeridas:

- `admin`, `super_admin`, `helper` e `auditor` podem acessar dados internos conforme permissao da rota.
- `client_admin` e `client_buyer` so podem acessar dados do proprio `client_id`.
- Usuario B2B sem `client_id` deve receber `403`.

### 2.3 Aplicar autorizacao nas rotas existentes

Aplicar verificacao nas rotas Next.js atuais:

- `GET /api/lists`
- `POST /api/lists`
- `GET /api/lists/[id]`
- `GET /api/lists/[id]/results`
- `GET /api/lists/[id]/export`
- `PATCH /api/lists/[id]/approve/[itemId]`
- `POST /api/lists/[id]/select/[itemId]`
- `POST /api/search/batch`
- `GET /api/search/status/[jobId]`
- `GET /api/clients`
- `POST /api/clients`
- `GET /api/users`
- `POST /api/users`

Requisitos por rota:

- Usuario interno pode manter comportamento atual, respeitando roles administrativas.
- Usuario B2B em `GET /api/lists` deve receber apenas listas do seu `client_id`.
- Usuario B2B em `POST /api/lists` nao pode escolher outro `clientId`; o backend deve usar o `client_id` do token.
- Usuario B2B em rotas por `listId` deve passar por validacao de propriedade da lista.
- Usuario B2B nao deve conseguir aprovar, selecionar ou exportar itens de outro cliente.

### 2.4 Repositorios com filtros seguros

Evitar depender apenas de filtros passados pelo frontend.

Adicionar metodos ou parametros seguros no `ListRepository`, por exemplo:

- `listAll(filters, authContext)`
- `getByIdForUser(id, authContext)`
- `getResultsForUser(listId, authContext)`
- `assertListAccess(listId, authContext)`

O objetivo e centralizar a regra de acesso e reduzir risco de uma rota esquecer o filtro.

### 2.5 Endpoints de categorias

Implementar rotas Next.js, seguindo o padrao atual do projeto:

```text
GET  /api/clients/[id]/categories
POST /api/clients/[id]/categories
```

Permissoes:

- `admin` e `super_admin`: podem acessar qualquer cliente.
- `client_admin`: pode listar e criar categorias apenas para o proprio cliente.
- `client_buyer`: pode listar categorias apenas do proprio cliente.

Validacoes:

- `name` obrigatorio.
- Nao permitir categoria duplicada para o mesmo cliente.
- Nao permitir criar categoria em outro `client_id`.

### 2.6 Validacao da fase

Validar:

- Usuario B2B nao lista cotacoes de outro cliente.
- Usuario B2B nao acessa detalhes de lista de outro cliente por URL direta.
- Usuario B2B nao exporta resultados de outro cliente.
- Usuario B2B nao aprova item de outro cliente.
- Admin continua acessando todas as cotacoes.
- Token expirado ou ausente retorna `401`.
- Usuario autenticado sem permissao retorna `403`.

---

## FASE 3: PORTAL DO CLIENTE B2B

### 3.1 Rotas e layout

Criar uma area visual separada para clientes externos.

Sugestao de rotas:

```text
frontend/src/app/(client)/client/dashboard/page.tsx
frontend/src/app/(client)/client/quotations/new/page.tsx
frontend/src/app/(client)/client/quotations/[id]/page.tsx
frontend/src/app/(client)/layout.tsx
```

Alternativa: reaproveitar o dashboard atual com renderizacao condicional por role. Escolher esta alternativa apenas se reduzir duplicacao sem misturar regras internas e externas.

### 3.2 Redirecionamento apos login

Apos login:

- Usuarios internos vao para `/dashboard`.
- `client_admin` e `client_buyer` vao para `/client/dashboard`.

### 3.3 Dashboard do cliente

Criar dashboard com linguagem de negocio:

- Pendentes
- Em cotacao
- Concluidas
- Com erro ou necessitando revisao

Exibir apenas cotacoes do `client_id` do usuario autenticado.

Evitar mostrar termos tecnicos de processamento, filas ou providers externos.

Mapeamento sugerido:

- `pending`: Enviado para a Infore
- `processing`: Analise de mercado iniciada
- `completed`: Cotacao concluida
- `failed`: Necessita revisao

### 3.4 Nova entrada manual B2B

Criar ou adaptar componente:

```text
frontend/src/components/list/ClientManualInput.tsx
```

Campos por item:

- Produto / descricao tecnica
- Unidade
- Quantidade
- Categoria
- Grade / especificacao
- Preco alvo / referencia

Requisitos:

- Categoria deve vir de `GET /api/clients/[id]/categories`.
- Campos B2B devem ser opcionais para nao quebrar fluxo interno.
- O componente deve continuar produzindo dados compativeis com `ListItemInput`.

### 3.5 Colar dados do Excel

Adicionar suporte a `onPaste` em area de tabela ou textarea dedicada.

Formato esperado:

```text
produto<TAB>unidade<TAB>quantidade<TAB>categoria<TAB>grade<TAB>preco_alvo
```

Regras:

- Separar linhas por quebra de linha.
- Separar colunas por tabulacao.
- Ignorar linhas vazias.
- Preservar acentos.
- Tratar quantidade com virgula decimal.
- Tratar preco com `R$`, ponto de milhar e virgula decimal.
- Categorias inexistentes devem ser sinalizadas ou criadas apenas se o usuario tiver permissao.

### 3.6 Upload CSV/XLSX

Manter suporte atual a upload, mas evoluir parsing para aceitar os campos B2B opcionais.

Cabecalhos sugeridos:

- `produto`
- `unidade`
- `quantidade`
- `categoria`
- `grade`
- `preco_alvo`

### 3.7 Validacao da fase

Validar:

- Cliente externo consegue criar cotacao vinculada ao proprio `client_id`.
- Cliente externo nao escolhe outro cliente no formulario.
- Colar planilha com acentos funciona.
- Colar planilha com preco `R$ 1.234,56` funciona.
- Fluxo interno de nova cotacao continua funcionando.
- UI funciona em desktop e mobile.

---

## FASE 4: NOTIFICACOES E N8N

### 4.1 Estado de conclusao

Garantir que quando todos os itens forem processados:

- `shopping_lists.status` seja atualizado para `completed`.
- `search_jobs.status` seja atualizado para `completed`, quando aplicavel.
- `shopping_lists.completed_at` seja preenchido, se ainda nao for.

### 4.2 Evento para automacao

Manter uma superficie simples para o n8n observar ou consultar.

Opcoes:

1. Usar colunas em `shopping_lists`:
   - `notification_status`
   - `client_notified_at`

2. Criar endpoint interno para n8n:
   - `GET /api/n8n/pending-notifications`
   - `POST /api/n8n/mark-notified`

3. Reaproveitar `WebhookService`, se ja houver padrao suficiente no projeto.

Escolher a menor opcao que resolva o fluxo atual.

### 4.3 Alertas visuais

No portal do cliente:

- Exibir cotacao concluida no dashboard.
- Exibir aviso visual na pagina de detalhes.
- Evitar notificacao duplicada se o usuario atualizar a tela.

### 4.4 Validacao da fase

Validar:

- Conclusao de cotacao atualiza status corretamente.
- n8n consegue identificar cotacoes concluidas e ainda nao notificadas.
- Depois do envio, cotacao nao volta a ser enviada sem necessidade.
- Cliente ve o status atualizado sem acessar dados de outro cliente.

---

## FASE 5: QA, HARDENING E DOCUMENTACAO

### 5.1 Testes manuais obrigatorios

Executar cenarios:

- Admin cria cliente.
- Admin cria usuario `client_admin` vinculado ao cliente.
- Admin cria usuario `client_buyer` vinculado ao cliente.
- Cliente cria cotacao.
- Cliente lista apenas suas cotacoes.
- Cliente tenta acessar cotacao de outro cliente por URL direta e recebe `403`.
- Cliente tenta exportar cotacao de outro cliente e recebe `403`.
- Cliente cola dados do Excel com caracteres especiais.
- Fluxo interno antigo continua funcionando.

### 5.2 Validacoes tecnicas

Executar comandos disponiveis no projeto:

```bash
npm run build --prefix frontend
npm run build --prefix backend
```

Se houver lint ou testes adicionados durante a implementacao, executa-los tambem.

### 5.3 Pontos de atencao antes de producao

- Confirmar `JWT_SECRET` forte no ambiente.
- Confirmar CORS adequado, caso backend Express seja usado.
- Confirmar que rotas sensiveis exigem autenticacao.
- Confirmar que nenhum filtro de `clientId` vem exclusivamente do frontend.
- Confirmar que usuarios B2B inativos nao conseguem logar.
- Confirmar backup antes de rodar migration em ambiente real.

---

## Criterios de Aceite

A implementacao so deve ser considerada completa quando:

- Usuario B2B autenticado nunca acessa cotacoes de outro `client_id`.
- Usuario B2B nao consegue forjar `clientId` no payload de criacao.
- Admin continua conseguindo operar todos os clientes.
- Rotas legadas continuam funcionando.
- Campos B2B opcionais nao quebram cotacoes antigas.
- Categorias sao isoladas por cliente.
- Importacao por colar do Excel preserva acentos e numeros em formato brasileiro.
- Token JWT inclui `client_id` e roles B2B.
- Rotas retornam `401` para nao autenticado e `403` para acesso negado.
- Build do frontend e backend concluem sem erro.

---

## Ordem Recomendada de Commits

1. `docs: revise b2b implementation plan`
2. `db: add b2b client portal migration`
3. `auth: add b2b roles and client scoped jwt`
4. `api: enforce client scoped access`
5. `api: add client categories endpoints`
6. `ui: add client portal dashboard`
7. `ui: add b2b quotation input`
8. `integration: expose quotation notification status`
9. `qa: add b2b validation coverage`

---

## Observacao Final para o Agent

Nao implementar o portal como uma recriacao paralela do sistema.

A estrategia correta e evoluir o sistema atual com:

- schema incremental;
- compatibilidade com clientes e cotacoes existentes;
- isolamento multitenant no backend;
- UI simplificada para usuarios externos;
- reaproveitamento dos repositorios, servicos e componentes ja existentes sempre que isso nao comprometer a seguranca.
