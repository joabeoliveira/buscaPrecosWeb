import { createClient, SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { normalizeQuery } from '../utils/helpers.js';

export interface CatmatItem {
  codigo: string;
  descricao: string;
  unidade?: string | null;
}

export interface CatmatMatchResult {
  input: string;
  bestMatch: CatmatItem | null;
  candidates: CatmatItem[];
  confidence: 'high' | 'medium' | 'low';
  justification?: string;
}

/**
 * Agente de IA para identificação do CATMAT mais adequado.
 *
 * Fluxo:
 *  1. Busca candidatos no Supabase via busca textual (ilike) combinada por palavras-chave.
 *  2. Envia os candidatos ao modelo de linguagem (gpt-4o-mini) para ranqueamento.
 *  3. Retorna o melhor código CATMAT com nível de confiança.
 *
 * Variáveis de ambiente necessárias:
 *  - SUPABASE_URL          URL do projeto Supabase
 *  - SUPABASE_SERVICE_KEY  Chave de serviço (service_role) do Supabase
 *  - OPENAI_API_KEY        Chave da API OpenAI
 *  - CATMAT_TABLE          Nome da tabela CATMAT no Supabase (padrão: "catmat")
 *
 * Esquema esperado da tabela CATMAT no Supabase:
 *  - codigo   TEXT  – código numérico do material (ex.: "101110")
 *  - descricao TEXT – descrição padronizada do material
 *  - unidade  TEXT  – unidade de medida (opcional, ex.: "UN", "KG")
 */
export class CatmatService {
  private supabase: SupabaseClient | null = null;
  private openai: OpenAI | null = null;
  private readonly tableName: string;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    this.tableName = process.env.CATMAT_TABLE || 'catmat';

    if (!supabaseUrl || !supabaseKey) {
      console.warn('[CATMAT] SUPABASE_URL ou SUPABASE_SERVICE_KEY não configurados. Identificação de CATMAT indisponível.');
    } else {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }

    if (!openaiKey) {
      console.warn('[CATMAT] OPENAI_API_KEY não configurada. Ranqueamento por IA indisponível.');
    } else {
      this.openai = new OpenAI({ apiKey: openaiKey });
    }
  }

  async matchDescription(description: string): Promise<CatmatMatchResult> {
    if (!this.supabase) {
      return {
        input: description,
        bestMatch: null,
        candidates: [],
        confidence: 'low',
        justification: 'Supabase não configurado.',
      };
    }

    const candidates = await this.searchCandidates(description);

    if (candidates.length === 0) {
      return {
        input: description,
        bestMatch: null,
        candidates: [],
        confidence: 'low',
        justification: 'Nenhum candidato CATMAT encontrado para a descrição informada.',
      };
    }

    if (!this.openai) {
      return {
        input: description,
        bestMatch: candidates[0] ?? null,
        candidates,
        confidence: 'low',
        justification: 'Ranqueamento por IA indisponível. Retornando primeiro candidato encontrado.',
      };
    }

    const { match, confidence, justification } = await this.rankWithAI(description, candidates);

    return {
      input: description,
      bestMatch: match,
      candidates,
      confidence,
      justification,
    };
  }

  async batchMatch(descriptions: string[]): Promise<CatmatMatchResult[]> {
    return Promise.all(descriptions.map((d) => this.matchDescription(d)));
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private async searchCandidates(description: string): Promise<CatmatItem[]> {
    const normalized = normalizeQuery(description);
    const keywords = normalized
      .split(' ')
      .filter((t) => t.length >= 3)
      .slice(0, 6);

    if (keywords.length === 0) return [];

    // Attempt multi-keyword search first (most precise)
    const multiKeyQuery = keywords.slice(0, 3).join('%');
    const { data: multiData } = await this.supabase!
      .from(this.tableName)
      .select('codigo, descricao, unidade')
      .ilike('descricao', `%${multiKeyQuery}%`)
      .limit(10);

    const seen = new Set<string>();
    const candidates: CatmatItem[] = [];

    if (multiData) {
      for (const item of multiData) {
        if (!seen.has(item.codigo)) {
          seen.add(item.codigo);
          candidates.push({ codigo: item.codigo, descricao: item.descricao, unidade: item.unidade ?? null });
        }
      }
    }

    // Supplement with individual keyword searches when multi-keyword yields few results
    if (candidates.length < 5) {
      await Promise.all(
        keywords.slice(0, 4).map(async (term) => {
          const { data } = await this.supabase!
            .from(this.tableName)
            .select('codigo, descricao, unidade')
            .ilike('descricao', `%${term}%`)
            .limit(5);

          if (data) {
            for (const item of data) {
              if (!seen.has(item.codigo)) {
                seen.add(item.codigo);
                candidates.push({ codigo: item.codigo, descricao: item.descricao, unidade: item.unidade ?? null });
              }
            }
          }
        }),
      );
    }

    return candidates.slice(0, 15);
  }

  private async rankWithAI(
    description: string,
    candidates: CatmatItem[],
  ): Promise<{ match: CatmatItem | null; confidence: 'high' | 'medium' | 'low'; justification: string }> {
    const candidateList = candidates
      .map(
        (c, i) =>
          `${i + 1}. Código: ${c.codigo} | Descrição: ${c.descricao}${c.unidade ? ` | Unidade: ${c.unidade}` : ''}`,
      )
      .join('\n');

    const systemPrompt =
      `Você é um especialista em licitações e compras públicas brasileiras com profundo conhecimento do CATMAT ` +
      `(Catálogo de Materiais). Sua tarefa é identificar o código CATMAT mais adequado para uma descrição de ` +
      `material de compra pública.\n\n` +
      `Analise a descrição fornecida e escolha o candidato CATMAT mais adequado entre os listados. ` +
      `Responda APENAS com JSON válido no formato:\n` +
      `{"numero": <número do candidato 1-${candidates.length}>, "confianca": "<alta|media|baixa>", "justificativa": "<breve justificativa>"}`;

    try {
      const response = await this.openai!.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Descrição do material: "${description}"\n\nCandidatos CATMAT:\n${candidateList}`,
          },
        ],
        temperature: 0.1,
        max_tokens: 300,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content || '{}';
      const result = JSON.parse(content);
      const numero = parseInt(result.numero, 10);

      if (numero >= 1 && numero <= candidates.length) {
        const confidenceMap: Record<string, 'high' | 'medium' | 'low'> = {
          alta: 'high',
          media: 'medium',
          baixa: 'low',
        };
        return {
          match: candidates[numero - 1] ?? null,
          confidence: confidenceMap[result.confianca] ?? 'medium',
          justification: result.justificativa || '',
        };
      }
    } catch (error: any) {
      console.error('[CATMAT] Erro no ranqueamento por IA:', error.message);
    }

    // Graceful fallback: return first candidate with low confidence
    return {
      match: candidates[0] ?? null,
      confidence: 'low',
      justification: 'Não foi possível ranquear com IA. Retornando primeiro candidato encontrado.',
    };
  }
}
