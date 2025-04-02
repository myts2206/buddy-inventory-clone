
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SearchContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedVendor: string | null;
  setSelectedVendor: (vendor: string | null) => void;
  filterType: 'all' | 'lowStock' | 'toOrder';
  setFilterType: (type: 'all' | 'lowStock' | 'toOrder') => void;
  priorityFilter: 'all' | 'P1' | 'P2' | 'P3';
  setPriorityFilter: (priority: 'all' | 'P1' | 'P2' | 'P3') => void;
  vendorFilter: string | null;
  setVendorFilter: (vendor: string | null) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider = ({ children }: { children: ReactNode }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'lowStock' | 'toOrder'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'P1' | 'P2' | 'P3'>('all');
  const [vendorFilter, setVendorFilter] = useState<string | null>(null);

  return (
    <SearchContext.Provider value={{ 
      searchQuery, 
      setSearchQuery,
      selectedVendor,
      setSelectedVendor,
      filterType,
      setFilterType,
      priorityFilter,
      setPriorityFilter,
      vendorFilter,
      setVendorFilter
    }}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};
