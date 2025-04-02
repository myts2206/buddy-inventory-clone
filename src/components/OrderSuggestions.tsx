import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUp, Package, Plus, Filter, X, Link } from 'lucide-react';
import { Separator } from "@/components/ui/separator";
import { useData } from '@/contexts/DataContext';
import { useSearch } from '@/contexts/SearchContext';
import { OrderSuggestion } from '@/lib/types';
import VendorOrderDialog from './VendorOrderDialog';
import BulkOrderDialog from './BulkOrderDialog';
import { Toaster } from "@/components/ui/sonner";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ToggleGroup,
  ToggleGroupItem
} from "@/components/ui/toggle-group";

const determinePriority = (daysInventory: number, isChineseVendor: boolean): { level: 'P1' | 'P2' | 'P3', color: string } => {
  if (isChineseVendor) {
    if (daysInventory < 30) return { level: 'P1', color: 'bg-red-500 text-white' };
    if (daysInventory < 45) return { level: 'P2', color: 'bg-orange-500 text-white' };
    return { level: 'P3', color: 'bg-blue-500 text-white' };
  } else {
    if (daysInventory < 15) return { level: 'P1', color: 'bg-red-500 text-white' };
    if (daysInventory < 30) return { level: 'P2', color: 'bg-orange-500 text-white' };
    return { level: 'P3', color: 'bg-blue-500 text-white' };
  }
};

