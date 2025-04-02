
import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

  useEffect(() => {
    if (!isAuthenticated && location.pathname !== '/login') {
      navigate('/login');
    }
  }, [isAuthenticated, navigate, location]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App = () => {
  // Dynamically check if user is authenticated for the root redirect
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter basename="/buddy-inventory-clone">
          <Routes>
            <Route path="/login" element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
            } />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } 
            />
            {/* Redirect root to dashboard if logged in, otherwise to login */}
            <Route 
              path="/" 
              element={
                isAuthenticated 
                  ? <Navigate to="/dashboard" replace /> 
                  : <Navigate to="/login" replace />
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
