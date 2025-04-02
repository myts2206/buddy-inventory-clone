
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Safely format a number with specified decimal places
export function formatNumber(value: any, decimalPlaces: number = 2): string {
  try {
    // If value is null, undefined, or empty string, return empty string
    if (value === null || value === undefined || value === '') {
      return '';
    }
    
    // Convert string to number if needed
    let num: number;
    if (typeof value === 'string') {
      // Check if the string only contains numeric characters
      if (/^-?\d*\.?\d+$/.test(value.trim())) {
        num = parseFloat(value);
      } else {
        // If string contains non-numeric characters, return as is
        return String(value);
      }
    } else if (typeof value === 'number') {
      num = value;
    } else {
      // For other types, return as string
      return String(value);
    }
    
    // Check if it's a valid number after conversion
    if (isNaN(num)) {
      return String(value); // Return original value if it can't be converted
    }
    
    // Format with specified decimal places
    return num.toFixed(decimalPlaces);
  } catch (error) {
    console.error('Error formatting number:', error, value);
    return String(value); // Return as string on any error
  }
}

// Safely convert any value to a number for calculations
export function safeNumber(value: any, defaultValue: number = 0): number {
  try {
    if (value === null || value === undefined || value === '') {
      return defaultValue;
    }
    
    // Handle different data types
    if (typeof value === 'number') {
      return isNaN(value) ? defaultValue : value;
    }
    
    if (typeof value === 'string') {
      const trimmedValue = value.trim();
      // Check if the string only contains numeric characters
      if (/^-?\d*\.?\d+$/.test(trimmedValue)) {
        const num = parseFloat(trimmedValue);
        return isNaN(num) ? defaultValue : num;
      }
      return defaultValue;
    }
    
    if (typeof value === 'boolean') {
      return value ? 1 : 0;
    }
    
    // For any other type, try to convert or use default
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
  } catch (error) {
    console.error('Error in safeNumber:', error, value);
    return defaultValue;
  }
}

// Safely check if a value exists (not null, undefined, or empty string)
export function exists(value: any): boolean {
  return value !== null && value !== undefined && value !== '';
}

// Safely convert any value to a string
export function safeString(value: any, defaultValue: string = ''): string {
  try {
    if (value === null || value === undefined) {
      return defaultValue;
    }
    
    return String(value);
  } catch (error) {
    console.error('Error in safeString:', error, value);
    return defaultValue;
  }
}
