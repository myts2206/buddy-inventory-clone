
import { Product } from './types';

/**
 * Extracts pack size from variant name
 * @param variant e.g. "60 Tablets", "120 Capsules"
 * @returns number representing pack size
 */
export const extractPackSize = (variant?: string): number => {
  if (!variant) return 0;
  
  // Extract the first number in the string
  const match = variant.match(/\d+/);
  if (match) {
    return parseInt(match[0], 10);
  }
  
  return 0;
};

/**
 * Checks if a product is overstocked
 * @param product Product to check
 * @returns boolean indicating if product is overstocked
 */
export const isProductOverstocked = (product: Product): boolean => {
  const warehouseStock = typeof product.wh === 'string' ? parseFloat(product.wh) : (product.wh || 0);
  const pasd = product.pasd || 0;
  const orderFreq = product.orderFreq || 1; // Default to 1 if not provided
  
  // A product is considered overstock if WH > PASD * Order Frequency * 1.5
  return warehouseStock > (pasd * orderFreq * 1.5);
};

/**
 * Calculate bundling information for a list of products
 */
export const calculateBundleInformation = (products: Product[]): Product[] => {
  // Group products by their 'product' name
  const productGroups: Record<string, Product[]> = {};
  
  // First pass: Group products and extract pack sizes
  products.forEach(product => {
    const productName = product.product || '';
    if (!productName) return;
    
    if (!productGroups[productName]) {
      productGroups[productName] = [];
    }
    
    // Extract pack size from variant
    const packSize = extractPackSize(product.variant);
    
    // Determine if product is overstocked
    const isOverstock = isProductOverstocked(product);
    
    // Clone the product and add pack size and overstock status
    productGroups[productName].push({
      ...product,
      packSize,
      isOverstock
    });
  });
  
  // Second pass: Find base units and calculate conversion multipliers
  const productsWithBundleInfo: Product[] = [];
  
  Object.values(productGroups).forEach(group => {
    // Skip singleton groups or groups without valid pack sizes
    if (group.length <= 1 || !group.some(p => p.packSize && p.packSize > 0)) {
      productsWithBundleInfo.push(...group);
      return;
    }
    
    // Find the base unit (smallest pack size)
    const validProducts = group.filter(p => p.packSize && p.packSize > 0);
    
    if (validProducts.length === 0) {
      productsWithBundleInfo.push(...group);
      return;
    }
    
    const baseUnit = validProducts.reduce((min, current) => 
      (current.packSize! < min.packSize!) ? current : min, validProducts[0]);
    
    const basePackSize = baseUnit.packSize || 1;
    const baseUnitId = baseUnit.id;
    
    // Track which SKUs are bundled with this base unit
    const bundledSKUs: string[] = [];
    
    // Calculate conversion multipliers
    const enhancedGroup = group.map(product => {
      const packSize = product.packSize || 0;
      let conversionMultiplier = 1;
      let isBaseUnit = false;
      
      if (product.id === baseUnitId) {
        isBaseUnit = true;
      } else if (packSize > 0 && basePackSize > 0) {
        conversionMultiplier = Math.ceil(packSize / basePackSize);
        bundledSKUs.push(product.sku || product.id);
      }
      
      return {
        ...product,
        isBaseUnit,
        baseUnitId,
        conversionMultiplier,
        packSize,
      };
    });
    
    // Calculate final to order base units for the whole group
    let finalToOrderBaseUnits = 0;
    
    enhancedGroup.forEach(product => {
      // Calculate to order as: MP Demand - Transit - WH
      const mpDemand = product.mpDemand || 0;
      const transit = product.transit || 0;
      const wh = typeof product.wh === 'string' ? parseFloat(product.wh) : (product.wh || 0);
      
      // Important: Allow negative values in toOrder calculation
      let toOrder = mpDemand - transit - wh;
      
      // For base unit, we include its To Order value directly
      if (product.isBaseUnit) {
        finalToOrderBaseUnits += toOrder;
      } 
      // For other variants, we multiply their To Order by conversion multiplier
      else if (product.conversionMultiplier && product.conversionMultiplier > 0) {
        finalToOrderBaseUnits += toOrder * product.conversionMultiplier;
      }
    });
    
    // Update the base unit with the final order quantity and bundled SKUs
    const finalGroup = enhancedGroup.map(product => {
      if (product.isBaseUnit) {
        return {
          ...product,
          finalToOrderBaseUnits,
          bundledSKUs,
        };
      }
      return product;
    });
    
    productsWithBundleInfo.push(...finalGroup);
  });
  
  return productsWithBundleInfo;
};
