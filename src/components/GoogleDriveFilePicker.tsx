
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, FileIcon, RefreshCw, ChevronDown } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface GoogleDriveFileInfo {
  id: string;
  name: string;
  createdTime: string;
  mimeType: string;
}

interface GoogleDriveFilePickerProps {
  onFileSelect: (fileId: string, fileName: string) => Promise<void>;
  currentFileName?: string;
}

const GoogleDriveFilePicker = ({ onFileSelect, currentFileName }: GoogleDriveFilePickerProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [recentFiles, setRecentFiles] = useState<GoogleDriveFileInfo[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchRecentFiles();
  }, []);

  const getAccessToken = async (): Promise<string | null> => {
    return new Promise((resolve) => {
      if (typeof window.google === 'undefined' || !window.google.accounts || !window.google.accounts.oauth2) {
        toast({
          variant: "destructive",
          title: "Google API not loaded",
          description: "Please try refreshing the page."
        });
        resolve(null);
        return;
      }

      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: '308713919748-j4i4giqvgkuluukemumj709k1q279865.apps.googleusercontent.com',
        scope: 'https://www.googleapis.com/auth/drive.readonly',
        callback: (response: any) => {
          if (response.error) {
            console.error('OAuth error:', response);
            toast({
              variant: "destructive",
              title: "Authentication Failed",
              description: response.error_description || "Could not get access to Google Drive."
            });
            resolve(null);
          } else {
            resolve(response.access_token);
          }
        }
      });

      tokenClient.requestAccessToken({ prompt: '' });
    });
  };

  const fetchRecentFiles = async () => {
    setIsLoading(true);
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        setIsLoading(false);
        return;
      }

      // Search for Excel files, sorted by modified time
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=mimeType contains 'spreadsheet' and trashed=false&orderBy=modifiedTime desc&fields=files(id,name,createdTime,mimeType)`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();
      
      if (data.files && data.files.length > 0) {
        setRecentFiles(data.files);
      } else {
        toast({
          title: "No Excel files found",
          description: "No spreadsheet files were found in your Google Drive.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error fetching files:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch files from Google Drive."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileName = (name: string): string => {
    // Display the file name, possibly extracting the date from it
    const dateMatch = name.match(/(\d{1,2}[-\.]\d{1,2}[-\.]\d{2,4})/);
    if (dateMatch) {
      return `Data from ${dateMatch[1]}`;
    }
    return name;
  };

  const handleFileSelect = async (fileId: string, fileName: string) => {
    try {
      await onFileSelect(fileId, fileName);
    } catch (error) {
      console.error('Error selecting file:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process the selected file."
      });
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-md font-medium flex items-center">
          <FileIcon className="h-4 w-4 mr-2" />
          Current Data Source
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center">
            <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>
              {currentFileName 
                ? formatFileName(currentFileName)
                : "No file selected"}
            </span>
          </div>
          
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-1">
                  Switch File
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[240px] max-h-[300px] overflow-y-auto">
                {recentFiles.map((file) => (
                  <DropdownMenuItem
                    key={file.id}
                    onClick={() => handleFileSelect(file.id, file.name)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center">
                      <FileIcon className="h-4 w-4 mr-2" />
                      <span className="truncate">{file.name}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
                {recentFiles.length === 0 && !isLoading && (
                  <div className="p-2 text-center text-muted-foreground text-sm">
                    No Excel files found
                  </div>
                )}
                {isLoading && (
                  <div className="p-2 text-center text-muted-foreground text-sm">
                    Loading files...
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button 
              variant="outline" 
              size="icon"
              onClick={fetchRecentFiles}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GoogleDriveFilePicker;
