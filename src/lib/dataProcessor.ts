
import { Product, inventoryMetrics } from './types';
import { v4 as uuidv4 } from 'uuid';
import { safeNumber, exists } from './utils';

/**
 * Processes uploaded Excel data into the application's Product format
 */
export const processUploadedData = (data: any[]): Product[] => {
  console.log('Starting data processing');
  
  if (!Array.isArray(data) || data.length === 0) {
    console.error('No valid data to process');
    return [];
  }
  
  return data.map(item => {
    const id = uuidv4().substring(0, 8);

    try {
      // Updated normalization logic with better type checking
      const normalizedItem: any = {};
      
      // Safely normalize keys
      Object.keys(item).forEach(key => {
        if (key !== null && key !== undefined) {
          // Ensure the key is a string before calling toLowerCase
          const keyStr = String(key);
          const cleanKey = keyStr.replace(/\n|\s|_/g, '').toLowerCase();
          normalizedItem[cleanKey] = item[key];
        }
      });

      // Updated extractField function with more robust type handling
      const extractField = (fieldName: string, aliases: string[] = []): any => {
        // Ensure we're working with strings
        const normalize = (str: any): string => {
          if (str === null || str === undefined) return '';
          return String(str).replace(/\s|_/g, '').toLowerCase();
        };
        
        const normalizedFieldName = normalize(fieldName);
        const allKeys = [normalizedFieldName, ...aliases.map(normalize)];

        if (normalizedFieldName === 'leadtime') {
          allKeys.push('reordertime', 'lt');
        }

        for (const key of allKeys) {
          if (normalizedItem[key] !== undefined) {
            return normalizedItem[key];
          }
        }

        return undefined;
      };

      // Set up an empty sales history array - not generating fake data
      const salesHistory: { date: string; amount: number }[] = [];

      // Extract all fields directly from Excel without adding defaults
      const brand = extractField('brand');
      const product = extractField('product');
      const variant = extractField('variant');
      const productName = extractField('productname', ['product name', 'name']);
      const asins = extractField('asins');
      const gs1Code = extractField('gs1code', ['gs1 code']);
      const sku = extractField('sku', ['skuid', 'productid']);
      const fsn = extractField('fsn');
      const vendorAMZ = extractField('vendoramz', ['vendor amz']);
      const column1 = extractField('column1');
      const launchType = extractField('launchtype', ['launch type']);
      const vendor2 = extractField('vendor2');
      const fbaSales = extractField('fbasales', ['fba sales']);
      const rkrzSale = extractField('rkrzsale', ['rk/rz sale']);
      const amazonSale = extractField('amazonsale', ['amazon sale']);
      const amazonASD = extractField('amazonasd', ['amazon asd']);
      const amazonGrowth = extractField('amazongrowth', ['amazon growth']);
      const maxDRR = extractField('maxdrr', ['max drr']);
      const amazonPASD = extractField('amazonpasd', ['amazon pasd']);
      const diff = extractField('diff');
      const ctTargetInventory = extractField('cttargetinventory', ['ct target inventory']);
      const amazonInventory = extractField('amazoninventory', ['amazon inventory']);
      const fba = extractField('fba');
      const amazonDemand = extractField('amazondemand', ['amazon demand']);
      const fkAlphaSales = extractField('fkalphasales', ['fk alpha sales']);
      const fkAlphaInv = extractField('fkalphainv', ['fk alpha inv']);
      const fkSales = extractField('fksales', ['fk sales']);
      const fbfInv = extractField('fbfinv', ['fbf inv']);
      const fkSalesTotal = extractField('fksalestotal', ['fk sales total']);
      const fkInv = extractField('fkinv', ['fk inv']);
      const fkASD = extractField('fkasd', ['fk asd']);
      const fkGrowth = extractField('fkgrowth', ['fk growth']);
      const maxDRR2 = extractField('maxdrr2', ['max drr2']);
      const fkPASD = extractField('fkpasd', ['fk pasd']);
      const fkDemand = extractField('fkdemand', ['fk demand']);
      const otherMPSales = extractField('othermpsales', ['other mp sales']);
      const qcPASD = extractField('qcpasd', ['qc pasd']);
      const qcommerceDemand = extractField('qcommercedemand', ['qcommerce demand']);
      const wh = extractField('wh');

      let leadTime = extractField('leadtime', ['Lead Time']);

      // Better parsing of leadTime from string values
      if (leadTime !== undefined && typeof leadTime === 'string') {
        const parsedLeadTime = parseInt(leadTime.trim(), 10);
        if (!isNaN(parsedLeadTime)) leadTime = parsedLeadTime;
      }

      const orderFreq = extractField('orderfreq', ['order frequ']);
      const pasd = extractField('pasd');
      const mpDemand = extractField('mpdemand', ['mp demand']);
      const transit = extractField('transit');
      const toOrder = extractField('toorder', ['to order']);
      const finalOrder = extractField('finalorder', ['final order']);
      const remark = extractField('remark');
      const daysInvInHand = extractField('daysinvinhand', ['no.of days inv inhand']);
      const daysInvTotal = extractField('daysinvtotal', ['no.of days inv total']);

      // Derive DOC and DRR from the dataset values - safely using safeNumber
      const drr = pasd !== undefined ? safeNumber(pasd, 0) : undefined;
      const doc = daysInvInHand !== undefined ? safeNumber(daysInvInHand, 0) : undefined;
      const target = ctTargetInventory !== undefined ? safeNumber(ctTargetInventory, 0) : undefined;

      return {
        id,
        name: productName || `${brand || ''} ${product || ''} ${variant || ''}`.trim() || `Product ${id}`,
        sku: sku || `SKU-${id}`,
        category: extractField('category', ['productcategory']) || 'Uncategorized',
        // Only include fields that are in the Excel
        salesHistory,
        brand,
        product,
        variant,
        asins,
        gs1Code,
        fsn,
        vendorAMZ,
        column1,
        launchType,
        vendor2,
        fbaSales,
        rkrzSale,
        amazonSale,
        amazonASD,
        amazonGrowth,
        maxDRR,
        amazonPASD,
        diff,
        ctTargetInventory,
        amazonInventory,
        fba,
        amazonDemand,
        fkAlphaSales,
        fkAlphaInv,
        fkSales,
        fbfInv,
        fkSalesTotal,
        fkInv,
        fkASD,
        fkGrowth,
        maxDRR2,
        fkPASD,
        fkDemand,
        otherMPSales,
        qcPASD,
        qcommerceDemand,
        wh,
        leadTime,
        orderFreq,
        pasd,
        mpDemand,
        transit,
        toOrder,
        finalOrder,
        remark,
        daysInvInHand,
        daysInvTotal,
        // Include derived fields for the dashboard
        drr,
        doc,
        target
      };
    } catch (error) {
      console.error('Error processing item:', error, item);
      // Return a minimal valid product to prevent dashboard crashes
      return {
        id,
        name: `Product ${id}`,
        sku: `SKU-${id}`,
        category: 'Error',
        salesHistory: []
      };
    }
  });
};

