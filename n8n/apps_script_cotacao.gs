/**
 * Script para formatação e criação de planilhas de cotação via n8n.
 * 
 * INSTRUÇÕES DE INSTALAÇÃO:
 * 1. Acesse https://script.google.com/
 * 2. Crie um "Novo projeto".
 * 3. Substitua todo o código padrão por este código.
 * 4. Salve o projeto (ex: "Gerador de Cotações").
 * 5. Clique no botão azul "Implantar" (Deploy) no canto superior direito > "Nova implantação".
 * 6. Selecione o tipo "App da Web" (ícone de engrenagem se não aparecer).
 * 7. Descrição: "v1"
 * 8. Executar como: "Eu (seu_email@gmail.com)"
 * 9. Quem pode acessar: "Qualquer pessoa" (Isso permite que o n8n chame o script)
 * 10. Clique em "Implantar". (Autorize os acessos se o Google pedir).
 * 11. COPIE a "URL do app da Web" gerada e coloque-a no nó "HTTP Request" do n8n.
 */

function doPost(e) {
  try {
    // Fazer parse dos dados recebidos do n8n
    var data = JSON.parse(e.postData.contents);
    var quotationName = data.name || "Cotação Sem Nome";
    var clientName = data.client_name || "Cliente";
    var items = data.items || [];
    var folderId = "1WnooUiTQKIO_SVUsCeP133HRX2F8WIKJ"; // A pasta solicitada
    
    // 1. Criar a nova planilha
    var ss = SpreadsheetApp.create("Cotação: " + clientName + " - " + quotationName);
    var file = DriveApp.getFileById(ss.getId());
    
    // 2. Mover para a pasta correta
    var folder = DriveApp.getFolderById(folderId);
    file.moveTo(folder);
    
    // 3. Configurar permissão para que quem tem o link possa ler
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // 4. Configurar a aba e os dados
    var sheet = ss.getSheets()[0];
    sheet.setName("Itens da Cotação");
    
    // Cabeçalhos
    var headers = ["Produto", "Unid", "Qtd", "Preço Unit", "Total", "Fornecedor", "Ação"];
    sheet.appendRow(headers);
    
    // Esconder linhas/colunas extras para ficar um visual mais limpo (opcional)
    if (sheet.getMaxColumns() > headers.length) {
      sheet.deleteColumns(headers.length + 1, sheet.getMaxColumns() - headers.length);
    }
    
    var rows = [];
    var totalGeral = 0;
    
    for (var i = 0; i < items.length; i++) {
        var qty = parseFloat(items[i].quantity) || 1;
        var price = parseFloat(items[i].price) || 0;
        var itemTotal = qty * price;
        totalGeral += itemTotal;
        
        // Adicionar hyperlink se tiver link
        var linkFormula = items[i].link ? '=HYPERLINK("' + items[i].link.replace(/"/g, '""') + '"; "Ver Oferta")' : 'Sem Link';
        
        rows.push([
            items[i].product,
            items[i].unit,
            qty,
            price,
            itemTotal,
            items[i].store,
            linkFormula
        ]);
    }
    
    // 5. Inserir todos os itens
    if (rows.length > 0) {
        var dataRange = sheet.getRange(2, 1, rows.length, headers.length);
        dataRange.setValues(rows);
        
        // Formatar valores financeiros
        sheet.getRange(2, 4, rows.length, 2).setNumberFormat("R$ #,##0.00");
        // Formatar quantidades
        sheet.getRange(2, 3, rows.length, 1).setNumberFormat("0.00");
        
        // Alinhamento
        sheet.getRange(2, 2, rows.length, 2).setHorizontalAlignment("center");
        sheet.getRange(2, 7, rows.length, 1).setHorizontalAlignment("center");
    }
    
    // 6. Adicionar Linha de Total Geral
    var lastRow = sheet.getLastRow();
    
    // Congelar a linha de cabeçalho
    sheet.setFrozenRows(1);
    
    // Formatar Estilo da Tabela
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight("bold")
               .setBackground("#1a365d") // Petroleum color
               .setFontColor("#ffffff")
               .setHorizontalAlignment("center")
               .setVerticalAlignment("middle");
    sheet.setRowHeight(1, 40); // altura do cabeçalho
    
    // Adicionar Total na base
    sheet.getRange(lastRow + 2, 4).setValue("TOTAL GERAL:").setFontWeight("bold").setHorizontalAlignment("right");
    sheet.getRange(lastRow + 2, 5).setValue(totalGeral).setFontWeight("bold").setNumberFormat("R$ #,##0.00").setBackground("#e2e8f0");
    
    // 7. Ajustar larguras das colunas
    sheet.setColumnWidth(1, 350); // Produto
    sheet.setColumnWidth(2, 70);  // Unid
    sheet.setColumnWidth(3, 70);  // Qtd
    sheet.setColumnWidth(4, 120); // Preço
    sheet.setColumnWidth(5, 120); // Total
    sheet.setColumnWidth(6, 180); // Fornecedor
    sheet.setColumnWidth(7, 120); // Link
    
    // Retornar os dados para o n8n prosseguir
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      spreadsheetId: ss.getId(),
      spreadsheetUrl: ss.getUrl(),
      total_geral: totalGeral
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    // Retornar erro caso falhe
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
