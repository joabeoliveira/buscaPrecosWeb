# Plano de Automação: Envio de Cotação

## Objetivo
Disponibilizar ao cliente uma planilha organizada no Google Sheets com os itens aprovados e enviar o link por e-mail automaticamente.

## Fluxo Lógico (n8n)

### 1. Webhook (POST)
- Recebe o JSON contendo:
    - `quotationName`: Nome da cotação.
    - `clientName`: Nome do cliente.
    - `clientEmail`: E-mail do interessado.
    - `internalCode`: Código interno da cotação.
    - `items`: Lista de itens aprovados (Array).

### 2. Normalização (Code Node)
- Formata os dados para as colunas:
    - `Produto`
    - `Unidade`
    - `Quantidade`
    - `Preço Unitário`
    - `Total Item`
    - `Fornecedor`
    - `Link para Compra`
- Calcula o valor total da cotação.

### 3. Google Sheets (Create/Update)
- Cria uma nova planilha na pasta `1WnooUiTQKIO_SVUsCeP133HRX2F8WIKJ`.
- Aplica formatação de cabeçalho.
- Insere as linhas de produtos.
- Insere uma linha de rodapé com o Valor Total GERAL.

### 4. Google Drive (Permissions)
- Altera a permissão do arquivo para "Qualquer pessoa com o link pode visualizar".

### 5. Gmail (Send Email)
- Monta um e-mail HTML personalizado.
- Inclui o nome do cliente e o link da planilha.
- Botão "Acessar Cotação Completa".

### 6. Resposta (HTTP Response)
- Retorna `status: 200` e o link gerado para o sistema exibir o feedback ao usuário.

## Estrutura do JSON Recebido
```json
{
  "quotation_id": "uuid",
  "name": "Cotação de Exemplo",
  "client_name": "Empresa ABC",
  "client_email": "contato@abc.com",
  "internal_code": "2024-001",
  "items": [
    {
      "product": "Item A",
      "unit": "un",
      "quantity": 10,
      "price": 150.50,
      "store": "Loja X",
      "link": "https://loja.com/p/1"
    }
  ]
}
```
