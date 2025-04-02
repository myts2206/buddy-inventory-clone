
import React from 'react';
import { 
  BarChart3, 
  Package, 
  LayoutDashboard, 
  ShoppingCart, 
  Truck, 
  PackageOpen, 
  FileText, 
  Settings, 
  BarChart2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

const SidebarItem = ({ icon, label, active }: SidebarItemProps) => {
  return (
    <Button
      variant={active ? "default" : "ghost"}
      className={`w-full justify-start ${active ? 'bg-primary text-primary-foreground' : ''}`}
    >
      <span className="mr-2">{icon}</span>
      <span>{label}</span>
    </Button>
  );
};

const Sidebar = () => {
  return (
    <aside className="hidden lg:flex flex-col h-screen w-64 border-r border-border bg-card overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <Package className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold">BOLDFIT</h1>
        </div>
        
        <div className="space-y-1">
          <SidebarItem icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" active />
          <SidebarItem icon={<Package className="h-4 w-4" />} label="Inventory" />
          <SidebarItem icon={<ShoppingCart className="h-4 w-4" />} label="Orders" />
          <SidebarItem icon={<Truck className="h-4 w-4" />} label="Suppliers" />
          <SidebarItem icon={<PackageOpen className="h-4 w-4" />} label="Products" />
        </div>
        
        <Separator className="my-4" />
        
        <div className="space-y-1">
          <SidebarItem icon={<BarChart3 className="h-4 w-4" />} label="Forecasting" />
          <SidebarItem icon={<BarChart2 className="h-4 w-4" />} label="Analytics" />
          <SidebarItem icon={<FileText className="h-4 w-4" />} label="Reports" />
        </div>
        
        <Separator className="my-4" />
        
        <div className="space-y-1">
          <SidebarItem icon={<Settings className="h-4 w-4" />} label="Settings" />
        </div>
      </div>
      
      <div className="mt-auto p-6">
        <div className="rounded-lg bg-secondary p-4">
          <h3 className="font-medium mb-1">AI Insights</h3>
          <p className="text-sm text-muted-foreground mb-3">Your inventory health score is 86/100</p>
          <Button size="sm" className="w-full">View Recommendations</Button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
