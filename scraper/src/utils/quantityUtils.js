/**
 * Utility for extracting and matching product quantity/size from query strings.
 * e.g. "Cetaphil Cleanser 250ml" → extracts "250ml"
 * Used by all platform handlers to prefer exact quantity matches.
 */

/**
 * Extracts a quantity token from a query string.
 * Matches formats like: 250ml, 500g, 1L, 125gm, 200GM, 1kg, 100 ml (with space)
 * Returns lowercase token or null if none found.
 */
export function extractQuantity(str) {
  if (!str) return null;
  const match = str.match(/(\d+(?:\.\d+)?)\s*(ml|l|g|gm|gms|kg|oz|fl\.?oz)\b/i);
  if (!match) return null;
  // Normalize: "500 ml" → "500ml", "500ML" → "500ml"
  return (match[1] + match[2].toLowerCase().replace(/\s+/g, '')).toLowerCase();
}

/**
 * Given a list of scraped items and the original query, picks the best match:
 * 1. Exact quantity match in title (e.g. title contains "250ml" when query has "250ml")
 * 2. Fallback: first item whose title contains the main brand keyword
 * 3. Last resort: first item
 *
 * Returns: { item, quantityMismatch: boolean, requestedQty: string|null, foundQty: string|null }
 */
export function pickBestMatch(items, query) {
  const requestedQty = extractQuantity(query);
  const mainKeyword = query.toLowerCase().split(' ')[0];

  if (!requestedQty) {
    // No quantity in query — just pick by brand keyword
    const item = items.find(i => i.title.toLowerCase().includes(mainKeyword)) || items[0];
    return { item, quantityMismatch: false, requestedQty: null, foundQty: extractQuantity(item.title) };
  }

  // Try to find an item whose title contains the exact quantity string
  const exactMatch = items.find(i => {
    const titleQty = extractQuantity(i.title);
    return titleQty === requestedQty;
  });

  if (exactMatch) {
    return { item: exactMatch, quantityMismatch: false, requestedQty, foundQty: requestedQty };
  }

  // No exact quantity match — fallback by brand keyword, then first item
  const fallback = items.find(i => i.title.toLowerCase().includes(mainKeyword)) || items[0];
  const foundQty = extractQuantity(fallback.title);

  return { item: fallback, quantityMismatch: true, requestedQty, foundQty };
}
