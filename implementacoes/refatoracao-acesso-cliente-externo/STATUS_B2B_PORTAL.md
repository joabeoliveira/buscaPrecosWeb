# Status - Portal do Cliente B2B

Data: 2026-05-16
Branch: `feature/b2b-portal-cliente`
PR: `https://github.com/joabeoliveira/buscaPrecosWeb/pull/3`

## O que foi feito

- Criada a migration `backend/migrations/016_b2b_client_portal.sql`.
- Adicionados campos B2B em `clients`, `users`, `shopping_lists` e `shopping_list_items`.
- Criada a tabela `item_categories`.
- Adicionadas roles `client_admin` e `client_buyer`.
- JWT agora inclui `client_id`.
- Rotas de listas, resultados, exportação, busca, aprovação e seleção agora validam acesso por cliente.
- Criadas rotas de categorias por cliente:
  - `GET /api/clients/[id]/categories`
  - `POST /api/clients/[id]/categories`
- Criado portal externo em `/client`:
  - dashboard do cliente;
  - nova cotação;
  - detalhes da cotação.
- Nova cotação B2B aceita:
  - entrada manual;
  - colar dados do Excel;
  - upload CSV/TXT;
  - categoria;
  - grade/especificação;
  - preço alvo.
- Criados endpoints para n8n:
  - `GET /api/n8n/pending-notifications`
  - `POST /api/n8n/mark-notified`
- Rotas técnicas do n8n aceitam usuário interno autenticado ou `N8N_API_TOKEN` via header `x-n8n-token`.
- `/api/users/init` foi endurecido:
  - bloqueado em produção;
  - exige `INIT_ADMIN_TOKEN` quando já existem usuários;
  - não retorna senha na resposta.
- Adicionado QA automatizado local:
  - `cd frontend`
  - `npm run qa:b2b`
- Atualizados:
  - `.env.example`
  - `SETUP.md`
  - `DEPLOY_VERCEL.md`
  - `QA_CHECKLIST.md`
  - `PROJECT_STATUS.md`

## Validações realizadas

- `npm run build` no frontend: passou.
- `npm run build` no backend: passou.
- `npm run qa:b2b`: passou durante a sessão.
- Migration 016 foi aplicada no banco local.
- Banco local voltou a exibir dados na interface após aplicar a migration.
- PR aberto no GitHub.

## Observações

- Durante testes repetidos, o Windows/Next apresentou pressão de memória e falhas de worker.
- Os processos temporários do Next nas portas `3000` e `3005` foram encerrados.
- Nenhum servidor Next foi deixado rodando em background.
- O warning do Next sobre múltiplos `package-lock.json` foi resolvido com `outputFileTracingRoot`.

## Próximos passos amanhã

1. Reiniciar VS Code/ambiente para começar com memória limpa.
2. Subir o frontend:

```powershell
cd frontend
npm run dev
```

3. Rodar QA automatizado:

```powershell
cd frontend
npm run qa:b2b
```

4. Rodar builds:

```powershell
cd frontend
npm run build

cd ../backend
npm run build
```

5. Fazer teste visual manual com usuário `client_admin`:
   - login;
   - `/client/dashboard`;
   - criar cotação manual;
   - colar Excel;
   - upload CSV/TXT;
   - abrir detalhes da cotação.

6. Testar isolamento manual:
   - tentar acessar URL de cotação de outro cliente;
   - confirmar retorno `403`.

7. Testar n8n real:
   - configurar `N8N_WEBHOOK_URL`;
   - configurar `N8N_API_TOKEN`;
   - consultar `/api/n8n/pending-notifications`;
   - marcar notificação com `/api/n8n/mark-notified`;
   - confirmar `notification_status = sent`.

8. Revisar PR `#3` e decidir merge.
