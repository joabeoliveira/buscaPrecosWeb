# 🚀 Plano de Deploy na Vercel — BuscaPrecosWeb

## Visão Geral

Deploy full-stack Next.js na Vercel com:
- **Postgres**: Neon (integração nativa Vercel) — Free tier
- **Redis**: Upstash (integração nativa Vercel) — Free tier
- **Runtime**: Next.js API Routes (serverless)

**Custo estimado**: R$ 0/mês (Free tier de todos os serviços)

---

## Pré-requisitos

- [x] Conta no GitHub com repo: `joabeoliveira/buscaPrecosWeb`
- [ ] Conta na Vercel (vercel.com) — login com GitHub
- [ ] Conta no Neon (neon.tech) — ou criar via Vercel Marketplace
- [ ] Conta no Upstash (upstash.com) — ou criar via Vercel Marketplace

---

## Passo 1: Preparar o Repositório

### 1.1 Push da branch `refactor/nextjs-api-routes` para o GitHub

```bash
git push origin refactor/nextjs-api-routes
```

### 1.2 (Opcional) Merge na `main` quando estiver pronto

```bash
git checkout main
git merge refactor/nextjs-api-routes
git push origin main
```

---

## Passo 2: Criar o Projeto na Vercel

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Selecione o repositório `joabeoliveira/buscaPrecosWeb`
3. **IMPORTANTE** — Configure o Root Directory:
   - Clique em **"Edit"** ao lado de "Root Directory"
   - Defina: `frontend`
4. Framework Preset: **Next.js** (auto-detectado)
5. Build Command: `next build` (padrão)
6. Output Directory: `.next` (padrão)
7. **Não clique em "Deploy" ainda** → primeiro configure as variáveis de ambiente (Passo 4)

---

## Passo 3: Provisionar Banco de Dados e Cache

### 3.1 Postgres (Neon) — via Vercel Marketplace

1. No painel do projeto Vercel → aba **"Storage"**
2. Clique em **"Connect Database"** → selecione **"Neon"**
3. Escolha **"Create New"** → Free tier
4. Região: **São Paulo (sa-east-1)** ou a mais próxima
5. Nome do database: `buscaprecosweb`
6. A Vercel vai injetar automaticamente a variável `DATABASE_URL`

### 3.2 Redis (Upstash) — via Vercel Marketplace

1. No painel do projeto Vercel → aba **"Storage"**
2. Clique em **"Connect Database"** → selecione **"Upstash Redis"**
3. Escolha **"Create New"** → Free tier
4. Região: **São Paulo** ou a mais próxima
5. A Vercel vai injetar a variável `REDIS_URL` (ou `KV_REST_API_URL`)

> **⚠️ Nota sobre Redis:** Se a Vercel injetar `KV_REST_API_URL` em vez de `REDIS_URL`, você vai precisar ajustar. Veja o Passo 4.

---

## Passo 4: Configurar Variáveis de Ambiente

No painel do projeto Vercel → **"Settings"** → **"Environment Variables"**

Adicione estas variáveis manualmente (as do banco são adicionadas automaticamente):

| Variável | Valor | Ambiente |
|---|---|---|
| `DATABASE_URL` | *(auto, pelo Neon)* | Production, Preview |
| `REDIS_URL` | *(auto, pelo Upstash)* | Production, Preview |
| `SERPER_API_KEY` | `50559f72...` (sua chave) | Production, Preview |
| `SERPAPI_API_KEY` | `ffd28c38...` (sua chave) | Production, Preview |
| `JWT_SECRET` | *(gerar uma chave forte)* | Production, Preview |
| `NODE_ENV` | `production` | Production |

### Gerar JWT_SECRET seguro

```bash
openssl rand -base64 32
```

