
import React from 'react';
import { Bell, Search, Settings, LogOut, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { useSearch } from '@/contexts/SearchContext';

const Header = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { searchQuery, setSearchQuery } = useSearch();

  const handleLogout = () => {
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of your account",
    });
    navigate('/login');
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <header className="w-full border-b border-border bg-background/95 backdrop-blur-sm transition-all">
      <div className="container flex h-16 items-center px-6 sm:justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold tracking-tight">BOLDFIT</h2>
        </div>
        
        <div className="ml-auto hidden md:flex items-center gap-6">
          <div className="w-full max-w-sm items-center relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="Search products..."
              className="w-full bg-background pl-8 focus-visible:ring-primary" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-0 top-0 h-10 w-10"
                onClick={clearSearch}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <Button size="icon" variant="ghost" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
              3
            </span>
          </Button>
          
          <Button size="icon" variant="ghost">
            <Settings className="h-5 w-5" />
          </Button>

          <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
