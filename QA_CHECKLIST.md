# ✅ Checklist Oficial de QA (Quality Assurance)
**Evolução do Motor de Inteligência B2B**

Utilize este documento para validar se as implementações das Fases 1 a 6 estão se comportando conforme o esperado em ambiente local e em produção. Marque os itens `[x]` conforme os testes forem sendo aprovados.

---

## 🗄️ Fase 1: Fundação de Dados (Produtos Canônicos e Histórico)
- [ ] **Teste de Normalização (Canonical Product):** 
  - *Ação:* Buscar "Papel Chamex A4", e em outra cotação buscar " Pàpèl  châmex a4  ".
  - *Esperado:* Ambas as buscas devem gerar/utilizar o exato mesmo `canonical_product_id` na tabela `canonical_products` (string padronizada).
- [ ] **Teste de Persistência Histórica:**
  - *Ação:* Iniciar uma cotação e buscar um produto que retorne múltiplas ofertas.
  - *Esperado:* A tabela `price_history` deve registrar novas linhas equivalentes ao número de lojistas encontrados (todas as ofertas), e não apenas a primeira colocada.
- [ ] **Teste da View Estatística (`price_stats`):**
  - *Ação:* Inserir dados no `price_history` e consultar a view no Postgres.
  - *Esperado:* A tabela `price_stats` deve refletir automaticamente a `media_preco`, `preco_minimo` e `volatilidade` corretas daquele produto com base em todas as buscas históricas.

## 🧠 Fase 2: Motor de Score e Auto-Seleção
- [ ] **Teste de Amostragem Inicial (Prevenção contra anomalias):**
  - *Ação:* Buscar um produto genérico totalmente inédito (ex: "Xpto Genérico 2026") que possua menos de 3 registros históricos no banco.
  - *Esperado:* A pontuação de oportunidade (`offer_score`) e as flags devem permanecer nulas, pois a inteligência exige pelo menos 3 registros prévios para evitar falsos positivos.
- [ ] **Teste de "Barganha" (Oferta Excelente):**
  - *Ação:* Fazer múltiplas requisições de um produto para popular o histórico (ex: preço médio de R$ 100). Depois, forçar (via banco ou mock) uma oferta muito mais barata (ex: R$ 50).
  - *Esperado:* A nova oferta receberá um `offer_score >= 100`, a flag `OPORTUNIDADE_ABAIXO_MEDIA` será salva, e o item será marcado como `auto_selected = true`.

## 🚀 Fase 3: Processamento Assíncrono (BullMQ)
- [ ] **Teste de Inicialização do Worker:**
  - *Ação:* Rodar `npm run dev` e observar os logs do terminal.
  - *Esperado:* O log "👷 Worker is running and listening to queue: search-queue" deve aparecer sem erros de conexão (ECONNREFUSED).
- [ ] **Teste de Fila Assíncrona (Resiliência):**
  - *Ação:* Enviar uma lista de 20 itens para busca e fechar a aba do navegador imediatamente.
  - *Esperado:* O terminal de backend (Worker) continuará processando os itens em background sem matar o processo HTTP. Ao reabrir o sistema, a lista estará finalizada com os dados salvos.

## 🔔 Fase 4: Alertas Visuais e Webhooks (n8n)
- [ ] **Teste de UI (Notificações):**
  - *Ação:* Forçar um erro de API (ou apenas finalizar uma lista inteira).
  - *Esperado:* O sino de notificações na Sidebar (canto inferior esquerdo) exibirá uma bolinha vermelha piscante. O dropdown mostrará as notificações corretas ancoradas para cima, sem vazar da tela.
- [ ] **Teste de Automação n8n (Opcional):**
  - *Ação:* Configurar um link de teste em `N8N_WEBHOOK_URL` e rodar uma busca que dispare um evento `price_opportunity` ou `list_completed`.
  - *Esperado:* O n8n receberá instantaneamente um POST (payload JSON) detalhado com o evento, permitindo montar automações de envio de WhatsApp/E-mail.

## 🔌 Fase 5: Motor Multi-Provedor (Registry)
- [ ] **Teste de Fallback/Recuperação de Desastre:**
  - *Ação:* Invalidar a chave `SERPER_API_KEY` temporariamente e realizar uma busca.
  - *Esperado:* O sistema não irá "crashar" o servidor. O `ProviderRegistry` logará o erro e, caso não haja outro provedor configurado, atualizará a lista com o status de erro controlado (`error`).

## 🎯 Fase 6: Matching Avançado (Similaridade de Jaccard)
- [ ] **Teste de Limpeza de Lixo Semântico:**
  - *Ação:* Buscar explicitamente por *"Monitor Dell Ultrasharp 27 polegadas 4K"* (sabendo que buscadores costumam misturar com anúncios de cabos/suportes).
  - *Esperado:* O `TextMatcher` calculará o índice Jaccard. Apenas ofertas que compartilham no mínimo 15% das palavras (ou contenham o nome exato) serão registradas. Anúncios não relacionados serão descartados automaticamente antes de corromper as estatísticas.

---
**Observação:** O comando oficial para iniciar todo o ambiente integrado localmente é `npm run dev` (que inicializa Frontend, Backend e o Worker simultaneamente). Certifique-se de que o **Docker (Postgres + Redis)** esteja operante.
