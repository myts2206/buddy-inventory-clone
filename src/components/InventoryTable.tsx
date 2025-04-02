
import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Product } from '@/lib/types';
import { MoreHorizontal, Filter, AlertTriangle, ArrowUp } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useData } from '@/contexts/DataContext';
import ProductDetailModal from './ProductDetailModal';
import { useIsMobile } from '@/hooks/use-mobile';

interface InventoryTableProps {
  products: Product[];
  isOverview?: boolean;
}

const InventoryTable = ({ products, isOverview = false }: InventoryTableProps) => {
  const [viewMode, setViewMode] = useState<'standard' | 'expanded'>(isOverview ? 'standard' : 'expanded');
  const { getLowStockItems, getOverstockItems } = useData();
  const lowStockItems = getLowStockItems();
  const overstockItems = getOverstockItems();
  const isMobile = useIsMobile();
  
  // Add state for the detail modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // Create sets for quick lookups
  const lowStockIds = new Set(lowStockItems.map(product => product.id));
  const overstockIds = new Set(overstockItems.map(product => product.id));
  
  // Helper functions to check product status
  const isLowStockByFormula = (product: Product) => {
    return lowStockIds.has(product.id);
  };
  
  const isOverstockByFormula = (product: Product) => {
    return overstockIds.has(product.id);
  };
  
  // Function to open the product detail modal
  const openProductDetail = (product: Product) => {
    setSelectedProduct(product);
    setIsDetailModalOpen(true);
  };
  
  // Handle modal closing properly
  const handleModalClose = () => {
    setIsDetailModalOpen(false);
    // Small delay to prevent UI glitches
    setTimeout(() => {
      setSelectedProduct(null);
    }, 300);
  };
  
  // Get columns based on the view mode
  const getColumns = () => {
    if (isMobile) {
      // Mobile view shows fewer columns
      return [
        { key: 'name', label: 'Product', className: 'font-medium' },
        { key: 'wh', label: 'WH', align: 'right' },
        { key: 'pasd', label: 'PASD', align: 'right' },
        { key: 'actions', label: '', align: 'right' },
      ];
    }
    
    if (isOverview) {
      // For overview, only show the specified columns
      return [
        { key: 'name', label: 'Product Name', className: 'font-medium' },
        { key: 'sku', label: 'SKU' },
        { key: 'pasd', label: 'PASD', align: 'right' },
        { key: 'mpDemand', label: 'MP Demand', align: 'right' },
        { key: 'transit', label: 'Transit', align: 'right' },
        { key: 'toOrder', label: 'To Order', align: 'right' },
        { key: 'status', label: 'Status', align: 'right' },
        { key: 'actions', label: '', align: 'right' },
      ];
    }
    
    if (viewMode === 'standard') {
      // Standard view shows important columns
      return [
        { key: 'name', label: 'Product Name', className: 'font-medium' },
        { key: 'brand', label: 'Brand' },
        { key: 'wh', label: 'Warehouse', align: 'right' },
        { key: 'target', label: 'Target', align: 'right' },
        { key: 'status', label: 'Status', align: 'right' },
        { key: 'leadTime', label: 'Lead Time', align: 'right' },
        { key: 'pasd', label: 'PASD', align: 'right' },
        { key: 'actions', label: '', align: 'right' },
      ];
    } else {
      // Extended view shows all columns
      return [
        { key: 'brand', label: 'Brand' },
        { key: 'product', label: 'Product' },
        { key: 'variant', label: 'Variant' },
        { key: 'name', label: 'Product Name', className: 'font-medium' },
        { key: 'asins', label: 'ASINs' },
        { key: 'gs1Code', label: 'GS1 CODE' },
        { key: 'sku', label: 'SKU' },
        { key: 'fsn', label: 'FSN' },
        { key: 'vendorAMZ', label: 'Vendor AMZ' },
        { key: 'column1', label: 'Column1' },
        { key: 'launchType', label: 'Launch Type' },
        { key: 'vendor2', label: 'Vendor2' },
        { key: 'fbaSales', label: 'FBA Sales', align: 'right' },
        { key: 'rkrzSale', label: 'RK/RZ Sale', align: 'right' },
        { key: 'amazonSale', label: 'Amazon sale', align: 'right' },
        { key: 'amazonASD', label: 'Amazon ASD', align: 'right' },
        { key: 'amazonGrowth', label: 'Amazon Growth', align: 'right' },
        { key: 'maxDRR', label: 'Max DRR', align: 'right' },
        { key: 'amazonPASD', label: 'Amazon PASD', align: 'right' },
        { key: 'diff', label: 'Diff', align: 'right' },
        { key: 'ctTargetInventory', label: 'CT target inventory', align: 'right' },
        { key: 'amazonInventory', label: 'Amazon Inventory', align: 'right' },
        { key: 'fba', label: 'FBA', align: 'right' },
        { key: 'amazonDemand', label: 'Amazon Demand', align: 'right' },
        { key: 'fkAlphaSales', label: 'FK Alpha Sales', align: 'right' },
        { key: 'fkAlphaInv', label: 'FK Alpha Inv', align: 'right' },
        { key: 'fkSales', label: 'FK Sales', align: 'right' },
        { key: 'fbfInv', label: 'FBF Inv', align: 'right' },
        { key: 'fkSalesTotal', label: 'FK Sales total', align: 'right' },
        { key: 'fkInv', label: 'FK Inv', align: 'right' },
        { key: 'fkASD', label: 'FK ASD', align: 'right' },
        { key: 'fkGrowth', label: 'FK Growth', align: 'right' },
        { key: 'maxDRR2', label: 'Max DRR2', align: 'right' },
        { key: 'fkPASD', label: 'FK PASD', align: 'right' },
        { key: 'fkDemand', label: 'FK Demand', align: 'right' },
        { key: 'otherMPSales', label: 'Other MP Sales', align: 'right' },
        { key: 'qcPASD', label: 'QC PASD', align: 'right' },
        { key: 'qcommerceDemand', label: 'Qcommerce Demand', align: 'right' },
        { key: 'wh', label: 'WH', align: 'right' },
        { key: 'leadTime', label: 'Lead Time', align: 'right' },
        { key: 'orderFreq', label: 'Order Frequ', align: 'right' },
        { key: 'pasd', label: 'PASD', align: 'right' },
        { key: 'mpDemand', label: 'MP Demand', align: 'right' },
        { key: 'transit', label: 'Transit', align: 'right' },
        { key: 'toOrder', label: 'To Order', align: 'right' },
        { key: 'finalOrder', label: 'Final Order', align: 'right' },
        { key: 'remark', label: 'Remark' },
        { key: 'daysInvInHand', label: 'No.of days inv inhand', align: 'right' },
        { key: 'daysInvTotal', label: 'No.of days inv total', align: 'right' },
        { key: 'status', label: 'Status', align: 'right' },
        { key: 'actions', label: '', align: 'right' },
      ];
    }
  };
  
  const columns = getColumns();
  
  const renderCellValue = (product: any, column: { key: string; label: string; align?: string; className?: string }) => {
    const key = column.key;
    
    // Special handling for certain columns
    switch (key) {
      case 'status':
        // Check product status
        const isLowStock = isLowStockByFormula(product);
        const isOverstock = isOverstockByFormula(product);
        
        let status;
        let statusColor;
        let icon = null;
        
        if (isLowStock) {
          status = 'Low Stock (PASD)';
          statusColor = 'text-red-500';
          icon = <AlertTriangle className="h-3 w-3 mr-1" />;
        } else if (isOverstock) {
          status = 'Overstock';
          statusColor = 'text-blue-500';
          icon = <ArrowUp className="h-3 w-3 mr-1" />;
        } else {
          status = 'In Stock';
          statusColor = 'text-green-500';
        }
        
        return (
          <div className="flex items-center justify-end">
            {icon}
            <span className={statusColor}>{status}</span>
          </div>
        );
        
      case 'actions':
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openProductDetail(product)}>
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem>Edit Product</DropdownMenuItem>
              <DropdownMenuItem>Order Stock</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
        
      default:
        // For numeric values, round to the nearest integer
        if (typeof product[key] === 'number') {
          return Math.round(product[key]);
        }
        return product[key] !== undefined ? product[key] : '-';
    }
  };
  
  return (
    <div className="rounded-md border animate-fade-in">
      <div className="flex items-center justify-between p-4">
        <h3 className="text-lg font-medium">Inventory Overview</h3>
        
        {!isOverview && !isMobile && (
          <div className="flex items-center gap-2">
            <Select
              value={viewMode}
              onValueChange={(value: 'standard' | 'expanded') => setViewMode(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select view" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard View</SelectItem>
                <SelectItem value="expanded">Expanded View</SelectItem>
              </SelectContent>
            </Select>
            
            <Button size="sm" variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
        )}
      </div>
      
      <ScrollArea className="h-[calc(100vh-300px)]">
        <div className="w-full">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead 
                    key={column.key} 
                    className={column.align === 'right' ? 'text-right' : ''}
                  >
                    {column.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const isLowStock = isLowStockByFormula(product);
                const isOverstock = isOverstockByFormula(product);
                
                let rowClassName = 'animate-fade-up';
                if (isLowStock) {
                  rowClassName += ' bg-red-50 hover:bg-red-100';
                } else if (isOverstock) {
                  rowClassName += ' bg-blue-50 hover:bg-blue-100';
                }
                
                return (
                  <TableRow 
                    key={product.id} 
                    className={rowClassName}
                  >
                    {columns.map((column) => (
                      <TableCell 
                        key={`${product.id}-${column.key}`} 
                        className={`${column.align === 'right' ? 'text-right' : ''} ${column.className || ''}`}
                      >
                        {renderCellValue(product, column)}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
              
              {products.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No products found. Please upload your inventory data.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </ScrollArea>
      
      {/* Product Detail Modal */}
      <ProductDetailModal 
        product={selectedProduct}
        isOpen={isDetailModalOpen}
        onClose={handleModalClose}
      />
    </div>
  );
};

export default InventoryTable;
