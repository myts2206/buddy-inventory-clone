import React, { useState, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign, 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  BarChart3,
  ShoppingCart,
  FileSpreadsheet,
  TruckIcon,
  ActivitySquare,
  CircleCheckBig,
  CircleAlert,
  ArrowUp
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import ForecastChart from './ForecastChart';
import OrderSuggestions from './OrderSuggestions';
import ProductCard from './ProductCard';
import InventoryTable from './InventoryTable';
import { useData } from '@/contexts/DataContext';
import { useSearch } from '@/contexts/SearchContext';
import { calculateInventoryMetrics } from '@/lib/dataProcessor';
import { formatNumber } from '@/lib/utils';

const StatCard = ({ 
  title, 
  value, 
  icon, 
  description, 
  change,
  trend = "up"
}: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  description?: string;
  change?: string; 
  trend?: "up" | "down" | "neutral";
}) => {
  const trendColor = trend === "up" ? "text-green-500" : trend === "down" ? "text-red-500" : "text-blue-500";
  
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md animate-fade-up">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold mt-1">{value}</h3>
          </div>
          <div className="rounded-full p-2 bg-primary/10">
            {icon}
          </div>
        </div>
        {(description || change) && (
          <div className="flex items-center mt-4">
            {change && (
              <span className={`text-xs font-medium mr-2 ${trendColor}`}>
                {change}
              </span>
            )}
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const HealthScoreCard = ({ 
  score, 
  overstock, 
  stockout, 
  className 
}: { 
  score: number; 
  overstock: number; 
  stockout: number; 
  className?: string 
}) => {
  let statusColor = "text-green-500";
  let statusText = "Excellent";
  let statusIcon = <CircleCheckBig className="h-5 w-5" />;
  
  if (score < 70) {
    statusColor = "text-red-500";
    statusText = "Needs Attention";
    statusIcon = <CircleAlert className="h-5 w-5" />;
  } else if (score < 85) {
    statusColor = "text-yellow-500";
    statusText = "Good";
    statusIcon = <CircleCheckBig className="h-5 w-5" />;
  }
  
  return (
    <Card className={`overflow-hidden transition-all hover:shadow-md ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Inventory Health Score</h3>
          <ActivitySquare className="h-5 w-5 text-primary" />
        </div>
        
        <div className="flex flex-col items-center justify-center py-4">
          <div className="relative w-32 h-32 mb-4">
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-bold">{score}%</span>
            </div>
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle 
                className="text-gray-200" 
                strokeWidth="8" 
                stroke="currentColor" 
                fill="transparent" 
                r="40" 
                cx="50" 
                cy="50" 
              />
              <circle 
                className={`${score >= 85 ? 'text-green-500' : score >= 70 ? 'text-yellow-500' : 'text-red-500'}`}
                strokeWidth="8" 
                strokeDasharray={`${score * 2.51} ${251 - (score * 2.51)}`}
                strokeLinecap="round" 
                stroke="currentColor" 
                fill="transparent" 
                r="40" 
                cx="50" 
                cy="50" 
                transform="rotate(-90 50 50)"
              />
            </svg>
          </div>
          
          <div className={`flex items-center gap-1 ${statusColor} font-semibold text-lg mb-2`}>
            {statusIcon}
            <span>{statusText}</span>
          </div>
          
          <p className="text-sm text-center text-muted-foreground mb-4">
            Inventory Efficiency = 100% - (Overstock Rate + Stockout Rate)
          </p>
          
          <div className="w-full grid grid-cols-2 gap-4 mt-2">
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <div className="flex items-center">
                  <ArrowUp className="h-3 w-3 mr-1 text-blue-500" />
                  <span>Overstock Rate</span>
                </div>
                <span className="font-medium text-blue-500">{overstock}%</span>
              </div>
              <Progress value={overstock} className="h-1 bg-blue-100" indicatorClassName="bg-blue-500" />
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <div className="flex items-center">
                  <AlertTriangle className="h-3 w-3 mr-1 text-red-500" />
                  <span>Stockout Rate</span>
                </div>
                <span className="font-medium text-red-500">{stockout}%</span>
              </div>
              <Progress value={stockout} className="h-1 bg-red-100" indicatorClassName="bg-red-500" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const { products, isUsingMockData, getLowStockItems, getOverstockItems } = useData();
  const { searchQuery } = useSearch();
  const [activeOverviewTab, setActiveOverviewTab] = useState('summary');
  
  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    return products.filter(product => 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);
  
  const filteredLowStockItems = useMemo(() => {
    const lowStockItems = getLowStockItems();
    if (!searchQuery) return lowStockItems;
    return lowStockItems.filter(product => 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [getLowStockItems, searchQuery]);
  
  const filteredOverstockItems = useMemo(() => {
    const overstockItems = getOverstockItems();
    if (!searchQuery) return overstockItems;
    return overstockItems.filter(product => 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [getOverstockItems, searchQuery]);
  
  const baseMetrics = calculateInventoryMetrics(products);
  
  const totalProducts = products.length;
  const overstockRate = totalProducts > 0 ? Math.round((filteredOverstockItems.length / totalProducts) * 100) : 0;
  const stockoutRate = totalProducts > 0 ? Math.round((filteredLowStockItems.length / totalProducts) * 100) : 0;
  
  const inventoryHealthScore = Math.max(0, 100 - (overstockRate + stockoutRate));
  
  const inventoryMetrics = {
    ...baseMetrics,
    overstockItems: filteredOverstockItems.length,
    overstockRate,
    stockoutRate,
    inventoryHealthScore,
  };
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to your AI-powered supply chain command center.</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2 self-end">
          {searchQuery && (
            <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-200">
              Showing results for: "{searchQuery}"
            </Badge>
          )}
          {!isUsingMockData && products.length > 0 && (
            <Badge variant="outline" className="bg-primary/10 hover:bg-primary/20">
              <FileSpreadsheet className="h-3 w-3 mr-1" />
              <span className="text-primary font-medium">Using uploaded data</span>
            </Badge>
          )}
          <Badge variant="outline" className="bg-primary/10 hover:bg-primary/20">
            <span className="text-primary font-medium">Today: {new Date().toLocaleDateString()}</span>
          </Badge>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Products" 
          value={searchQuery ? filteredProducts.length : inventoryMetrics.totalProducts || 0}
          icon={<Package className="h-4 w-4 text-primary" />}
          description="Across multiple categories"
        />
        <StatCard 
          title="Items In Transit" 
          value={inventoryMetrics.itemsInTransit || 0}
          icon={<TruckIcon className="h-4 w-4 text-primary" />}
        />
        <StatCard 
          title="Low Stock Items" 
          value={filteredLowStockItems.length}
          icon={<AlertTriangle className="h-4 w-4 text-primary" />}
          trend="down"
        />
        <StatCard 
          title="Overstock Items" 
          value={filteredOverstockItems.length}
          icon={<ArrowUp className="h-4 w-4 text-primary" />}
          trend="neutral"
        />
      </div>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <Tabs value={activeOverviewTab} onValueChange={setActiveOverviewTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="key-metrics">Key Metrics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="summary">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="md:col-span-1">
                  <HealthScoreCard 
                    score={inventoryHealthScore} 
                    overstock={overstockRate} 
                    stockout={stockoutRate} 
                    className="h-full"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <OrderSuggestions className="h-full" />
                </div>
              </div>
              
              <Card className="mb-6">
                <CardContent className="p-6">
                  <h3 className="text-lg font-medium mb-4">Low Stock Items</h3>
                  <InventoryTable products={filteredLowStockItems} isOverview={true} />
                </CardContent>
              </Card>
              
              <Card className="mb-6">
                <CardContent className="p-6">
                  <h3 className="text-lg font-medium mb-4">Overstock Items</h3>
                  <InventoryTable products={filteredOverstockItems} isOverview={true} />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="key-metrics">
              <InventoryTable products={filteredProducts} />
            </TabsContent>
          </Tabs>
        </TabsContent>
        
        <TabsContent value="products" className="space-y-6">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchQuery 
                  ? `No products found matching "${searchQuery}"`
                  : "Upload product data to view your inventory"}
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="forecasting" className="space-y-6">
          {products.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {products.length > 0 && (
                <>
                  <ForecastChart productId={products[0].id} title={`${products[0].name} - Forecast`} />
                  {products.length > 1 && (
                    <ForecastChart productId={products[1].id} title={`${products[1].name} - Forecast`} />
                  )}
                </>
              )}
              
              <Card className="overflow-hidden transition-all hover:shadow-md lg:col-span-2">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">AI Supply Chain Insights</h3>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  </div>
                  
                  <div className="space-y-4">
                    {filteredLowStockItems.length > 0 ? (
                      <div className="p-4 rounded-lg bg-orange-500/5 border border-orange-500/10">
                        <h4 className="font-medium mb-1">Stockout Risk Alert</h4>
                        <p className="text-sm text-muted-foreground">
                          {filteredLowStockItems.length} products are currently below their stock thresholds. 
                          Review the inventory table and consider placing orders soon.
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/10">
                        <h4 className="font-medium mb-1">Healthy Inventory Levels</h4>
                        <p className="text-sm text-muted-foreground">
                          All products are currently above their stock thresholds.
                          Continue monitoring for any changes in demand patterns.
                        </p>
                      </div>
                    )}
                    
                    {filteredOverstockItems.length > 0 && (
                      <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/10">
                        <h4 className="font-medium mb-1">Overstock Alert</h4>
                        <p className="text-sm text-muted-foreground">
                          {filteredOverstockItems.length} products are overstocked (WH {`>`} PASD × Order Frequency × 1.5).
                          Consider promotions or other strategies to reduce inventory levels.
                        </p>
                      </div>
                    )}
                    
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                      <h4 className="font-medium mb-1">Orders to Place</h4>
                      <p className="text-sm text-muted-foreground">
                        Based on your current PASD and MP Demand, there are {
                          products.filter(p => (p.toOrder || 0) > 0).length
                        } products that need to be ordered soon.
                      </p>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/10">
                      <h4 className="font-medium mb-1">Inventory Health Score: {formatNumber(inventoryHealthScore)}%</h4>
                      <p className="text-sm text-muted-foreground">
                        Your inventory efficiency is {formatNumber(inventoryHealthScore)}%, calculated as 100% - (Overstock Rate + Stockout Rate).
                        {inventoryHealthScore < 70 ? ' Immediate attention required.' : 
                         inventoryHealthScore < 85 ? ' Some improvements needed.' : ' Excellent inventory management!'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Upload product data to view forecasting insights</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
