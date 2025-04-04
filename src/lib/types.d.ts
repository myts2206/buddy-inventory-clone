
// Add this to your existing types.d.ts file
export interface inventoryMetrics {
  totalProducts: number;
  itemsInTransit: number;
  totalInTransit: number;
  lowStockItems: number;
  overstockItems: number;
}
