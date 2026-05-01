# Project Status - BuscaPrecosWeb

Data de referencia: 2026-05-01
Owner: Joabe Oliveira

## Objetivo do arquivo
Registrar o que foi feito no dia, o status atual do projeto e os proximos passos para execucao do MVP sem perder contexto.

## Status geral
- Fase atual: EVOLUÇÃO B2B CONCLUÍDA (Inteligência Artificial e Filas)
- Saude do projeto: Verde (Deploy pendente para VPS devido a serviços de background / Redis)
- Risco principal no momento: Validar Jaccard Similarity (threshold 0.15) em ambiente real com dezenas de itens técnicos.

## O que foi concluido hoje (2026-05-01)
- **Evolução do Motor de Decisão (Fases 1 a 6)**:
  - **Fase 1**: Implementado `CanonicalProductRepository` e view estatística `price_stats` para acompanhar `media_preco` e `volatilidade`.
  - **Fase 2**: Criado o `ScoreEngine`. O sistema avalia o histórico, pontua ofertas excelentes (`offer_score >= 100`) e realiza o *auto-select* no carrinho.
  - **Fase 3**: Desacoplado do Vercel Serverless. Adicionado **BullMQ** e Redis para processamento de filas puramente assíncrono (Worker isolado do HTTP).
  - **Fase 4**: Sistema de alertas globais implementado. Webhooks automáticos (n8n) e notificações na UI em tempo real com `AlertDropdown.tsx`.
  - **Fase 5**: Padronizado o motor `Multi-Provider` com um `ProviderRegistry` de fallback (Serper nativo desacoplado).
  - **Fase 6**: Aplicado o modelo de Similaridade de Jaccard (`TextMatcher.ts`) para exclusão de "lixo" e "falsos positivos" nas pesquisas da Serper.

## Em andamento
- Homologação de Qualidade (QA) com a equipe usando o novo `QA_CHECKLIST.md`.
- Planejamento para mover a aplicação de testes Serverless (Vercel) para um VPS definitivo rodando Docker + PM2 (para suportar o Worker Node.js contínuo).

## Pendencias criticas
- [x] Migrar para filas Assíncronas usando BullMQ.
- [x] Criar sistema de regras (Score e Jaccard) para auto-selecionar os produtos corretos.
- [x] Consertar bug de inicialização do Worker (problema do carregamento .env com Redis corrigido).
- [ ] Planejar deploy da stack completa (Frontend, Backend Next, Worker, Postgres, Redis) na VPS de produção.

## Proximos passos (ordem sugerida)
1. Concluir os testes do `QA_CHECKLIST.md` rodando listas de compras reais.
2. Migrar os recursos da Vercel para uma VPS (DigitalOcean / Hetzner), garantindo que o Worker do BullMQ não "durma".
3. Adicionar novos provedores (Mercado Livre, Buscapé) preenchendo a interface genérica `PriceProvider`.

## Checklist por fase (Evolução B2B)
- [x] FASE 1 - Normalização de Nomes e Histórico de Preços
- [x] FASE 2 - Motor de Score e Auto-seleção de Compras
- [x] FASE 3 - Processamento Paralelo de Filas Assíncronas (BullMQ)
- [x] FASE 4 - Central de Alertas e Despacho via Webhooks (n8n)
- [x] FASE 5 - Motor Multi-Provedores (Registro Dinâmico)
- [x] FASE 6 - Exclusão de Ruído e Matching Avançado de Produtos

## Registro rapido diario
### 2026-05-01
- Feito: Implementado plano mestre de evolução B2B. Finalizado `AlertDropdown` na UI, fix da porta do Redis no Worker e inserido o filtro Jaccard antes de registrar o preço base. QA Checklist criado no root do projeto.
- Proximo dia: Executar testes de qualidade em listas de compra com nomes misturados (lixo vs nome real) para calibrar a tolerância de IA.
