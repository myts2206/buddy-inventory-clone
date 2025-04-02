
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Info, FileSpreadsheet, CheckCircle2, History, RefreshCw } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useData } from '@/contexts/DataContext';
import * as XLSX from 'xlsx';
// @ts-ignore
declare const google: any;
// @ts-ignore
declare const gapi: any;

interface ExcelUploaderProps {
  onDataUploaded: () => void;
}

const ExcelUploader = ({ onDataUploaded }: ExcelUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const [fileName, setFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showMonthlyData, setShowMonthlyData] = useState(false);
  const { toast } = useToast();
  const { uploadData } = useData();

  // Auto-load latest data on component mount
  useEffect(() => {
    const autoLoadLatestData = async () => {
      // Only auto-load if we haven't uploaded data yet
      if (!isUploaded) {
        try {
          setIsLoading(true);
          const latestFile = await fetchLatestFileFromGoogleDrive();
          if (latestFile) {
            await processFile(latestFile);
            toast({
              title: "Latest data loaded automatically",
              description: `Loaded ${latestFile.name} from Google Drive`,
              variant: "default"
            });
          }
        } catch (error) {
          console.error('Error auto-loading data:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    // We need to load the Google APIs first before auto-loading
    loadGoogleApis().then(() => {
      autoLoadLatestData();
    }).catch(error => {
      console.error('Failed to load Google APIs:', error);
    });
  }, []);

  const loadGoogleApis = async (): Promise<void> => {
    // Load Google Identity Services
    if (typeof google === 'undefined') {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
        document.body.appendChild(script);
      });
    }

    // Load Google Picker API
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.async = true;
      script.onload = () => {
        gapi.load('picker', resolve);
      };
      script.onerror = () => reject(new Error('Failed to load Google Picker API'));
      document.body.appendChild(script);
    });
  };

  const fetchLatestFileFromGoogleDrive = async (): Promise<File | null> => {
    try {
      // Request Google Drive access token
      const accessToken = await getGoogleDriveAccessToken();
      
      if (!accessToken) {
        console.error('No access token available');
        return null;
      }

      // Search for the latest inventory file
      // Here we're looking for Excel files with a specific naming convention
      // Adjust the query as needed for your file naming pattern
      const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=name contains 'inventory' and mimeType contains 'spreadsheet' and trashed=false&orderBy=createdTime desc&fields=files(id,name,createdTime)&pageSize=1`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();
      
      if (!data.files || data.files.length === 0) {
        console.log('No inventory files found');
        return null;
      }

      const latestFile = data.files[0];
      console.log('Found latest inventory file:', latestFile);

      // Download the file
      const fileResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${latestFile.id}?alt=media`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const blob = await fileResponse.blob();
      return new File([blob], latestFile.name);

    } catch (error) {
      console.error('Error fetching latest file:', error);
      throw error;
    }
  };

  const getGoogleDriveAccessToken = async (): Promise<string | null> => {
    return new Promise((resolve) => {
      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: '308713919748-j4i4giqvgkuluukemumj709k1q279865.apps.googleusercontent.com',
        scope: 'https://www.googleapis.com/auth/drive.readonly',
        callback: (response: any) => {
          if (response.access_token) {
            resolve(response.access_token);
          } else {
            resolve(null);
          }
        }
      });

      tokenClient.requestAccessToken();
    });
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length) {
      processFile(files[0]);
    }
  };

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
      toast({
        title: "Invalid file format",
        description: "Please upload an Excel (.xlsx, .xls) or CSV file",
        variant: "destructive"
      });
      return false;
    }

    setFileName(file.name);
    setIsLoading(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (!jsonData.length) {
        toast({
          title: "Empty file",
          description: "The uploaded file doesn't contain any data.",
          variant: "destructive"
        });
        setIsLoading(false);
        return false;
      }

      uploadData(jsonData);
      setIsUploaded(true);
      onDataUploaded();
      toast({
        title: "Data uploaded successfully",
        description: `Loaded ${jsonData.length} records from ${file.name}`,
        variant: "default"
      });
      return true;
    } catch (error) {
      console.error('Error processing Excel file:', error);
      toast({
        title: "Error processing file",
        description: "There was an error reading your Excel file. Please check the format and try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleDriveFile = async (monthlyView = false) => {
    try {
      await loadGoogleApis();

      const accessToken = await getGoogleDriveAccessToken();
      
      if (!accessToken) {
        toast({
          title: "Authentication Error",
          description: "Failed to get Google Drive access token",
          variant: "destructive"
        });
        return;
      }

      let picker;
      
      if (monthlyView) {
        // Show custom view for monthly data files
        picker = new google.picker.PickerBuilder()
          .addView(new google.picker.DocsView()
            .setIncludeFolders(true)
            .setSelectFolderEnabled(false)
            .setMimeTypes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv')
            .setQuery('monthly inventory')
          )
          .setTitle('Select Monthly Inventory Data')
          .setOAuthToken(accessToken)
          .setDeveloperKey('AIzaSyCYDj_5YgUEmzq8WSRe0H7nLvflB5COug8')
          .setCallback(handlePickerCallback)
          .build();
      } else {
        // Standard file picker
        picker = new google.picker.PickerBuilder()
          .addView(google.picker.ViewId.SPREADSHEETS)
          .setOAuthToken(accessToken)
          .setDeveloperKey('AIzaSyCYDj_5YgUEmzq8WSRe0H7nLvflB5COug8')
          .setCallback(handlePickerCallback)
          .build();
      }

      picker.setVisible(true);
    } catch (error) {
      console.error('Picker error:', error);
      toast({
        title: "Google Picker Error",
        description: "Could not load file picker.",
        variant: "destructive"
      });
    }
  };

  const handlePickerCallback = async (data: any) => {
    if (data.action === 'picked') {
      const fileId = data.docs[0].id;
      const fileName = data.docs[0].name;
      setIsLoading(true);
      
      try {
        const accessToken = await getGoogleDriveAccessToken();
        if (!accessToken) return;
        
        const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        
        const blob = await res.blob();
        const file = new File([blob], fileName);
        await processFile(file);
      } catch (error) {
        console.error('Error processing picked file:', error);
        toast({
          title: "Error",
          description: "Failed to process the selected file",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const refreshLatestData = async () => {
    setIsLoading(true);
    try {
      const latestFile = await fetchLatestFileFromGoogleDrive();
      if (latestFile) {
        await processFile(latestFile);
      } else {
        toast({
          title: "No files found",
          description: "Could not find inventory files in Google Drive",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: "Refresh Error",
        description: "Could not refresh data from Google Drive",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Excel Data Upload
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!isUploaded ? (
          <div>
            <div
              className={`border-2 border-dashed rounded-lg p-10 text-center ${
                isDragging ? 'border-primary bg-primary/5' : 'border-border'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleFileDrop}
            >
              {isLoading ? (
                <div className="flex flex-col items-center justify-center">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4"></div>
                  <h3 className="text-lg font-medium">Loading data...</h3>
                </div>
              ) : (
                <>
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    Drag & Drop your Excel file here
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Or click below to browse files
                  </p>
                  <div className="relative mb-4">
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={handleFileChange}
                    />
                    <Button>Browse Files</Button>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Button variant="outline" onClick={() => handleGoogleDriveFile(false)}>
                      Pick from Google Drive
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleGoogleDriveFile(true)}
                      className="flex items-center gap-1"
                    >
                      <History className="h-4 w-4" />
                      Access Monthly Data
                    </Button>
                    <Button
                      variant="outline"
                      onClick={refreshLatestData}
                      className="flex items-center gap-1"
                      disabled={isLoading}
                    >
                      <RefreshCw className="h-4 w-4" />
                      Refresh Latest Data
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <CheckCircle2 className="h-10 w-10 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">
              File uploaded successfully
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {fileName}
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button variant="outline" onClick={() => setIsUploaded(false)}>
                Upload a different file
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleGoogleDriveFile(true)}
                className="flex items-center gap-1"
              >
                <History className="h-4 w-4" />
                Access Monthly Data
              </Button>
              <Button
                variant="outline"
                onClick={refreshLatestData}
                className="flex items-center gap-1"
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Latest Data
              </Button>
            </div>
          </div>
        )}

        <div className="mt-6 p-4 rounded-lg bg-secondary/50 border border-secondary">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium mb-1">Supported Data Format</h4>
              <p className="text-sm text-muted-foreground">
                Your Excel file should include these columns:
              </p>
              <ul className="text-sm text-muted-foreground mt-1 space-y-1 list-disc list-inside ml-2">
                <li>Brand, Product, Variant, Product Name, ASINs, GS1 CODE, SKU, FSN, Vendor AMZ...</li>
                <li>Column1, Launch Type, Vendor2, FBA Sales, RK/RZ Sale, Amazon sale, Amazon ASD...</li>
                <li>Amazon Growth, Max DRR, Amazon PASD, Diff, CT Target Inventory, Amazon Inventory...</li>
                <li>FBA, Amazon Demand, FK Alpha Sales, FK Alpha Inv, FK Sales, FBF Inv, FK Sales Total...</li>
                <li>FK Inv, FK ASD, FK Growth, Max DRR2, FK PASD, FK Demand, Other MP Sales...</li>
                <li>QC PASD, Qcommerce Demand, WH, Lead Time, Order Frequ, PASD...</li>
                <li>MP Demand, Transit, To Order, Final Order, Remark, Days inventory in hand/total...</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-2">
                Missing fields will be calculated based on available data.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExcelUploader;
