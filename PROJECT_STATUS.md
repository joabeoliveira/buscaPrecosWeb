# Project Status - BuscaPrecosWeb

Data de referência: 2026-05-01
Owner: Joabe Oliveira

## Objetivo do arquivo
Registrar o que foi feito no dia, o status atual do projeto e os próximos passos para execução do MVP sem perder contexto.

## Status geral
- Fase atual: EVOLUÇÃO B2B CONCLUÍDA & MÓDULO DE PARCEIROS INTEGRADO
- Saúde do projeto: Verde (Tudo rodando localmente de forma excelente)
- Risco principal no momento: Calibrar os seletores de scraping no n8n para parceiros específicos.

## O que foi concluído hoje (2026-05-01)
- **Correção de Banco e Encoding (Normalização UTF-8)**:
  - Corrigido o encoding de todas as 14 categorias e nomes de parceiros via script SQL direto no Postgres (`docker cp` + `psql -f`), garantindo compatibilidade 100% com caracteres especiais do Brasil.
- **Módulo de Parceiros (Suppliers)**:
  - Criação da tabela `suppliers`, criação do repositório, rotas da API e interface CRUD completa.
  - Implementada a busca direta e síncrona via endpoint `/api/suppliers/search` que se comunica diretamente com o webhook do n8n sem depender de filas (espera até 25 segundos pela resposta).
  - Atualizado o componente `ResultsTable.tsx` e a tela de cotações para permitir a busca em parceiros selecionados.
  - Criado o plano e arquitetura de integração do n8n para realizar scraping dinâmico e normalização de dados.

## Em andamento
- Homologação de Qualidade (QA) com a equipe usando o novo `QA_CHECKLIST.md`.
- Construção de novos fluxos de roteamento no n8n para parceiros de nicho da Inforé.

## Pendências críticas
- [ ] Planejar deploy da stack completa (Frontend, Backend Next, Worker, Postgres, Redis) na VPS de produção.

## Próximos passos (ordem sugerida)
1. Concluir os testes do `QA_CHECKLIST.md` rodando listas de compras reais.
2. Configurar o n8n com o novo nó Code que decide a API de scraping e roteia o payload dinamicamente.
3. Migrar os recursos para uma VPS (DigitalOcean / Hetzner) com Docker.

## Checklist por fase (Evolução B2B)
- [x] FASE 1 - Normalização de Nomes e Histórico de Preços
- [x] FASE 2 - Motor de Score e Auto-seleção de Compras
- [x] FASE 3 - Processamento Paralelo de Filas Assíncronas (BullMQ)
- [x] FASE 4 - Central de Alertas e Despacho via Webhooks (n8n)
- [x] FASE 5 - Motor Multi-Provedores (Registro Dinâmico)
- [x] FASE 6 - Exclusão de Ruído e Matching Avançado de Produtos
- [x] EXTRA - Módulo Completo de Parceiros com Busca Síncrona

## Registro rápido diário
### 2026-05-01
- **Manhã**: Implementado plano mestre de evolução B2B. Finalizado `AlertDropdown` na UI, fix da porta do Redis no Worker e inserido o filtro Jaccard.
- **Noite**: Correção completa de UTF-8 do banco de dados, criação de CRUD de parceiros e lançamento do fluxo de busca direta e síncrona com n8n Webhook.
