
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Upload } from 'lucide-react';
import { boldFitSampleData } from '@/demo/boldfit-sample';
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';

interface BoldFitSampleDataProps {
  onShowUploader: () => void;
}

const BoldFitSampleData = ({ onShowUploader }: BoldFitSampleDataProps) => {
  const { toast } = useToast();

  const handleDownloadSample = () => {
    try {
      // Create a new workbook
      const wb = XLSX.utils.book_new();
      
      // Convert data to worksheet
      const ws = XLSX.utils.json_to_sheet(boldFitSampleData);
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "BoldFit Products");
      
      // Generate XLSX file and trigger download
      XLSX.writeFile(wb, "boldfit-sample-data.xlsx");
      
      toast({
        title: "Sample file downloaded",
        description: "BoldFit sample data has been downloaded successfully.",
      });
    } catch (error) {
      console.error("Error downloading sample data:", error);
      toast({
        variant: "destructive",
        title: "Download failed",
        description: "There was an error downloading the sample data.",
      });
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          BoldFit Sample Dataset
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-muted-foreground">
            BoldFit is a fitness and healthcare products company with a comprehensive inventory.
            Download the sample dataset and then upload it to see the analytics in action.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleDownloadSample} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download Sample Data
            </Button>
            
            <Button variant="outline" onClick={onShowUploader} className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Go to Upload Page
            </Button>
          </div>
          
          <div className="mt-2 text-sm text-muted-foreground">
            <p>The sample dataset includes:</p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li><strong>DOC (Days of Coverage)</strong>: The number of days the current stock will last based on daily run rate. Calculated as: Current Stock / DRR</li>
              <li><strong>DRR (Daily Run Rate)</strong>: Average daily consumption or usage rate of a product in units per day</li>
              <li><strong>Target</strong>: The optimal replenishment quantity calculated as: DRR × [(Lead Time + Transit Time) - DOC]</li>
              <li><strong>Service Level</strong>: Probability of not having a stockout (values from 0 to 1)</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BoldFitSampleData;
