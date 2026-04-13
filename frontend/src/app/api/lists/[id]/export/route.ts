import { NextRequest, NextResponse } from 'next/server';
import { ListRepository } from '@/app/api/repositories/ListRepository';
import ExcelJS from 'exceljs';

const listRepository = new ListRepository();

// GET /api/lists/[id]/export - Export quotation as CSV or Excel
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'excel';
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      );
    }

    const results = await listRepository.getResults(id);
    const list = await listRepository.getById(id);

    if (!list) {
      return NextResponse.json(
        { error: 'Cotação não encontrada' },
        { status: 404 }
      );
    }

    if (format === 'csv') {
      let csv = '\ufeffProduto;Unidade;Quantidade;Status;Melhor Preço;Total;Loja;Link;Aprovado\n';
      results.forEach(item => {
        const price = item.best_price || 0;
        const qty = item.quantity || 1;
        const total = price * qty;
        const formattedPrice = price.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
        const formattedTotal = total.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
        csv += `"${item.original_query}";"${item.unit || 'un'}";"${qty}";"${item.status}";"${formattedPrice}";"${formattedTotal}";"${item.best_store || ''}";"${item.best_product_link || ''}";"${item.is_approved ? 'Sim' : 'Não'}"\n`;
      });
      
      const filename = `cotacao_${String(id).substring(0, 8)}.csv`;
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename=${filename}`,
        },
      });
    }

    // Excel format
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Relatório de Cotação');

    const headerStyle: Partial<ExcelJS.Style> = {
      font: { bold: true, color: { argb: 'FFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '2D3748' } },
      alignment: { vertical: 'middle', horizontal: 'center' }
    };

    worksheet.columns = [
      { header: 'Produto', key: 'product', width: 40 },
      { header: 'Un', key: 'unit', width: 10 },
      { header: 'Qtd', key: 'quantity', width: 10 },
      { header: 'Preço Un.', key: 'price', width: 15 },
      { header: 'Total', key: 'total', width: 15 },
      { header: 'Fornecedor', key: 'store', width: 25 },
      { header: 'Link do Produto', key: 'link', width: 40 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Data Cotação', key: 'date', width: 20 },
    ];

    worksheet.getRow(1).eachCell((cell) => {
      cell.style = headerStyle;
    });

    results.forEach(item => {
      const price = Number(item.best_price || 0);
      const qty = Number(item.quantity || 1);
      const total = price * qty;

      const row = worksheet.addRow({
        product: item.original_query,
        unit: item.unit || 'un',
        quantity: qty,
        price: price,
        total: total,
        store: item.best_store || (item.status === 'found' ? 'Análise Pendente' : 'Não Encontrado'),
        link: item.best_product_link || '-',
        status: item.is_approved ? 'Aprovado' : (item.status === 'found' ? 'Pendente' : 'Não Cotado'),
        date: item.searched_at ? new Date(item.searched_at).toLocaleDateString('pt-BR') : '-',
      });

      if (item.best_product_link) {
        row.getCell('link').value = {
          text: 'Ver Produto',
          hyperlink: item.best_product_link,
          tooltip: item.best_product_link
        };
        row.getCell('link').font = { color: { argb: '0563C1' }, underline: true };
      }
    });

    worksheet.getColumn('price').numFmt = '"R$ "#,##0.00';
    worksheet.getColumn('total').numFmt = '"R$ "#,##0.00';

    const filename = `cotacao_${list.name.replace(/\s+/g, '_')}_${String(id).substring(0, 8)}.xlsx`;

    const buffer = await workbook.xlsx.writeBuffer();
    
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=${filename}`,
      },
    });

  } catch (error) {
    console.error('Erro no export:', error);
    return NextResponse.json(
      { error: 'Erro ao exportar cotação' },
      { status: 500 }
    );
  }
}
