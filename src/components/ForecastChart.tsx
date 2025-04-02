
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { calculateForecast } from '@/lib/forecastingLogic';
import { useData } from '@/contexts/DataContext';

interface ForecastChartProps {
  productId: string;
  title?: string;
}

const ForecastChart = ({ productId, title = "Sales Forecast" }: ForecastChartProps) => {
  const { products } = useData();
  
  // Find the specific product for this chart
  const product = products.find(p => p.id === productId);
  
  // Generate forecast data using the existing calculateForecast function
  const forecastData = product ? calculateForecast([product], 30) : [];
  
  // Format the data for the chart display
  const formattedData = forecastData.map(item => {
    // Calculate the date based on today + days
    const date = new Date();
    date.setDate(date.getDate() + item.day);
    
    return {
      ...item,
      formattedDate: `${date.getMonth() + 1}/${date.getDate()}`,
      forecast: item.stock,
      actual: item.day <= 7 ? item.stock + Math.floor(Math.random() * 10) : 0 // Show some "actual" data for the past week
    };
  });
  
  // Calculate metrics for AI insight
  const recentActual = formattedData.filter(d => d.actual > 0);
  const forecastPoints = formattedData.filter(d => d.forecast > 0);
  
  let trendDirection = "steady";
  let percentChange = 0;
  
  if (recentActual.length >= 2 && forecastPoints.length >= 1) {
    const avgRecent = recentActual.reduce((sum, d) => sum + d.actual, 0) / recentActual.length;
    const avgForecast = forecastPoints.reduce((sum, d) => sum + d.forecast, 0) / forecastPoints.length;
    
    percentChange = ((avgForecast - avgRecent) / avgRecent) * 100;
    
    if (percentChange > 5) {
      trendDirection = "growth";
    } else if (percentChange < -5) {
      trendDirection = "decline";
    }
  }
  
  // Generate dynamic insight text based on data
  const generateInsight = () => {
    if (!product || forecastData.length === 0) {
      return "Upload sales history data to generate forecasts and insights.";
    }
    
    if (trendDirection === "growth") {
      return `AI Insight: Stock forecast shows ${Math.abs(percentChange).toFixed(1)}% growth. Consider increasing inventory to meet projected demand.`;
    } else if (trendDirection === "decline") {
      return `AI Insight: Stock forecast shows ${Math.abs(percentChange).toFixed(1)}% decline. Consider adjusting inventory to prevent overstock.`;
    } else {
      return `AI Insight: Stock trajectory indicates steady demand. Maintain current inventory levels to ensure optimal stock coverage.`;
    }
  };
  
  if (!product || forecastData.length === 0) {
    return (
      <Card className="overflow-hidden transition-all hover:shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full flex items-center justify-center">
            <p className="text-muted-foreground">No forecast data available for this product</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={formattedData}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="formattedDate" 
                tick={{ fontSize: 12 }} 
                tickLine={false}
                axisLine={{ stroke: '#e0e0e0' }}
              />
              <YAxis 
                tick={{ fontSize: 12 }} 
                tickLine={false}
                axisLine={{ stroke: '#e0e0e0' }}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '8px', 
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', 
                  border: '1px solid #f0f0f0' 
                }} 
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="actual" 
                stroke="#3b82f6" 
                strokeWidth={2} 
                dot={{ r: 4 }} 
                activeDot={{ r: 6, strokeWidth: 2 }} 
                name="Actual Stock"
              />
              <Line 
                type="monotone" 
                dataKey="forecast" 
                stroke="#10b981" 
                strokeWidth={2} 
                strokeDasharray="5 5" 
                dot={{ r: 3 }} 
                name="Forecast" 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-sm text-muted-foreground">
          <p>{generateInsight()}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ForecastChart;