const OrderSuggestions = ({ className }: { className?: string }) => {
  const { products, getLowStockItems } = useData();
  const { 
    searchQuery, 
    priorityFilter, 
    setPriorityFilter,
    vendorFilter,
    setVendorFilter 
  } = useSearch();
  
  const lowStockItems = getLowStockItems();
  const [selectedProduct, setSelectedProduct] = useState<OrderSuggestion | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkOrderDialogOpen, setIsBulkOrderDialogOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showBundledItems, setShowBundledItems] = useState(true);
  
  const orderSuggestions: OrderSuggestion[] = products
    .filter(product => {
      const needsOrdering = (product.toOrder && product.toOrder > 0) || 
                          (product.finalToOrderBaseUnits && product.finalToOrderBaseUnits > 0) || 
                          lowStockItems.includes(product);
      
      if (!showBundledItems && product.baseUnitId && !product.isBaseUnit) {
        return false;
      }
      
      return needsOrdering;
    })
    .map(product => {
      const warehouseStock = typeof product.wh === 'string' ? parseFloat(product.wh) : (product.wh || 0);
      const fbaStock = product.fba || 0;
      const availableInventory = warehouseStock + fbaStock;
      const daysOfCoverage = product.daysInvInHand || 0;
      const daysInvTotal = product.daysInvTotal || 0;
      
      const isChineseVendor = product.vendor2?.toLowerCase().includes('china') || 
                              product.vendorAMZ?.toLowerCase().includes('china') || 
                              false;
      
      const priority = determinePriority(daysOfCoverage, isChineseVendor);
      
      let suggestedOrderAmount = 0;
      if (product.isBaseUnit && product.finalToOrderBaseUnits) {
        suggestedOrderAmount = product.finalToOrderBaseUnits;
      } else if (product.toOrder) {
        suggestedOrderAmount = product.toOrder;
      }
      
      let finalOrderQuantity = suggestedOrderAmount;
      if (product.baseUnitId && !product.isBaseUnit) {
        finalOrderQuantity = 0;
      }
      
      let urgency: 'low' | 'medium' | 'high' = 'low';
      if (daysOfCoverage < 7) urgency = 'high';
      else if (daysOfCoverage < 14) urgency = 'medium';
      
      let baseUnitName = '';
      let baseUnitSku = '';
      
      if (product.baseUnitId && !product.isBaseUnit) {
        const baseUnit = products.find(p => p.id === product.baseUnitId);
        if (baseUnit) {
          baseUnitName = baseUnit.name;
          baseUnitSku = baseUnit.sku || '';
        }
      }
      
      let reason = `${daysOfCoverage.toFixed(1)} days of inventory in hand. ${isChineseVendor ? 'Chinese vendor.' : ''}`;
      
      if (product.isBaseUnit && product.bundledSKUs && product.bundledSKUs.length > 0) {
        reason += ` Includes ${product.bundledSKUs.length} bundled SKUs.`;
      } else if (product.baseUnitId && !product.isBaseUnit) {
        reason += ` Bundled with base SKU: ${baseUnitSku}.`;
      } else {
        reason += ` ${product.toOrder ? 'Excel suggests ordering.' : 'Low stock alert.'}`;
      }
      
      return {
        productId: product.id,
        productName: product.name,
        currentStock: availableInventory,
        suggestedOrderQuantity: suggestedOrderAmount,
        urgency,
        priority: priority.level,
        priorityColor: priority.color,
        reason: reason,
        isChineseVendor,
        vendor: product.vendor2 || product.vendorAMZ || 'Unknown',
        daysInvInHand: daysOfCoverage,
        daysInvTotal: daysInvTotal,
        isBaseUnit: product.isBaseUnit,
        baseUnitName,
        baseUnitSku,
        packSize: product.packSize,
        bundledSKUs: product.bundledSKUs,
        finalOrderQuantity
      };
    });

  const allVendors = useMemo(() => {
    const vendors = [...new Set(orderSuggestions.map(item => item.vendor))];
    return vendors.sort();
  }, [orderSuggestions]);

  const filteredSuggestions = useMemo(() => {
    return orderSuggestions.filter(suggestion => {
      const matchesSearch = searchQuery 
        ? suggestion.productName.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      
      const matchesPriority = priorityFilter === 'all' 
        ? true 
        : suggestion.priority === priorityFilter;
      
      const matchesVendor = vendorFilter === null 
        ? true 
        : suggestion.vendor === vendorFilter;
      
      return matchesSearch && matchesPriority && matchesVendor;
    });
  }, [orderSuggestions, searchQuery, priorityFilter, vendorFilter]);
  
  const sortedSuggestions = useMemo(() => {
    return [...filteredSuggestions].sort((a, b) => {
      const priorityOrder: Record<string, number> = { 'P1': 1, 'P2': 2, 'P3': 3 };
      return priorityOrder[a.priority as string] - priorityOrder[b.priority as string];
    });
  }, [filteredSuggestions]);

  const vendors = useMemo(() => {
    return [...new Set(sortedSuggestions.map(item => item.vendor))];
  }, [sortedSuggestions]);

  const handleOpenDialog = (suggestion: OrderSuggestion) => {
    setSelectedProduct(suggestion);
    setIsDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedProduct(null);
  };

  const handleOpenBulkOrderDialog = (vendor?: string) => {
    if (vendor) {
      setSelectedVendor(vendor);
    }
    setIsBulkOrderDialogOpen(true);
  };

  const handlePriorityChange = (value: string) => {
    setPriorityFilter(value as 'all' | 'P1' | 'P2' | 'P3');
  };

  const handleVendorChange = (value: string) => {
    setVendorFilter(value === 'all' ? null : value);
  };

  const clearFilters = () => {
    setPriorityFilter('all');
    setVendorFilter(null);
  };

  const handleToggleBundledItems = () => {
    setShowBundledItems(!showBundledItems);
  };

  const filterStats = useMemo(() => {
    const total = filteredSuggestions.length;
    const p1Count = filteredSuggestions.filter(s => s.priority === 'P1').length;
    const p2Count = filteredSuggestions.filter(s => s.priority === 'P2').length;
    const p3Count = filteredSuggestions.filter(s => s.priority === 'P3').length;
    
    return { total, p1Count, p2Count, p3Count };
  }, [filteredSuggestions]);

  return (
    <>
      <Card className={`overflow-hidden transition-all hover:shadow-md ${className || ''}`}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>Order Recommendations</span>
              <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="relative">
                    <Filter className="h-4 w-4 mr-1" />
                    Filter
                    {(priorityFilter !== 'all' || vendorFilter !== null) && (
                      <span className="absolute top-0 right-0 -mt-1 -mr-1 h-2 w-2 rounded-full bg-primary"></span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Priority</h4>
                      <ToggleGroup 
                        type="single" 
                        value={priorityFilter} 
                        onValueChange={handlePriorityChange}
                        className="flex flex-wrap justify-start"
                      >
                        <ToggleGroupItem value="all" className="text-xs">
                          All
                        </ToggleGroupItem>
                        <ToggleGroupItem value="P1" className="text-xs">
                          P1 ({filterStats.p1Count})
                        </ToggleGroupItem>
                        <ToggleGroupItem value="P2" className="text-xs">
                          P2 ({filterStats.p2Count})
                        </ToggleGroupItem>
                        <ToggleGroupItem value="P3" className="text-xs">
                          P3 ({filterStats.p3Count})
                        </ToggleGroupItem>
                      </ToggleGroup>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Vendor</h4>
                      <Select value={vendorFilter || 'all'} onValueChange={handleVendorChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select vendor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Vendors</SelectItem>
                          {allVendors.map(vendor => (
                            <SelectItem key={vendor} value={vendor}>
                              {vendor}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Bundle Options</h4>
                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          id="showBundled" 
                          checked={showBundledItems} 
                          onChange={handleToggleBundledItems}
                          className="h-4 w-4"
                        />
                        <label htmlFor="showBundled" className="text-sm">
                          Show bundled items
                        </label>
                      </div>
                    </div>
                    
                    <div className="flex justify-between">
                      <Button size="sm" variant="outline" onClick={clearFilters} className="text-xs">
                        <X className="h-3 w-3 mr-1" />
                        Clear Filters
                      </Button>
                      <Button size="sm" onClick={() => setIsFilterOpen(false)} className="text-xs">
                        Apply
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <Button onClick={() => handleOpenBulkOrderDialog()}>
              <Package className="mr-2 h-4 w-4" />
              Create Order
            </Button>
          </CardTitle>
          
          {(priorityFilter !== 'all' || vendorFilter !== null || !showBundledItems) && (
            <div className="flex items-center gap-2 mt-1 text-sm">
              <span className="text-muted-foreground">Active filters:</span>
              {priorityFilter !== 'all' && (
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">
                  Priority: {priorityFilter}
                </span>
              )}
              {vendorFilter !== null && (
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">
                  Vendor: {vendorFilter}
                </span>
              )}
              {!showBundledItems && (
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">
                  Base SKUs Only
                </span>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  clearFilters();
                  setShowBundledItems(true);
                }} 
                className="h-6 p-0 text-xs text-muted-foreground"
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {vendors.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {vendors.slice(0, 5).map(vendor => (
                <Button 
                  key={vendor} 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleOpenBulkOrderDialog(vendor)}
                >
                  {vendor}
                </Button>
              ))}
              {vendors.length > 5 && (
                <Button variant="outline" size="sm">+{vendors.length - 5} more</Button>
              )}
            </div>
          )}

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {sortedSuggestions.length > 0 ? (
              sortedSuggestions.map((suggestion, index) => (
                <div key={suggestion.productId} className="animate-fade-up" style={{ animationDelay: `${index * 50}ms` }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">
                        {suggestion.productName}
                        {suggestion.isBaseUnit && suggestion.bundledSKUs && suggestion.bundledSKUs.length > 0 && (
                          <span className="ml-2 text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                            Base SKU ({suggestion.bundledSKUs.length} bundled)
                          </span>
                        )}
                        {suggestion.baseUnitSku && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded flex-inline items-center">
                            <Link className="h-3 w-3 inline mr-0.5" />
                            Bundled
                          </span>
                        )}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${suggestion.priorityColor}`}>
                          {suggestion.priority}
                        </span>
                        <span className="text-xs text-muted-foreground border px-2 py-0.5 rounded-full">
                          {suggestion.vendor}
                        </span>
                        {suggestion.packSize && (
                          <span className="text-xs text-muted-foreground border px-2 py-0.5 rounded-full">
                            Pack: {suggestion.packSize}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 mt-1">
                        <div className="text-sm">
                          <span className="text-muted-foreground">No. of days inv inhand: </span>
                          <span className="font-medium">{suggestion.daysInvInHand.toFixed(1)}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">No. of days inv total: </span>
                          <span className="font-medium">{suggestion.daysInvTotal.toFixed(1)}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{suggestion.reason}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-primary">
                        <ArrowUp className="h-3 w-3" />
                        <span className="font-medium">
                          {suggestion.baseUnitSku 
                            ? "Order 0 (Bundled)" 
                            : `Order ${Math.round(suggestion.finalOrderQuantity || suggestion.suggestedOrderQuantity)}`}
                        </span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="mt-1"
                        onClick={() => handleOpenDialog(suggestion)}
                        disabled={!!suggestion.baseUnitSku}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add to Order
                      </Button>
                    </div>
                  </div>
                  {index < sortedSuggestions.length - 1 && <Separator className="mt-3" />}
                </div>
              ))
            ) : (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">
                  {searchQuery || priorityFilter !== 'all' || vendorFilter !== null
                    ? "No order recommendations match your filters"
                    : "No order recommendations at this time"}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <VendorOrderDialog 
        isOpen={isDialogOpen} 
        onClose={handleCloseDialog} 
        product={selectedProduct} 
      />
      
      <BulkOrderDialog
        isOpen={isBulkOrderDialogOpen}
        onClose={() => setIsBulkOrderDialogOpen(false)}
        initialVendor={selectedVendor || undefined}
      />
      
      <Toaster />
    </>
  );
};

export default OrderSuggestions;
