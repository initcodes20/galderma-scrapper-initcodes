export const PriceUtils = {
  clean: (priceString) => {
    if (!priceString) return null;
    const cleaned = priceString.replace(/[^\d.]/g, "");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  }
};
