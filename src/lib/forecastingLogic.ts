
import { Product } from './types';

/**
 * Calculates forecasted sales based on historical data and current inventory
 */
export const calculateForecast = (products: Product[], days: number = 90) => {
  // Filter out products without necessary data
  const validProducts = products.filter(product => 
    product.pasd !== undefined && 
    product.wh !== undefined
  );
  
  // Generate forecast points based on available data
  return Array.from({ length: days }).map((_, i) => {
    const day = i + 1;
    
    // Sum up the predicted stock levels for all products
    let totalStock = validProducts.reduce((sum, product) => {
      // Calculate current stock
      const currentStock = typeof product.wh === 'string' ? parseFloat(product.wh) : (product.wh || 0);
      
      // Use PASD (Per Average Sales per Day) if available
      const dailyConsumption = product.pasd || 0;
      
      // Calculate predicted stock level for this day
      const predictedStock = Math.max(0, currentStock - (dailyConsumption * day));
      
      return sum + predictedStock;
    }, 0);
    
    return {
      day,
      stock: Math.round(totalStock),
    };
  });
};

/**
 * Calculates the reorder suggestions for products
 */
export const calculateReorderSuggestions = (products: Product[]) => {
  // Filter products that have the necessary data
  return products.filter(product => {
    const leadTime = product.leadTime;
    const pasd = product.pasd;
    const warehouseStock = typeof product.wh === 'string' ? parseFloat(product.wh) : product.wh;
    
    // Skip products without the required data
    if (leadTime === undefined || pasd === undefined || warehouseStock === undefined) {
      return false;
    }
    
    // Check if stock is below reorder point
    const reorderPoint = pasd * leadTime * 1.5; // Add 50% safety stock
    return warehouseStock < reorderPoint;
  }).map(product => {
    const leadTime = product.leadTime || 0;
    const pasd = product.pasd || 0;
    const warehouseStock = typeof product.wh === 'string' ? parseFloat(product.wh) : (product.wh || 0);
    
    // Calculate recommended reorder quantity
    // Formula: (PASD * Lead Time * 2) - Current Stock
    const reorderQuantity = Math.max(0, Math.ceil((pasd * leadTime * 2) - warehouseStock));
    
    return {
      ...product,
      reorderQuantity
    };
  }).sort((a, b) => b.reorderQuantity - a.reorderQuantity); // Sort by reorder quantity (highest first)
};
