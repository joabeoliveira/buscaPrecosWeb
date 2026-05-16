export class TextMatcher {
  /**
   * Calculates the Jaccard Similarity between two strings.
   * A score of 0 means completely different, 1 means identical.
   */
  static calculateJaccardSimilarity(str1: string, str2: string): number {
    const normalize = (s: string) => 
      s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s]/gi, '').split(/\s+/).filter(w => w.length > 0);
      
    const tokens1 = normalize(str1);
    const tokens2 = normalize(str2);

    const set1 = new Set(tokens1);
    const set2 = new Set(tokens2);

    if (set1.size === 0 && set2.size === 0) return 1.0;
    if (set1.size === 0 || set2.size === 0) return 0.0;

    let intersectionCount = 0;
    for (const token of set1) {
      if (set2.has(token)) {
        intersectionCount++;
      }
    }

    const unionCount = set1.size + set2.size - intersectionCount;

    return intersectionCount / unionCount;
  }

  /**
   * Filters a list of items based on a minimum similarity score compared to the query.
   * Default threshold is 0.15 (at least 15% similarity in words).
   * We use a low threshold because technical specs or quantities might add many words to titles.
   */
  static filterBySimilarity<T extends { title: string }>(query: string, items: T[], threshold: number = 0.15): T[] {
    return items.filter(item => {
      const score = this.calculateJaccardSimilarity(query, item.title);
      // We also check if the score is at least the threshold, OR if it contains the exact query string
      const containsExact = item.title.toLowerCase().includes(query.toLowerCase());
      return score >= threshold || containsExact;
    });
  }
}
