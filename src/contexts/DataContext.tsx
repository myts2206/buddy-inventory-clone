
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Product, inventoryMetrics } from '@/lib/types';
import { processUploadedData } from '@/lib/dataProcessor';
import { calculateBundleInformation, isProductOverstocked } from '@/lib/bundleCalculator';
import { safeNumber, exists, safeString } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface DataContextType {
  products: Product[];
  isUsingMockData: boolean;
  uploadData: (data: any[]) => void;
  resetToMockData: () => void;
  getLowStockItems: () => Promise<Product[]>;
  getOverstockItems: () => Promise<Product[]>;
  getCurrentMonth: () => string;
  currentFileName: string | null;
  loadFileFromGoogleDrive: (fileId: string, fileName: string) => Promise<boolean>;
  isLoadingData: boolean;
  inventoryMetrics: inventoryMetrics | null;
  fetchInventoryMetrics: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isUsingMockData, setIsUsingMockData] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<string>(() => {
    return new Date().toLocaleString('default', { month: 'long' });
  });
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [inventoryMetrics, setInventoryMetrics] = useState<inventoryMetrics | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    
    if (isAuthenticated) {
      fetchProducts();
      fetchInventoryMetrics();
    }
  }, []);

  const fetchInventoryMetrics = async () => {
    try {
      const { data, error } = await supabase.rpc('calculate_inventory_metrics');
      
      if (error) {
        console.error('Error fetching inventory metrics:', error);
        return;
      }
      
      setInventoryMetrics(data);
    } catch (error) {
      console.error('Error in fetchInventoryMetrics:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setIsLoadingData(true);
      
      const { data, error } = await supabase
        .from('master')
        .select('*');
      
      if (error) {
        console.error('Error fetching products:', error);
        return;
      }
      
      if (data && data.length > 0) {
        // Transform the data to match the Product interface
        const transformedData = data.map((item: any) => ({
          id: item.id || crypto.randomUUID(),
          brand: item.brand || '',
          product: item.product || '',
          variant: item.variant || '',
          name: item.product_name || '',
          sku: item.sku || '',
          category: item.category || 'Uncategorized', // Add default category
          wh: safeNumber(item.wh, 0),
          fba: safeNumber(item.fba, 0),
          pasd: safeNumber(item.pasd, 0),
          leadTime: safeNumber(item.lead_time, 0),
          transit: safeNumber(item.transit, 0),
          orderFreq: safeNumber(item.order_freq, 0),
          mpDemand: safeNumber(item.mp_demand, 0),
          toOrder: safeNumber(item.to_order, 0),
          // Include other fields as needed
          isBaseUnit: false,
          isOverstock: false,
          bundledSKUs: [],
          finalToOrderBaseUnits: 0,
          salesHistory: []
        }));
        
        // Process with bundle information if needed
        const productsWithBundleInfo = calculateBundleInformation(transformedData);
        setProducts(productsWithBundleInfo);
        
        console.log('Fetched products from Supabase:', productsWithBundleInfo.length);
      }
    } catch (error) {
      console.error('Error in fetchProducts:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const autoLoadLatestFile = async () => {
    try {
      setIsLoadingData(true);
      
      await loadGoogleApi();
      
      const accessToken = await getGoogleDriveAccessToken();
      if (!accessToken) {
        console.error('Failed to get access token for auto-loading');
        return;
      }
      
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=mimeType contains 'spreadsheet' and trashed=false&orderBy=modifiedTime desc&fields=files(id,name,createdTime)&pageSize=1`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();
      
      if (data.files && data.files.length > 0) {
        const latestFile = data.files[0];
        await loadFileFromGoogleDrive(latestFile.id, latestFile.name);
        toast({
          title: "Latest data loaded",
          description: `Loaded ${latestFile.name} automatically`,
        });
      } else {
        console.log('No Excel files found for auto-loading');
      }
    } catch (error) {
      console.error('Error auto-loading latest file:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const loadGoogleApi = async (): Promise<void> => {
    if (typeof window.google === 'undefined' || !window.google.accounts || !window.google.accounts.oauth2) {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Google API'));
        document.body.appendChild(script);
      });
    }
    return Promise.resolve();
  };

  const getGoogleDriveAccessToken = async (): Promise<string | null> => {
    await loadGoogleApi();
    
    return new Promise((resolve) => {
      if (typeof window.google === 'undefined' || !window.google.accounts || !window.google.accounts.oauth2) {
        console.error('Google API not loaded properly');
        resolve(null);
        return;
      }

      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: '308713919748-j4i4giqvgkuluukemumj709k1q279865.apps.googleusercontent.com',
        scope: 'https://www.googleapis.com/auth/drive.readonly',
        callback: (response: any) => {
          if (response.error) {
            console.error('OAuth error:', response);
            resolve(null);
          } else {
            resolve(response.access_token);
          }
        }
      });

      tokenClient.requestAccessToken({ prompt: '' });
    });
  };

  const loadFileFromGoogleDrive = async (fileId: string, fileName: string): Promise<boolean> => {
    setIsLoadingData(true);
    try {
      const accessToken = await getGoogleDriveAccessToken();
      if (!accessToken) {
        toast({
          variant: "destructive",
          title: "Authentication Failed",
          description: "Could not get access to Google Drive."
        });
        return false;
      }
      
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      
      if (!res.ok) {
        throw new Error(`Failed to download file: ${res.statusText}`);
      }
      
      const arrayBuffer = await res.arrayBuffer();
      const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (!jsonData.length) {
        toast({
          title: "Empty file",
          description: "The selected file doesn't contain any data.",
          variant: "destructive"
        });
        return false;
      }

      uploadData(jsonData);
      setCurrentFileName(fileName);
      
      const dateMatch = fileName.match(/(\d{1,2})[-\.](\d{1,2})[-\.](\d{2,4})/);
      if (dateMatch) {
        const [_, day, month, year] = dateMatch;
        const date = new Date(+year, +month - 1, +day);
        setCurrentMonth(date.toLocaleString('default', { month: 'long', year: 'numeric' }));
      }
      
      toast({
        title: "File loaded successfully",
        description: `Loaded ${jsonData.length} records from ${fileName}`,
      });
      
      return true;
    } catch (error) {
      console.error('Error loading file from Google Drive:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load file from Google Drive."
      });
      return false;
    } finally {
      setIsLoadingData(false);
    }
  };

  const uploadData = (data: any[]) => {
    console.log('Raw data being processed:', data);
    
    try {
      if (!Array.isArray(data) || data.length === 0) {
        console.error('No valid data to process');
        return;
      }
      
      if (data.length > 0) {
        const sampleItem = data[0];
        console.log('All column headers as in Excel:', Object.keys(sampleItem));
        
        console.log('Lead time field in raw data:', 
          Object.keys(sampleItem).find(key => {
            if (key === null || key === undefined) return false;
            try {
              const keyStr = String(key).toLowerCase();
              return keyStr.includes('lead') || keyStr === 'lead time';
            } catch (error) {
              console.error('Error processing key:', key, error);
              return false;
            }
          })
        );
        
        Object.keys(sampleItem).forEach(key => {
          try {
            if (key === null || key === undefined) return;
            const keyStr = String(key).toLowerCase();
            if (keyStr.includes('lead') || keyStr === 'lead time') {
              console.log(`Found lead time in Excel with key "${key}":`, sampleItem[key]);
            }
          } catch (error) {
            console.error('Error logging lead time:', key, error);
          }
        });
        
        try {
          if (sampleItem?.month || sampleItem?.reportMonth || sampleItem?.period) {
            const monthInfo = sampleItem?.month || sampleItem?.reportMonth || sampleItem?.period;
            if (monthInfo !== null && monthInfo !== undefined) {
              setCurrentMonth(safeString(monthInfo, currentMonth));
            }
          }
        } catch (error) {
          console.error('Error extracting month information:', error);
        }
      }
      
      const processedData = processUploadedData(data);
      console.log('Data processed successfully, products count:', processedData.length);
      
      if (processedData.length === 0) {
        console.error('No products were created from the data');
        return;
      }
      
      const productsWithBundleInfo = calculateBundleInformation(processedData);
      
      if (productsWithBundleInfo.length > 0) {
        console.log('First product lead time:', productsWithBundleInfo[0].leadTime);
        console.log('Sample product data with bundle info:', productsWithBundleInfo[0]);
        
        const baseUnits = productsWithBundleInfo.filter(p => p.isBaseUnit);
        console.log('Base units found:', baseUnits.length);
        if (baseUnits.length > 0) {
          const sampleBaseUnit = baseUnits[0];
          console.log(`Sample base unit ${sampleBaseUnit.sku} with pack size ${sampleBaseUnit.packSize} has final order: ${sampleBaseUnit.finalToOrderBaseUnits}`);
          console.log(`Bundled SKUs:`, sampleBaseUnit.bundledSKUs);
        }
        
        const overstockItems = productsWithBundleInfo.filter(p => p.isOverstock);
        console.log('Overstock items found:', overstockItems.length);
      }
      
      console.log('Processed data with bundle info:', productsWithBundleInfo);
      setProducts(productsWithBundleInfo);
      setIsUsingMockData(false);
    } catch (error) {
      console.error('Error in uploadData:', error);
      setProducts([]);
    }
  };

  const resetToMockData = () => {
    setProducts([]);
    setIsUsingMockData(false);
    setCurrentFileName(null);
    setCurrentMonth(new Date().toLocaleString('default', { month: 'long' }));
  };

  const getLowStockItems = async (): Promise<Product[]> => {
    try {
      const { data, error } = await supabase.rpc('get_low_stock_items');
      
      if (error) {
        console.error('Error fetching low stock items:', error);
        return [];
      }
      
      return data.map((item: any) => ({
        id: item.id || crypto.randomUUID(),
        brand: item.brand || '',
        product: item.product || '',
        variant: item.variant || '',
        name: item.name || '',
        sku: item.sku || '',
        category: item.category || 'Uncategorized', // Add category
        wh: safeNumber(item.wh, 0),
        fba: safeNumber(item.fba, 0),
        pasd: safeNumber(item.pasd, 0),
        leadTime: safeNumber(item.lead_time, 0),
        transit: safeNumber(item.transit, 0),
        mpDemand: safeNumber(item.mp_demand, 0),
        toOrder: safeNumber(item.to_order, 0),
        // Include other necessary fields
        isBaseUnit: false,
        isOverstock: false,
        bundledSKUs: [],
        finalToOrderBaseUnits: 0,
        orderFreq: 0,
        salesHistory: []
      }));
    } catch (error) {
      console.error('Error in getLowStockItems:', error);
      return [];
    }
  };
  
  const getOverstockItems = async (): Promise<Product[]> => {
    try {
      const { data, error } = await supabase.rpc('get_overstock_items');
      
      if (error) {
        console.error('Error fetching overstock items:', error);
        return [];
      }
      
      return data.map((item: any) => ({
        id: item.id || crypto.randomUUID(),
        brand: item.brand || '',
        product: item.product || '',
        variant: item.variant || '',
        name: item.name || '',
        sku: item.sku || '',
        category: item.category || 'Uncategorized', // Add category
        wh: safeNumber(item.wh, 0),
        fba: safeNumber(item.fba, 0),
        pasd: safeNumber(item.pasd, 0),
        leadTime: safeNumber(item.lead_time, 0),
        transit: safeNumber(item.transit, 0),
        orderFreq: safeNumber(item.order_freq, 0),
        mpDemand: safeNumber(item.mp_demand, 0),
        toOrder: safeNumber(item.to_order, 0),
        // Include other necessary fields
        isBaseUnit: false,
        isOverstock: true,
        bundledSKUs: [],
        finalToOrderBaseUnits: 0,
        salesHistory: []
      }));
    } catch (error) {
      console.error('Error in getOverstockItems:', error);
      return [];
    }
  };

  const getCurrentMonth = (): string => {
    return currentMonth;
  };

  return (
    <DataContext.Provider 
      value={{ 
        products, 
        isUsingMockData, 
        uploadData, 
        resetToMockData,
        getLowStockItems,
        getOverstockItems,
        getCurrentMonth,
        currentFileName,
        loadFileFromGoogleDrive,
        isLoadingData,
        inventoryMetrics,
        fetchInventoryMetrics
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
