# Automação de Cotação com n8n

Esta pasta contém os arquivos necessários para a automação de envio de cotações para clientes.

## Componentes
1.  **Workflow (`workflow_cotacao.json`)**: Fluxo principal para importar no n8n.
2.  **Plano de Automação (`plan_automacao.md`)**: Detalhamento lógico do fluxo.

## Como Configurar
1.  **Importar Workflow**: No n8n, clique em "Workflows" > "Add Workflow" > "Import from File" e selecione `workflow_cotacao.json`.
2.  **Configurar Credenciais**:
    *   **Google Sheets**: Autentique com sua conta Google com permissões de edição no Drive/Sheets.
    *   **Gmail**: Autentique para permitir o disparo de e-mails.
3.  **Configurar Webhook**:
    *   Copie a URL do nó "Webhook" no n8n.
    *   No seu arquivo `.env.local` do projeto `buscaPrecosWeb`, adicione:
        ```env
        N8N_WEBHOOK_URL=SUA_URL_AQUI
        ```
4.  **Google Drive Folder**:
    *   A planilha será salva na pasta especificada pelo ID: `1WnooUiTQKIO_SVUsCeP133HRX2F8WIKJ` (definido no workflow).

## Fluxo da Automação
1.  **Gatilho**: O botão "Enviar Cotação" no Dashboard envia um JSON com dados do cliente e itens aprovados.
2.  **Planilha**: O n8n cria uma nova aba ou arquivo no Google Sheets formatado.
3.  **Drive**: O arquivo é compartilhado para visualização.
4.  **E-mail**: Um e-mail HTML é enviado ao cliente com o link direto da planilha.
