import type { ProductResult } from './api/SerperService.js';
import type { PriceStats } from '../repositories/PriceHistoryRepository.js';

export interface OfferScore {
  price: number;
  score: number;
  flags: string[];
}

export class ScoreEngine {
  static calculateScore(offer: ProductResult, stats: PriceStats | null): OfferScore {
    let score = 100;
    const flags: string[] = [];

    if (!stats || stats.sample_count < 3) {
      // Not enough historical data to make a strong decision
      flags.push('POUCOS_DADOS_HISTORICOS');
      return { price: offer.price, score, flags };
    }

    // Price vs historical average (primary weight)
    const priceRatio = offer.price / stats.avg_price;
    
    if (priceRatio <= 0.85) {
      score += 30;
      flags.push('OPORTUNIDADE_ABAIXO_MEDIA');
    } else if (priceRatio <= 0.95) {
      score += 15;
      flags.push('ABAIXO_MEDIA');
    } else if (priceRatio >= 1.15) {
      score -= 30;
      flags.push('MUITO_CARO');
    }

    // Proximity to historical minimum
    if (offer.price <= stats.min_price * 1.05) {
      score += 20;
      flags.push('PROXIMO_MINIMO_HISTORICO');
    } else if (offer.price === stats.min_price) {
      score += 30;
      flags.push('NOVO_MINIMO_HISTORICO');
    }

    return { price: offer.price, score, flags };
  }
}