Ou no PowerShell:
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
```

> **⚠️ IMPORTANTE**: NÃO use o JWT_SECRET de desenvolvimento em produção!

---

## Passo 5: Executar as Migrations no Neon

O banco Neon começa vazio. Você precisa rodar as migrations.

### Opção A: Via Neon Console (recomendado)

1. Acesse [console.neon.tech](https://console.neon.tech)
2. Selecione seu projeto/database
3. Vá em **"SQL Editor"**
4. Execute cada arquivo de migration em ordem:

```
backend/migrations/001_initial.sql
backend/migrations/002_add_thumbnail_and_approval.sql
backend/migrations/003_add_description.sql
backend/migrations/004_pro_flow_expansion.sql
backend/migrations/005_add_unit_quantity.sql
backend/migrations/006_user_roles.sql
```

### Opção B: Via linha de comando (psql)

```bash
# Copie a DATABASE_URL do painel Neon
export DATABASE_URL="postgresql://user:pass@ep-xxx.sa-east-1.aws.neon.tech/buscaprecosweb?sslmode=require"

# Execute cada migration
psql "$DATABASE_URL" -f backend/migrations/001_initial.sql
psql "$DATABASE_URL" -f backend/migrations/002_add_thumbnail_and_approval.sql
psql "$DATABASE_URL" -f backend/migrations/003_add_description.sql
psql "$DATABASE_URL" -f backend/migrations/004_pro_flow_expansion.sql
psql "$DATABASE_URL" -f backend/migrations/005_add_unit_quantity.sql
psql "$DATABASE_URL" -f backend/migrations/006_user_roles.sql
```

---

## Passo 6: Deploy!

1. Volte ao painel do projeto na Vercel
2. Clique em **"Deployments"** → **"Redeploy"** (ou faça um push e o deploy será automático)
3. Aguarde o build (leva ~1-2 minutos)
4. Acesse a URL gerada: `https://buscaprecosweb.vercel.app`

---

## Passo 7: Verificação Pós-Deploy

### 7.1 Testar endpoints

```bash
# Health check
curl https://SUA-URL.vercel.app/api/health

# Listar cotações  
curl https://SUA-URL.vercel.app/api/lists

# Login
curl -X POST https://SUA-URL.vercel.app/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"seu@email.com","password":"123456"}'
```

### 7.2 Checklist de verificação

- [ ] `/api/health` retorna `{"status":"ok"}`
- [ ] Página de login carrega corretamente
- [ ] Login funciona e redireciona ao dashboard
- [ ] Criação de cotação funciona
- [ ] Busca de preços funciona (Serper API)
- [ ] Exportação Excel funciona
- [ ] Aprovação de itens funciona

---

## Possíveis Ajustes Necessários

### Se Redis usar Upstash REST (não TCP)

Se o Upstash injetar `KV_REST_API_URL` em vez de `REDIS_URL`, você precisará adaptar o `RedisCacheService.ts` para usar `@upstash/redis`:

```bash
cd frontend
npm install @upstash/redis
```

E trocar a implementação para:
```typescript
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv(); // Lê KV_REST_API_URL automaticamente
```

> Vou fazer essa adaptação se você precisar.

### Timeout em Serverless (Batch Processing)

As funções serverless da Vercel têm timeout de:
- **Hobby**: 60 segundos
- **Pro**: 300 segundos

Se uma cotação tiver muitos itens, o batch processing pode exceder o timeout. Soluções:
1. **Limitar itens por batch** (ex: 10 itens por request)
2. **Dividir em requests menores** no frontend
3. **Usar o plano Pro da Vercel** para 5min de timeout

---

## Limites do Free Tier

| Serviço | Limite Free | Suficiente? |
|---|---|---|
| **Vercel** | 100GB bandwidth, builds ilimitados | ✅ Sim |
| **Neon (Postgres)** | 0.5 GB storage, 190h compute | ✅ Sim |
| **Upstash (Redis)** | 500K commands/mês, 256MB | ✅ Sim |
| **Serper API** | 2.500 buscas/mês (free) | ⚠️ Depende do uso |

---

## Resumo Rápido

```
1. Push para GitHub
2. Criar projeto na Vercel (Root Dir: frontend)
3. Adicionar Neon (Postgres) via Storage
4. Adicionar Upstash (Redis) via Storage
5. Configurar variáveis de ambiente (SERPER_API_KEY, JWT_SECRET)
6. Rodar migrations no Neon (6 arquivos SQL)
7. Deploy automático ✅
```

---

**Versão:** 1.0  
**Data:** 13 de abril de 2026  
**Pré-requisito:** Branch `refactor/nextjs-api-routes` merged
