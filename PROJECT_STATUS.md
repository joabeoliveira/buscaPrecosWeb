# Project Status - BuscaPrecosWeb

Data de referencia: 2026-03-12
Owner: Joabe Oliveira

## Objetivo do arquivo
Registrar o que foi feito no dia, o status atual do projeto e os proximos passos para execucao do MVP sem perder contexto.

## Status geral
- Fase atual: FASE 0 (Decisoes + Setup de ambiente)
- Saude do projeto: Verde (documentacao base pronta)
- Risco principal no momento: Decisoes pendentes de arquitetura/infra antes de iniciar codigo

## O que foi concluido hoje
- PRD revisado e ajustado para versao 1.1 com refinamentos de escopo e requisitos.
- Plano de execucao do MVP criado e salvo em `PLAN.md`.
- Repositorio Git inicializado localmente.
- Projeto publicado no GitHub em `main`:
  - https://github.com/joabeoliveira/buscaPrecosWeb
- Estrutura inicial de skills presente em `.github/skills/`:
  - `apiSerperDev`
  - `serpApi`
  - `designSystem`
  - `GeckoAPI` (vazia, para tratar depois)

## Em andamento
- Definicao final das decisoes da FASE 0 para iniciar implementacao tecnica.

## Pendencias criticas (antes de codar)
- [ ] Confirmar API primaria do MVP: Serper.dev ou SerpApi.
- [ ] Confirmar estrategia de progresso: Polling com backoff (inicio) e migracao posterior para SSE.
- [ ] Confirmar politica de autenticacao no MVP (atual: sem auth, pos-MVP).
- [ ] Confirmar alvo de deploy inicial: local Docker + pronto para Coolify.

## Proximos passos (ordem sugerida)
1. Criar estrutura base de pastas `backend/` e `frontend/`.
2. Criar `docker-compose.yml` com PostgreSQL 15 e Redis 7.
3. Criar `.env.example` com variaveis minimas (`DATABASE_URL`, `REDIS_URL`, `SERPER_API_KEY` ou `SERPAPI_API_KEY`).
4. Inicializar backend Node.js + TypeScript + Express com estrutura limpa por camadas.
5. Inicializar frontend Next.js + Tailwind com tokens do Design System.

## Checklist por fase (resumo)
- [x] FASE 0 - Planejamento e definicao do escopo
- [ ] FASE 1 - Base backend + banco
- [ ] FASE 1-Frontend - Base Next.js + design system
- [ ] FASE 2 - Cache + integracao API externa
- [ ] FASE 3 - Frontend core + integracao
- [ ] FASE 4 - Integracao final + validacao

## Registro rapido diario
### 2026-03-12
- Feito:
  - Ajuste do PRD para 1.1.
  - Criacao de `PLAN.md`.
  - Publicacao do repo no GitHub.
- Proximo dia:
  - Iniciar setup tecnico (backend, frontend, docker, env).
- Bloqueios:
  - Nenhum bloqueio tecnico. Apenas decisoes de FASE 0 para fechar.

## Como usar este arquivo
- Atualizar no inicio do dia: "Fase atual" e "Pendencias criticas".
- Atualizar no fim do dia: bloco "Registro rapido diario".
- Marcar checklist por fase conforme entregas reais.
