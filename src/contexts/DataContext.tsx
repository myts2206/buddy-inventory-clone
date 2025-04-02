
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Product, inventoryMetrics } from '@/lib/types';
import { processUploadedData } from '@/lib/dataProcessor';
import { calculateBundleInformation, isProductOverstocked } from '@/lib/bundleCalculator';
import { safeNumber, exists, safeString } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';

interface DataContextType {
  products: Product[];
  isUsingMockData: boolean;
  uploadData: (data: any[]) => void;
  resetToMockData: () => void;
  getLowStockItems: () => Product[];
  getOverstockItems: () => Product[];
  getCurrentMonth: () => string;
  currentFileName: string | null;
  loadFileFromGoogleDrive: (fileId: string, fileName: string) => Promise<boolean>;
  isLoadingData: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  // Initialize with empty array
  const [products, setProducts] = useState<Product[]>([]);
  const [isUsingMockData, setIsUsingMockData] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<string>(() => {
    // Default to the current month name
    return new Date().toLocaleString('default', { month: 'long' });
  });
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const { toast } = useToast();

  // Load data on initial render if user is authenticated
  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    
    // Only try to auto-load data if user is authenticated
    if (isAuthenticated) {
      // Try to load the latest file automatically
      autoLoadLatestFile();
    }
  }, []);

  const autoLoadLatestFile = async () => {
    try {
      setIsLoadingData(true);
      
      // Load the Google API
      await loadGoogleApi();
      
      // Get OAuth token
      const accessToken = await getGoogleDriveAccessToken();
      if (!accessToken) {
        console.error('Failed to get access token for auto-loading');
        return;
      }
      
      // Search for the latest Excel file
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
        client_id: '570416026363-6vc4d3b0rehro504289npl7sj3sv7h4q.apps.googleusercontent.com',
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
      
      // Download the file content
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
      
      // Try to extract date from filename for the month display
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
      
      // Add more detailed logging to see exactly what's in the Excel for lead time
      if (data.length > 0) {
        // Print all column headers exactly as they appear in the Excel
        const sampleItem = data[0];
        console.log('All column headers as in Excel:', Object.keys(sampleItem));
        
        // Safely check for lead time field in the raw data
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
        
        // Log the actual value in the first item safely
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
        
        // Try to extract month information from file metadata if available
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
      
      // Process the uploaded data with our data processor
      const processedData = processUploadedData(data);
      console.log('Data processed successfully, products count:', processedData.length);
      
      if (processedData.length === 0) {
        console.error('No products were created from the data');
        return;
      }
      
      // Apply bundle calculations
      const productsWithBundleInfo = calculateBundleInformation(processedData);
      
      // Log some samples to diagnose issues
      if (productsWithBundleInfo.length > 0) {
        console.log('First product lead time:', productsWithBundleInfo[0].leadTime);
        console.log('Sample product data with bundle info:', productsWithBundleInfo[0]);
        
        // Log bundle groups
        const baseUnits = productsWithBundleInfo.filter(p => p.isBaseUnit);
        console.log('Base units found:', baseUnits.length);
        if (baseUnits.length > 0) {
          const sampleBaseUnit = baseUnits[0];
          console.log(`Sample base unit ${sampleBaseUnit.sku} with pack size ${sampleBaseUnit.packSize} has final order: ${sampleBaseUnit.finalToOrderBaseUnits}`);
          console.log(`Bundled SKUs:`, sampleBaseUnit.bundledSKUs);
        }
        
        // Log overstock items
        const overstockItems = productsWithBundleInfo.filter(p => p.isOverstock);
        console.log('Overstock items found:', overstockItems.length);
      }
      
      console.log('Processed data with bundle info:', productsWithBundleInfo);
      setProducts(productsWithBundleInfo);
      setIsUsingMockData(false);
    } catch (error) {
      console.error('Error in uploadData:', error);
      // Set to empty array to avoid crashes
      setProducts([]);
    }
  };

  const resetToMockData = () => {
    // Reset to empty array
    setProducts([]);
    setIsUsingMockData(false);
    setCurrentFileName(null);
    // Reset month to current month
    setCurrentMonth(new Date().toLocaleString('default', { month: 'long' }));
  };

  // Calculate low stock items based on the formula: (WH + FBA) < (PASD × (Lead Time + Transit Time))
  const getLowStockItems = (): Product[] => {
    try {
      return products.filter(product => {
        // Use safe utility functions to handle mixed data types
        const pasd = safeNumber(product.pasd, 0);
        const leadTime = safeNumber(product.leadTime, 0);
        const transitTime = safeNumber(product.transit, 0);
        
        // Skip products without necessary data
        if (pasd <= 0 || leadTime <= 0) {
          return false;
        }
        
        // Calculate available inventory - using only what's in the dataset
        const warehouseStock = safeNumber(product.wh, 0);
        const fbaStock = safeNumber(product.fba, 0);
        
        // Calculate available inventory (WH + FBA)
        const availableInventory = warehouseStock + fbaStock;
        
        // Calculate low stock threshold: PASD × (Lead Time + Transit Time)
        const lowStockThreshold = pasd * (leadTime + transitTime);
        
        // Flag if available inventory is below threshold and the threshold is valid
        return lowStockThreshold > 0 && availableInventory < lowStockThreshold;
      });
    } catch (error) {
      console.error('Error in getLowStockItems:', error);
      return [];
    }
  };
  
  // Calculate overstock items based on the formula: WH > PASD * Order Frequency * 1.5
  const getOverstockItems = (): Product[] => {
    try {
      return products.filter(product => isProductOverstocked(product));
    } catch (error) {
      console.error('Error in getOverstockItems:', error);
      return [];
    }
  };

  // Get the current month being displayed
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
        isLoadingData
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

// Add TypeScript declaration for Google OAuth
declare global {
  interface Window {
    google: {
      accounts: {
        oauth2: {
          initTokenClient: (config: any) => {
            requestAccessToken: (options?: any) => void;
          };
        };
      };
    };
  }
}

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
