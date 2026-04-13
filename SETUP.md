# Setup e Inicialização Local

Este documento descreve os passos necessários para configurar e rodar o projeto **BuscaPrecosWeb** em sua máquina local.

## Pré-requisitos

- **Docker Desktop** (instalado e rodando)
- **Node.js** (v20 ou superior recomendado)
- **NPM** (geralmente instalado com o Node)

## Passo a Passo

### 1. Subir a Infraestrutura
O projeto utiliza Docker para gerenciar o banco de dados PostgreSQL e o Redis.
```powershell
docker-compose up -d
```

### 2. Instalar Dependências
O projeto é um monorepo. Você deve instalar as dependências da raiz e em seguida as dos subprojetos (backend e frontend).
```powershell
# Instala dependências da raiz (como o concurrently)
npm install

# Instala todas as dependências do backend e frontend
npm run install-all
```

### 3. Configuração de Variáveis de Ambiente (.env)
Certifique-se de que os arquivos `.env` existam:
- `backend/.env` (já deve existir no seu ambiente)
- `frontend/.env.local` (já deve existir no seu ambiente)

*Caso precise recriar, use o `.env.example` da raiz como referência.*

Configuração mínima sugerida para ambiente local:

```powershell
# backend/.env
DATABASE_URL=postgresql://dev:dev123@localhost:5437/BuscaPrecosWeb
REDIS_URL=redis://localhost:6380
PORT=3001
NODE_ENV=development

# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

> [!IMPORTANT]
> As portas do host no `docker-compose.yml` são `5437` (Postgres) e `6380` (Redis).

### 4. Inicializar o Banco de Dados (Opcional/Primeira vez)
Para criar as tabelas iniciais no banco de dados:
```powershell
cd backend
npx tsx src/migrate.ts
cd ..
```
> [!NOTE]
> Existem migrações adicionais em `backend/migrations/`. Se o sistema acusar falta de colunas ou tabelas, pode ser necessário aplicar os outros scripts SQL manualmente ou via scripts em `backend/src/scripts/`.

### 5. Executar o Projeto
Para rodar tanto o Backend quanto o Frontend simultaneamente:
```powershell
npm run dev
```

## Links Úteis
- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **API (Backend):** [http://localhost:3001/api/v1](http://localhost:3001/api/v1)
- **Postgres:** Porta `5437` no host
- **Redis:** Porta `6380` no host
