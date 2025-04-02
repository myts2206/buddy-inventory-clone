
import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { sendEmailViaGmail } from '@/lib/gmailApi';
import { OrderSuggestion, Product } from '@/lib/types';
import { Loader2, Package, Plus, Trash2, Filter, X } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

interface BulkOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialVendor?: string;
}

interface OrderItem {
  productId: string;
  quantity: number;
  isSelected: boolean;
}

const BulkOrderDialog: React.FC<BulkOrderDialogProps> = ({ isOpen, onClose, initialVendor }) => {
  const { toast } = useToast();
  const { products } = useData();
  const [vendorEmail, setVendorEmail] = useState('vendor@example.com');
  const [vendorName, setVendorName] = useState(initialVendor || '');
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [availableVendors, setAvailableVendors] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  
  // Filtering states
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'P1' | 'P2' | 'P3'>('all');
  const [hideNegativeQuantities, setHideNegativeQuantities] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Extract all vendors from products on initial load
  useEffect(() => {
    if (products.length > 0) {
      const vendors = products
        .map(product => [product.vendor2, product.vendorAMZ])
        .flat()
        .filter((vendor): vendor is string => 
          vendor !== undefined && vendor !== null && vendor !== ''
        );
      // Remove duplicates
      const uniqueVendors = [...new Set(vendors)];
      setAvailableVendors(uniqueVendors);
      
      // If initialVendor is provided and valid, set it and filter products
      if (initialVendor && uniqueVendors.includes(initialVendor)) {
        setVendorName(initialVendor);
        initializeOrderItemsForVendor(initialVendor);
      }
    }
  }, [products, initialVendor]);

  // When vendor changes, update the order items
  const handleVendorChange = (vendor: string) => {
    setVendorName(vendor);
    initializeOrderItemsForVendor(vendor);
  };

  // Initialize order items based on selected vendor
  const initializeOrderItemsForVendor = (vendor: string) => {
    // Get products for this vendor
    const vendorProducts = products.filter(product => 
      product.vendor2 === vendor || product.vendorAMZ === vendor
    );

    // Create order items for each product
    const items = vendorProducts.map(product => ({
      productId: product.id,
      quantity: product.toOrder || Math.max(Math.round((product.pasd || 0) * 30 - (product.wh as number || 0)), 0),
      isSelected: false
    }));

    setOrderItems(items);
    setSelectedProducts([]);
  };

  // Toggle product selection
  const toggleProductSelection = (productId: string) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(prev => prev.filter(id => id !== productId));
    } else {
      setSelectedProducts(prev => [...prev, productId]);
    }
  };

  // Update quantity for a product
  const updateQuantity = (productId: string, quantity: number) => {
    setOrderItems(prev => 
      prev.map(item => 
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  };

  // Generate the email body with all selected products
  const generateEmailBody = () => {
    const selectedItems = orderItems.filter(item => 
      selectedProducts.includes(item.productId)
    );

    if (selectedItems.length === 0) {
      return `Dear ${vendorName},\n\nWe would like to place an order. Please provide a quote for the following items.\n\nRegards,\nBOLDFIT Inventory Management Team`;
    }

    const productList = selectedItems.map(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) return null;

      // Extract ASIN from asins field
      const asin = product.asins ? product.asins.split(',')[0].trim() : '';
      const amazonLink = asin ? `https://amazon.in/dp/${asin}` : '';

      return `
Product: ${product.name}
SKU: ${product.sku || 'N/A'}
GS1 Code: ${product.gs1Code || 'N/A'}
Quantity: ${item.quantity} units
${amazonLink ? `Amazon Link: ${amazonLink}` : ''}`;
    }).filter(Boolean).join('\n\n');

    return `Dear ${vendorName},

We would like to place an order for the following items:

${productList}

Please confirm the availability and estimated delivery time for these items.

Thank you,
BOLDFIT Inventory Management Team`;
  };

  const handleSendEmail = async () => {
    // Ensure at least one product is selected
    if (selectedProducts.length === 0) {
      toast({
        title: "No Products Selected",
        description: "Please select at least one product to order.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const emailData = {
        to: vendorEmail,
        subject: `BOLDFIT Order Request: ${vendorName}`,
        body: generateEmailBody()
      };

      const success = await sendEmailViaGmail(emailData);
      
      if (success) {
        toast({
          title: "Order Sent",
          description: `Order with ${selectedProducts.length} products has been sent to ${vendorName}`,
        });
        onClose();
      }
    } catch (error) {
      console.error("Error sending order:", error);
      toast({
        title: "Error",
        description: "Failed to send order email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get the priority level for a product
  const getProductPriority = (product: Product): { level: 'P1' | 'P2' | 'P3', color: string } => {
    const daysInventory = product.daysInvInHand || 0;
    const isChineseVendor = 
      product.vendor2?.toLowerCase().includes('china') || 
      product.vendorAMZ?.toLowerCase().includes('china') || 
      false;

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

  // Filter and sort products based on selected criteria
  const filteredOrderItems = useMemo(() => {
    return orderItems.filter(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) return false;

      // Search filter
      const matchesSearch = searchQuery 
        ? product.name.toLowerCase().includes(searchQuery.toLowerCase()) || product.sku?.toLowerCase().includes(searchQuery.toLowerCase())
        : true;

      // Priority filter
      const priority = getProductPriority(product);
      const matchesPriority = priorityFilter === 'all' || priority.level === priorityFilter;

      // Negative quantity filter
      const matchesQuantity = !hideNegativeQuantities || item.quantity > 0;

      return matchesSearch && matchesPriority && matchesQuantity;
    });
  }, [orderItems, searchQuery, priorityFilter, hideNegativeQuantities, products]);

  // Sort by priority (P1 -> P2 -> P3)
  const sortedOrderItems = useMemo(() => {
    return [...filteredOrderItems].sort((a, b) => {
      const productA = products.find(p => p.id === a.productId);
      const productB = products.find(p => p.id === b.productId);
      
      if (!productA || !productB) return 0;
      
      const priorityA = getProductPriority(productA);
      const priorityB = getProductPriority(productB);
      
      // P1 comes before P2 comes before P3
      if (priorityA.level === 'P1' && priorityB.level !== 'P1') return -1;
      if (priorityA.level === 'P2' && priorityB.level === 'P3') return -1;
      if (priorityA.level === 'P3' && priorityB.level !== 'P3') return 1;
      if (priorityA.level === 'P2' && priorityB.level === 'P1') return 1;
      
      // If same priority, sort by days inventory
      return (productA.daysInvInHand || 999) - (productB.daysInvInHand || 999);
    });
  }, [filteredOrderItems, products]);

  // Calculate stats for the filter summary
  const filterStats = useMemo(() => {
    const total = filteredOrderItems.length;
    const selectedCount = selectedProducts.length;
    const p1Count = filteredOrderItems.filter(item => {
      const product = products.find(p => p.id === item.productId);
      return product && getProductPriority(product).level === 'P1';
    }).length;
    const p2Count = filteredOrderItems.filter(item => {
      const product = products.find(p => p.id === item.productId);
      return product && getProductPriority(product).level === 'P2';
    }).length;
    const p3Count = filteredOrderItems.filter(item => {
      const product = products.find(p => p.id === item.productId);
      return product && getProductPriority(product).level === 'P3';
    }).length;
    
    return { total, selectedCount, p1Count, p2Count, p3Count };
  }, [filteredOrderItems, selectedProducts, products]);

  // Select all visible products after filtering
  const selectAllVisible = () => {
    const visibleProductIds = sortedOrderItems.map(item => item.productId);
    setSelectedProducts(prevSelected => {
      const alreadySelected = prevSelected.filter(id => !visibleProductIds.includes(id));
      return [...alreadySelected, ...visibleProductIds];
    });
  };

  // Deselect all visible products
  const deselectAllVisible = () => {
    const visibleProductIds = sortedOrderItems.map(item => item.productId);
    setSelectedProducts(prevSelected => 
      prevSelected.filter(id => !visibleProductIds.includes(id))
    );
  };

  // Check if all visible items are selected
  const areAllVisibleSelected = useMemo(() => {
    if (sortedOrderItems.length === 0) return false;
    return sortedOrderItems.every(item => selectedProducts.includes(item.productId));
  }, [sortedOrderItems, selectedProducts]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Create Vendor Order</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4 flex-grow overflow-hidden">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="vendor-name" className="text-right">
              Vendor
            </Label>
            <div className="col-span-3">
              <Select value={vendorName} onValueChange={handleVendorChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a vendor" />
                </SelectTrigger>
                <SelectContent>
                  {availableVendors.map(vendor => (
                    <SelectItem key={vendor} value={vendor}>{vendor}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="vendor-email" className="text-right">
              Vendor Email
            </Label>
            <Input
              id="vendor-email"
              value={vendorEmail}
              onChange={(e) => setVendorEmail(e.target.value)}
              type="email"
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">
              Products
            </Label>
            <div className="col-span-3 border rounded-md flex flex-col min-h-[350px]">
              {vendorName ? (
                <>
                  <div className="p-3 border-b">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">Filter Products</div>
                      <div className="text-sm text-muted-foreground">
                        {filterStats.total} products ({filterStats.p1Count} P1, {filterStats.p2Count} P2, {filterStats.p3Count} P3)
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Input
                          placeholder="Search by name or SKU"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full"
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as any)}>
                          <SelectTrigger className="flex-grow">
                            <SelectValue placeholder="Select Priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Priorities</SelectItem>
                            <SelectItem value="P1">P1 - High Priority</SelectItem>
                            <SelectItem value="P2">P2 - Medium Priority</SelectItem>
                            <SelectItem value="P3">P3 - Low Priority</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="flex items-center mt-2">
                      <Checkbox 
                        id="hide-negative"
                        checked={hideNegativeQuantities}
                        onCheckedChange={(checked) => setHideNegativeQuantities(checked === true)}
                      />
                      <label htmlFor="hide-negative" className="ml-2 text-sm cursor-pointer">
                        Hide products with negative or zero quantities
                      </label>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => {
                            setPriorityFilter('all');
                            setHideNegativeQuantities(false);
                            setSearchQuery('');
                          }}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Clear Filters
                        </Button>
                      </div>
                      
                      <div>
                        <Button 
                          size="sm" 
                          variant={areAllVisibleSelected ? "destructive" : "secondary"}
                          onClick={areAllVisibleSelected ? deselectAllVisible : selectAllVisible}
                        >
                          {areAllVisibleSelected ? "Deselect All" : "Select All Visible"}
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <ScrollArea className="flex-grow">
                    <div className="p-2 space-y-2">
                      {sortedOrderItems.length > 0 ? (
                        sortedOrderItems.map((item) => {
                          const product = products.find(p => p.id === item.productId);
                          if (!product) return null;
                          
                          const priority = getProductPriority(product);
                          
                          return (
                            <div key={item.productId} className="flex items-center space-x-2 p-2 border rounded-md">
                              <Checkbox
                                checked={selectedProducts.includes(item.productId)}
                                onCheckedChange={() => toggleProductSelection(item.productId)}
                                id={`select-${item.productId}`}
                              />
                              <div className="flex-grow">
                                <div className="flex justify-between">
                                  <label htmlFor={`select-${item.productId}`} className="font-medium">
                                    {product.name}
                                  </label>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${priority.color}`}>
                                    {priority.level}
                                  </span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  SKU: {product.sku || 'N/A'} | Inv: {product.daysInvInHand || 0} days
                                </div>
                              </div>
                              <Input 
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 0)}
                                className="w-20"
                                min="0"
                              />
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-4 text-center text-muted-foreground">
                          {searchQuery || priorityFilter !== 'all' || hideNegativeQuantities
                            ? "No products match your filters"
                            : "No products found for this vendor"}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </>
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  Select a vendor to see available products
                </div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-start gap-4">
            <div className="text-right pt-2">
              <Label>Email Preview</Label>
            </div>
            <div className="col-span-3">
              <Button 
                variant="outline" 
                type="button" 
                className="mb-2" 
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? "Hide Preview" : "Show Preview"}
              </Button>
              
              {showPreview && (
                <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                  {generateEmailBody()}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <div className="w-full flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {selectedProducts.length} products selected
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSendEmail} disabled={isLoading || selectedProducts.length === 0}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Order'
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkOrderDialog;