/**
 * Calculate aggregated inventory metrics from product data
 */
export const calculateInventoryMetrics = (products: Product[]) => {
  try {
    // Safeguard against empty products array
    if (!Array.isArray(products) || products.length === 0) {
      console.log('No products provided for metrics calculation');
      return { ...inventoryMetrics };
    }
    
    // Calculate low stock items using the same logic as in DataContext's getLowStockItems
    const lowStockItems = products.filter(product => {
      try {
        const pasd = safeNumber(product.pasd, 0);
        const leadTime = safeNumber(product.leadTime, 0);
        const transitTime = safeNumber(product.transit, 0);
        
        if (pasd <= 0 || leadTime <= 0) {
          return false;
        }
        
        // Calculate available inventory using only what's in the dataset
        const warehouseStock = safeNumber(product.wh, 0);
        const fbaStock = safeNumber(product.fba, 0);
        
        // Calculate available inventory (WH + FBA)
        const availableInventory = warehouseStock + fbaStock;
        
        // Calculate low stock threshold: PASD × (Lead Time + Transit Time)
        const lowStockThreshold = pasd * (leadTime + transitTime);
        
        // Flag if available inventory is below threshold and the threshold is valid
        return lowStockThreshold > 0 && availableInventory < lowStockThreshold;
      } catch (error) {
        console.error('Error calculating low stock status for product:', error, product);
        return false;
      }
    }).length;
    
    const totalProducts = products.length;
    
    // Calculate metrics using only available data
    const totalValue = products.reduce((sum, product) => {
      try {
        if (product.wh === undefined) return sum;
        return sum + safeNumber(product.wh, 0);
      } catch (error) {
        console.error('Error calculating total value:', error);
        return sum;
      }
    }, 0);
    
    // Count out-of-stock items
    const outOfStockItems = products.filter(product => {
      try {
        return safeNumber(product.wh, -1) === 0;
      } catch (error) {
        console.error('Error checking out of stock status:', error);
        return false;
      }
    }).length;
    
    // Only calculate metrics using products with necessary data
    const validProducts = products.filter(p => {
      try {
        const whValue = safeNumber(p.wh, -1);
        const pasdValue = safeNumber(p.pasd, 0);
        return whValue >= 0 && pasdValue > 0;
      } catch (error) {
        console.error('Error validating product for metrics:', error);
        return false;
      }
    });
    
    // Calculate average DRR using only products with PASD values
    const drrProducts = products.filter(p => safeNumber(p.pasd, 0) > 0);
    const avgDRR = drrProducts.length > 0 
      ? drrProducts.reduce((sum, product) => {
          try {
            return sum + safeNumber(product.pasd, 0);
          } catch (error) {
            console.error('Error calculating avg DRR:', error);
            return sum;
          }
        }, 0) / drrProducts.length 
      : 0;
    
    // Calculate average DOC using only products with DOC or necessary calculation values
    const docProducts = products.filter(p => {
      try {
        if (safeNumber(p.daysInvInHand, -1) >= 0) return true;
        
        const whValue = safeNumber(p.wh, -1);
        const pasdValue = safeNumber(p.pasd, 0);
        return whValue >= 0 && pasdValue > 0;
      } catch (error) {
        console.error('Error validating product for DOC calculation:', error);
        return false;
      }
    });
    
    const avgDOC = docProducts.length > 0
      ? docProducts.reduce((sum, product) => {
          try {
            if (safeNumber(product.daysInvInHand, -1) >= 0) 
              return sum + safeNumber(product.daysInvInHand, 0);
            
            const whValue = safeNumber(product.wh, 0);
            const pasdValue = safeNumber(product.pasd, 0);
            if (pasdValue > 0) {
              return sum + (whValue / pasdValue);
            }
            return sum;
          } catch (error) {
            console.error('Error calculating avg DOC:', error);
            return sum;
          }
        }, 0) / docProducts.length
      : 0;
    
    // Count items with inventory in transit
    const itemsInTransit = products.filter(product => 
      safeNumber(product.transit, 0) > 0
    ).length;
    
    // Sum total transit inventory
    const totalTransit = products.reduce((sum, product) => {
      try {
        return sum + safeNumber(product.transit, 0);
      } catch (error) {
        console.error('Error calculating total transit:', error);
        return sum;
      }
    }, 0);
    
    // Count items needing to be ordered
    const itemsToOrder = products.filter(product => 
      safeNumber(product.toOrder, 0) > 0
    ).length;
    
    // Sum total to order quantities
    const totalToOrder = products.reduce((sum, product) => {
      try {
        return sum + safeNumber(product.toOrder, 0);
      } catch (error) {
        console.error('Error calculating total to order:', error);
        return sum;
      }
    }, 0);
    
    // Calculate average PASD from products with PASD values
    const pasdProducts = products.filter(p => safeNumber(p.pasd, 0) > 0);
    const avgPASD = pasdProducts.length > 0
      ? pasdProducts.reduce((sum, product) => {
          try {
            return sum + safeNumber(product.pasd, 0);
          } catch (error) {
            console.error('Error calculating avg PASD:', error);
            return sum;
          }
        }, 0) / pasdProducts.length
      : 0;
    
    // Calculate target achievement percentage - only for products with both target and currentStock
    const productsWithTarget = products.filter(p => {
      try {
        const targetValue = safeNumber(p.ctTargetInventory, 0);
        return targetValue > 0 && p.wh !== undefined;
      } catch (error) {
        console.error('Error validating product for target achievement:', error);
        return false;
      }
    });
    
    const targetAchievement = productsWithTarget.length > 0
      ? productsWithTarget.reduce((sum, product) => {
          try {
            const whValue = safeNumber(product.wh, 0);
            const targetValue = safeNumber(product.ctTargetInventory, 0);
            return sum + (whValue >= targetValue ? 1 : 0);
          } catch (error) {
            console.error('Error calculating target achievement:', error);
            return sum;
          }
        }, 0) / productsWithTarget.length * 100
      : 0;
    
    // Calculate inventory health score using available metrics
    const stockoutRisk = totalProducts > 0 ? (lowStockItems / totalProducts) * 100 : 0;
    const inventoryEfficiency = (100 - (stockoutRisk * 0.5) + (targetAchievement * 0.3) + (avgDRR * 10)) / 1.8;
    const inventoryHealthScore = Math.round(Math.min(Math.max(inventoryEfficiency, 0), 100));
    
    return {
      totalProducts,
      totalValue,
      lowStockItems,
      outOfStockItems,
      averageTurnoverRate: 0, // Not calculating without sales history
      avgDRR,
      avgDOC,
      targetAchievement,
      inventoryHealthScore,
      totalTransit,
      itemsInTransit, 
      totalToOrder,
      itemsToOrder,
      avgPASD
    };
  } catch (error) {
    console.error('Error calculating inventory metrics:', error);
    // Return default metrics to prevent dashboard crashes
    return { ...inventoryMetrics };
  }
};
