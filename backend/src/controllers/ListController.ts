import type { Request, Response } from 'express';
import { ListRepository } from '../repositories/ListRepository.js';
import { z } from 'zod';
import ExcelJS from 'exceljs';

const CreateListSchema = z.object({
  name: z.string().min(3),
  clientId: z.string().uuid().nullable().optional(),
  responsibleId: z.string().uuid().nullable().optional(),
  internalCode: z.string().nullable().optional(),
  items: z.array(z.union([
    z.string(),
    z.object({
      query: z.string(),
      unit: z.string().optional(),
      quantity: z.number().optional(),
    })
  ])),
});

export class ListController {
  private repository: ListRepository;

  constructor() {
    this.repository = new ListRepository();
  }

  create = async (req: Request, res: Response) => {
    try {
      const { name, items, clientId, responsibleId, internalCode } = CreateListSchema.parse(req.body);
      const listId = await this.repository.create(
        name, 
        items, 
        null, 
        clientId || null, 
        responsibleId || null, 
        internalCode || null
      );
      
      res.status(201).json({
        id: listId,
        name,
        itemsCount: items.length,
        status: 'pending',
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Dados inválidos', details: error.issues });
      } else {
        console.error('Erro ao criar lista:', error);
        res.status(500).json({ error: 'Erro interno ao criar cotação' });
      }
    }
  };

  listAll = async (req: Request, res: Response) => {
    try {
      const filters = {
        status: req.query.status as string,
        clientId: req.query.clientId as string,
      };
      const lists = await this.repository.listAll(filters);
      res.json(lists);
    } catch (error) {
      console.error('Erro ao listar cotações:', error);
      res.status(500).json({ error: 'Erro ao carregar cotações' });
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const list = await this.repository.getById(id as string);
      if (!list) return res.status(404).json({ error: 'Cotação não encontrada' });
      res.json(list);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar cotação' });
    }
  };

  getResults = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const results = await this.repository.getResults(id as string);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar resultados' });
    }
  };

  approveItem = async (req: Request, res: Response) => {
    try {
      const { itemId } = req.params;
      const { isApproved, userId } = req.body;
      await this.repository.approveItem(itemId as string, isApproved, userId);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Erro ao aprovar item:', error);
      res.status(500).json({ error: 'Erro ao aprovar item' });
    }
  };

  selectResult = async (req: Request, res: Response) => {
    try {
      const { itemId } = req.params;
      if (!itemId) return res.status(400).json({ error: 'itemId é obrigatório' });

      const { selection, userId } = req.body;
      await this.repository.selectResult(itemId as string, selection, userId);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Erro ao selecionar resultado:', error);
      res.status(500).json({ error: 'Erro ao selecionar resultado' });
    }
  };

  exportCsv = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const format = (req.query.format as string) || 'excel';
      
      if (!id) return res.status(400).json({ error: 'ID é obrigatório' });

      const results = await this.repository.getResults(id as string);
      const list = await this.repository.getById(id as string);

      if (!list) {
        return res.status(404).json({ error: 'Cotação não encontrada' });
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
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        return res.status(200).send(csv);
      }

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

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

      await workbook.xlsx.write(res);
      res.end();

    } catch (error) {
      console.error('Erro no export:', error);
      res.status(500).json({ error: 'Erro ao exportar cotação' });
    }
  };
}
