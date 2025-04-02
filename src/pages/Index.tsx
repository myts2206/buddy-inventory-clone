
import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Dashboard from '@/components/Dashboard';
import ExcelUploader from '@/components/ExcelUploader';
import { DataProvider } from '@/contexts/DataContext';
import { SearchProvider } from '@/contexts/SearchContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileSpreadsheet, BarChart, Upload, CalendarIcon } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/hooks/use-toast';

const EmptyState = ({ onShowUploader }: { onShowUploader: () => void }) => {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
        <Upload className="h-8 w-8 text-primary" />
      </div>
      <h2 className="text-2xl font-semibold mb-2">No Data Available</h2>
      <p className="text-muted-foreground max-w-md mb-6">
        To get started with BoldFit Inventory Management, please upload your inventory data.
      </p>
      <button 
        onClick={onShowUploader}
        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
      >
        Upload Data
      </button>
    </div>
  );
};

const IndexContent = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { products, getCurrentMonth } = useData();
  const { toast } = useToast();
  const hasData = products && Array.isArray(products) && products.length > 0;
  const currentMonth = getCurrentMonth();

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="px-6 pt-6"
          >
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="dashboard">
                  <BarChart className="h-4 w-4 mr-2" />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger value="upload">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Data Upload
                </TabsTrigger>
              </TabsList>
              
              {hasData && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  <span>Current data: <strong>{currentMonth}</strong></span>
                </div>
              )}
            </div>
            
            <TabsContent value="dashboard">
              {hasData ? (
                <Dashboard />
              ) : (
                <EmptyState onShowUploader={() => setActiveTab("upload")} />
              )}
            </TabsContent>
            
            <TabsContent value="upload" className="p-6">
              <ExcelUploader 
                onDataUploaded={() => {
                  // After data is uploaded, switch to dashboard
                  setTimeout(() => {
                    setActiveTab("dashboard");
                    toast({
                      title: "Data uploaded successfully",
                      description: "Your inventory data has been processed.",
                    });
                  }, 500);
                }}
              />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

const Index = () => {
  return (
    <DataProvider>
      <SearchProvider>
        <IndexContent />
      </SearchProvider>
    </DataProvider>
  );
};

export default Index;
