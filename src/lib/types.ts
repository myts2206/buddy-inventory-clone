
export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  drr?: number; // Using PASD as DRR
  doc?: number; // Days of Coverage, using daysInvInHand
  target?: number; // Target stock level, using ctTargetInventory
  salesHistory?: { date: string; amount: number }[];
  
  // Excel data fields
  brand?: string;
  product?: string;
  variant?: string;
  asins?: string;
  gs1Code?: string;
  fsn?: string | number;
  vendorAMZ?: string;
  column1?: string;
  launchType?: string;
  vendor2?: string;
  fbaSales?: number;
  rkrzSale?: number;
  amazonSale?: number;
  amazonASD?: number;
  amazonGrowth?: number;
  maxDRR?: number;
  amazonPASD?: number;
  diff?: number;
  ctTargetInventory?: number;
  amazonInventory?: number;
  fba?: number;
  amazonDemand?: number;
  fkAlphaSales?: number;
  fkAlphaInv?: number;
  fkSales?: number;
  fbfInv?: number;
  fkSalesTotal?: number;
  fkInv?: number;
  fkASD?: number;
  fkGrowth?: number;
  maxDRR2?: number;
  fkPASD?: number;
  fkDemand?: number;
  otherMPSales?: number;
  qcPASD?: number;
  qcommerceDemand?: number;
  wh?: string | number;
  leadTime?: number; // in days
  orderFreq?: number;
  pasd?: number;
  mpDemand?: number;
  transit?: number;
  toOrder?: number;
  finalOrder?: any;
  remark?: any;
  daysInvInHand?: number;
  daysInvTotal?: number;
  
  // Inventory status flags
  isOverstock?: boolean;
  isLowStock?: boolean;
  
  // Bundle-related fields
  isBaseUnit?: boolean;
  baseUnitId?: string;
  packSize?: number;
  conversionMultiplier?: number;
  finalToOrderBaseUnits?: number;
  bundledSKUs?: string[];
}

export interface OrderSuggestion {
  productId: string;
  productName: string;
  currentStock: number;
  suggestedOrderQuantity: number;
  urgency: 'low' | 'medium' | 'high';
  priority?: 'P1' | 'P2' | 'P3';
  priorityColor?: string;
  reason: string;
  threshold?: number;
  isChineseVendor?: boolean;
  vendor: string;
  daysInvInHand: number;
  daysInvTotal: number;
  
  // Bundle-related fields
  isBaseUnit?: boolean;
  baseUnitName?: string;
  baseUnitSku?: string;
  packSize?: number;
  bundledSKUs?: string[];
  finalOrderQuantity?: number;
}

export const inventoryMetrics = {
  totalProducts: 0,
  totalValue: 0,
  lowStockItems: 0,
  outOfStockItems: 0,
  overstockItems: 0,  // Added overstock items count
  averageTurnoverRate: 0,
  avgDRR: 0,
  avgDOC: 0,
  targetAchievement: 0,
  inventoryHealthScore: 0,
  totalTransit: 0,
  totalToOrder: 0,
  avgPASD: 0,
  overstockRate: 0,  // Added overstock rate
  stockoutRate: 0    // Added stockout rate for clarity
};

export const monthlyDemandData = [
  { month: 'Dec', value: 0 },
  { month: 'Jan', value: 0 },
  { month: 'Feb', value: 0 },
  { month: 'Mar', value: 0 },
  { month: 'Apr', value: 0 },
  { month: 'May', value: 0 },
];
