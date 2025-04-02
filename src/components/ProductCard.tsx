
import React from 'react';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Box, BarChart2, TrendingUp, ArrowUp } from 'lucide-react';
import { Product } from '@/lib/types';
import ProductDetailModal from './ProductDetailModal';
import { isProductOverstocked } from '@/lib/bundleCalculator';

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false);

  // Calculate stock percentage based on warehouse stock vs target
  const stockLevel = () => {
    // Get warehouse stock
    const warehouseStock = typeof product.wh === 'number' ? product.wh : 
                          typeof product.wh === 'string' ? parseFloat(product.wh) : 0;
    
    // Get target stock from CT target inventory
    const targetStock = product.ctTargetInventory || 0;
    
    // Calculate percentage
    if (targetStock <= 0) return 0;
    return Math.min(Math.round((warehouseStock / targetStock) * 100), 100);
  };

  // Check if product is overstocked: WH > PASD * Order Frequency * 1.5
  const isOverstocked = isProductOverstocked(product);

  // Get stock status
  const getStockStatus = () => {
    // First check for overstock
    if (isOverstocked) {
      return {
        label: 'Overstock',
        color: 'bg-blue-500',
        icon: <ArrowUp className="h-3 w-3 mr-1" />
      };
    }
    
    // Then check using toOrder from Excel
    if (product.toOrder && product.toOrder > 0) {
      return {
        label: 'Order Required',
        color: 'bg-yellow-500',
        icon: <AlertTriangle className="h-3 w-3 mr-1" />
      };
    }
    
    // Then check using days inventory in hand
    if (product.daysInvInHand !== undefined) {
      if (product.daysInvInHand < 7) {
        return {
          label: 'Low Stock',
          color: 'bg-red-500',
          icon: <AlertTriangle className="h-3 w-3 mr-1" />
        };
      }
    }
    
    return {
      label: 'In Stock',
      color: 'bg-green-500',
      icon: null
    };
  };

  const status = getStockStatus();
  const stockPercentage = stockLevel();
  
  return (
    <>
      <Card className="overflow-hidden transition-all hover:shadow-md">
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h3 className="font-bold">{product.name}</h3>
              <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
            </div>
            <Badge 
              variant="outline" 
              className={`${status.color} text-white border-0`}
            >
              {status.icon}
              {status.label}
            </Badge>
          </div>
          
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Warehouse Stock</span>
                <span className="font-semibold">{product.wh || 0}</span>
              </div>
              {product.ctTargetInventory && (
                <>
                  <Progress value={stockPercentage} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0</span>
                    <span>Target: {product.ctTargetInventory}</span>
                  </div>
                </>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <div className="flex items-center text-xs text-muted-foreground">
                  <Box className="h-3 w-3 mr-1" />
                  <span>In Transit</span>
                </div>
                <p className="font-medium">{product.transit || 0}</p>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center text-xs text-muted-foreground">
                  <BarChart2 className="h-3 w-3 mr-1" />
                  <span>To Order</span>
                </div>
                <p className="font-medium">{product.toOrder || 0}</p>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  <span>PASD</span>
                </div>
                <p className="font-medium">{product.pasd || 0}</p>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center text-xs text-muted-foreground">
                  <Box className="h-3 w-3 mr-1" />
                  <span>Days In Hand</span>
                </div>
                <p className="font-medium">{product.daysInvInHand || 0}</p>
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="bg-muted/50 px-6 py-3">
          <Button 
            variant="ghost" 
            className="w-full"
            onClick={() => setIsDetailModalOpen(true)}
          >
            View Details
          </Button>
        </CardFooter>
      </Card>
      
      <ProductDetailModal 
        product={product}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
      />
    </>
  );
};

export default ProductCard;
