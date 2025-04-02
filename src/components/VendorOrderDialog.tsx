
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { sendEmailViaGmail } from '@/lib/gmailApi';
import { OrderSuggestion } from '@/lib/types';
import { Loader2, Info } from 'lucide-react';
import { useData } from '@/contexts/DataContext';

interface VendorOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product: OrderSuggestion | null;
}

const VendorOrderDialog: React.FC<VendorOrderDialogProps> = ({ isOpen, onClose, product }) => {
  const { toast } = useToast();
  const { products } = useData();
  const [vendorEmail, setVendorEmail] = useState('vendor@example.com');
  const [vendorName, setVendorName] = useState('BOLDFIT Supplier Inc.');
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  if (!product) return null;

  // Find the full product details from the data context
  const fullProductDetails = products.find(p => p.id === product.productId);
  
  // Extract ASIN from asins field (assuming it's the first one if there are multiple)
  const asin = fullProductDetails?.asins ? 
    fullProductDetails.asins.split(',')[0].trim() : 
    '';
  
  const amazonLink = asin ? `https://amazon.in/dp/${asin}` : '';

  const generateEmailBody = () => {
    return `Dear ${vendorName},

We would like to place an order for the following item:

Product: ${product.productName}
SKU: ${fullProductDetails?.sku || 'N/A'}
GS1 Code: ${fullProductDetails?.gs1Code || 'N/A'}
Quantity: ${Math.round(product.suggestedOrderQuantity)} units
${amazonLink ? `Amazon Link: ${amazonLink}` : ''}

Please confirm the availability and estimated delivery time for this order.

Thank you,
BOLDFIT Inventory Management Team`;
  };

  const handleSendEmail = async () => {
    setIsLoading(true);
    try {
      const emailData = {
        to: vendorEmail,
        subject: `BOLDFIT Order Request: ${product.productName}`,
        body: generateEmailBody()
      };

      const success = await sendEmailViaGmail(emailData);
      
      if (success) {
        toast({
          title: "Order Sent",
          description: `Order for ${product.productName} has been sent to ${vendorName}`,
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Create Order - {product.productName}</span>
            <div className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">
              {product.urgency.toUpperCase()}
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="vendor-name" className="text-right">
              Vendor Name
            </Label>
            <Input
              id="vendor-name"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              className="col-span-3"
            />
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
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="order-quantity" className="text-right">
              Order Quantity
            </Label>
            <div className="col-span-3 flex items-center gap-2">
              <Input
                id="order-quantity"
                type="number"
                value={Math.round(product.suggestedOrderQuantity)}
                readOnly
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="h-10 w-10">
                    <Info className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-2">
                    <h4 className="font-medium">Order Quantity Calculation</h4>
                    <p className="text-sm text-muted-foreground">
                      {product.reason}
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
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
                <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                  {generateEmailBody()}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSendEmail} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              'Send Order'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VendorOrderDialog;
