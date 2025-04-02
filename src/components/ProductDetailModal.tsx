
import React from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Product } from '@/lib/types';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

const ProductDetailModal = ({ product, isOpen, onClose }: ProductDetailModalProps) => {
  if (!product) return null;

  // Helper to determine if a property should be displayed (only if it's in the Excel)
  const shouldDisplayField = (key: string): boolean => {
    // Skip internal fields that wouldn't be in Excel
    const internalFields = ['id', 'category', 'salesHistory']; 
    if (internalFields.includes(key)) return false;
    
    // Skip empty arrays
    if (Array.isArray(product[key]) && !product[key].length) return false;
    
    return product[key] !== undefined;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{product.name}</DialogTitle>
          <DialogDescription>
            SKU: {product.sku} • Brand: {product.brand || '-'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full overflow-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="amazon">Amazon</TabsTrigger>
            <TabsTrigger value="flipkart">Flipkart</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="planning">Planning</TabsTrigger>
            <TabsTrigger value="all">All Data</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Product Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <dt className="font-medium text-gray-500">Brand:</dt>
                    <dd>{product.brand || '-'}</dd>
                    <dt className="font-medium text-gray-500">Product:</dt>
                    <dd>{product.product || '-'}</dd>
                    <dt className="font-medium text-gray-500">Variant:</dt>
                    <dd>{product.variant || '-'}</dd>
                    <dt className="font-medium text-gray-500">SKU:</dt>
                    <dd>{product.sku || '-'}</dd>
                    <dt className="font-medium text-gray-500">GS1 Code:</dt>
                    <dd>{product.gs1Code || '-'}</dd>
                    <dt className="font-medium text-gray-500">ASINs:</dt>
                    <dd>{product.asins || '-'}</dd>
                    <dt className="font-medium text-gray-500">Launch Type:</dt>
                    <dd>{product.launchType || '-'}</dd>
                  </dl>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Inventory Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <dt className="font-medium text-gray-500">Warehouse:</dt>
                    <dd>{product.wh || '-'}</dd>
                    <dt className="font-medium text-gray-500">FBA:</dt>
                    <dd>{product.fba || '-'}</dd>
                    <dt className="font-medium text-gray-500">Lead Time:</dt>
                    <dd>{product.leadTime || '-'} days</dd>
                    <dt className="font-medium text-gray-500">Days Inventory:</dt>
                    <dd>{product.daysInvInHand || '-'} days</dd>
                    <dt className="font-medium text-gray-500">To Order:</dt>
                    <dd className={product.toOrder && product.toOrder > 0 ? 'text-green-600 font-bold' : 'text-red-600'}>
                      {product.toOrder || '-'}
                    </dd>
                    <dt className="font-medium text-gray-500">In Transit:</dt>
                    <dd>{product.transit || '-'}</dd>
                  </dl>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Demand Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <dt className="font-medium text-gray-500">PASD:</dt>
                    <dd>{product.pasd || '-'}</dd>
                    <dt className="font-medium text-gray-500">MP Demand:</dt>
                    <dd>{product.mpDemand || '-'}</dd>
                    <dt className="font-medium text-gray-500">Amazon Demand:</dt>
                    <dd>{product.amazonDemand || '-'}</dd>
                    <dt className="font-medium text-gray-500">Amazon ASD:</dt>
                    <dd>{product.amazonASD || '-'}</dd>
                    <dt className="font-medium text-gray-500">Max DRR:</dt>
                    <dd>{product.maxDRR || '-'}</dd>
                    <dt className="font-medium text-gray-500">Amazon Growth:</dt>
                    <dd>{product.amazonGrowth ? `${product.amazonGrowth}%` : '-'}</dd>
                  </dl>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Amazon Tab */}
          <TabsContent value="amazon" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Amazon Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="space-y-1">
                    <dt className="font-medium text-gray-500">Amazon Sale</dt>
                    <dd className="text-2xl font-bold">{product.amazonSale || '-'}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="font-medium text-gray-500">Amazon ASD</dt>
                    <dd className="text-2xl font-bold">{product.amazonASD || '-'}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="font-medium text-gray-500">Amazon Growth</dt>
                    <dd className="text-2xl font-bold">{product.amazonGrowth ? `${product.amazonGrowth}%` : '-'}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="font-medium text-gray-500">Amazon PASD</dt>
                    <dd className="text-2xl font-bold">{product.amazonPASD || '-'}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="font-medium text-gray-500">Amazon Inventory</dt>
                    <dd className="text-2xl font-bold">{product.amazonInventory || '-'}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="font-medium text-gray-500">Amazon Demand</dt>
                    <dd className="text-2xl font-bold">{product.amazonDemand || '-'}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="font-medium text-gray-500">FBA</dt>
                    <dd className="text-2xl font-bold">{product.fba || '-'}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="font-medium text-gray-500">FBA Sales</dt>
                    <dd className="text-2xl font-bold">{product.fbaSales || '-'}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Flipkart Tab */}
          <TabsContent value="flipkart" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Flipkart Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="space-y-1">
                    <dt className="font-medium text-gray-500">FK Alpha Sales</dt>
                    <dd className="text-2xl font-bold">{product.fkAlphaSales || '-'}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="font-medium text-gray-500">FK Alpha Inv</dt>
                    <dd className="text-2xl font-bold">{product.fkAlphaInv || '-'}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="font-medium text-gray-500">FK Sales</dt>
                    <dd className="text-2xl font-bold">{product.fkSales || '-'}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="font-medium text-gray-500">FK Sales Total</dt>
                    <dd className="text-2xl font-bold">{product.fkSalesTotal || '-'}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="font-medium text-gray-500">FK Inv</dt>
                    <dd className="text-2xl font-bold">{product.fkInv || '-'}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="font-medium text-gray-500">FK ASD</dt>
                    <dd className="text-2xl font-bold">{product.fkASD || '-'}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="font-medium text-gray-500">FK Growth</dt>
                    <dd className="text-2xl font-bold">{product.fkGrowth || '-'}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="font-medium text-gray-500">FK PASD</dt>
                    <dd className="text-2xl font-bold">{product.fkPASD || '-'}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="font-medium text-gray-500">FK Demand</dt>
                    <dd className="text-2xl font-bold">{product.fkDemand || '-'}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="font-medium text-gray-500">FBF Inv</dt>
                    <dd className="text-2xl font-bold">{product.fbfInv || '-'}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Planning</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="space-y-1">
                    <dt className="font-medium text-gray-500">Warehouse</dt>
                    <dd className="text-2xl font-bold">{product.wh || '-'}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="font-medium text-gray-500">CT Target Inventory</dt>
                    <dd className="text-2xl font-bold">{product.ctTargetInventory || '-'}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="font-medium text-gray-500">Days Inventory In Hand</dt>
                    <dd className="text-2xl font-bold">{product.daysInvInHand || '-'}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="font-medium text-gray-500">Days Inventory Total</dt>
                    <dd className="text-2xl font-bold">{product.daysInvTotal || '-'}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="font-medium text-gray-500">PASD</dt>
                    <dd className="text-2xl font-bold">{product.pasd || '-'}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="font-medium text-gray-500">MP Demand</dt>
                    <dd className="text-2xl font-bold">{product.mpDemand || '-'}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="font-medium text-gray-500">Transit</dt>
                    <dd className="text-2xl font-bold">{product.transit || '-'}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="font-medium text-gray-500">Other MP Sales</dt>
                    <dd className="text-2xl font-bold">{product.otherMPSales || '-'}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Planning Tab */}
          <TabsContent value="planning" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Order Planning</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="space-y-1">
                    <dt className="font-medium text-gray-500">Lead Time</dt>
                    <dd className="text-2xl font-bold">{product.leadTime || '-'} days</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="font-medium text-gray-500">Order Frequency</dt>
                    <dd className="text-2xl font-bold">{product.orderFreq || '-'} days</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="font-medium text-gray-500">To Order</dt>
                    <dd className={`text-2xl font-bold ${product.toOrder && product.toOrder > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {product.toOrder || '-'}
                    </dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="font-medium text-gray-500">Final Order</dt>
                    <dd className="text-2xl font-bold">{product.finalOrder || '-'}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="font-medium text-gray-500">Vendor AMZ</dt>
                    <dd className="text-2xl font-bold">{product.vendorAMZ || '-'}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="font-medium text-gray-500">Vendor2</dt>
                    <dd className="text-2xl font-bold">{product.vendor2 || '-'}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="font-medium text-gray-500">Remark</dt>
                    <dd className="text-2xl font-bold">{product.remark || '-'}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Data Tab - Full Raw Data */}
          <TabsContent value="all" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>All Product Data</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {Object.entries(product).filter(([key]) => shouldDisplayField(key)).map(([key, value]) => (
                      <div key={key} className="py-2 border-b border-gray-100">
                        <dt className="font-medium text-gray-500 mb-1">{key}</dt>
                        <dd>{value?.toString() || '-'}</dd>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailModal;
