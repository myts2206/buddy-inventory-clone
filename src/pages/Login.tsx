
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Package, Mail, Lock } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { FcGoogle } from "react-icons/fc";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Get the current hostname for the redirect URI
  const getRedirectUri = () => {
    const location = window.location;
    const hostname = location.hostname;
    const port = location.port ? `:${location.port}` : '';
    const protocol = location.protocol;
    
    // For localhost development
    if (hostname === 'localhost') {
      return `${protocol}//${hostname}${port}/dashboard`;
    }
    
    // For production environment - use the full current URL up to the path
    return `${protocol}//${hostname}${port}`;
  };

  useEffect(() => {
    // Load Google Identity Services
    const loadGoogleScript = async () => {
      if (typeof window.google === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          setIsGoogleLoaded(true);
          initializeGoogleSignIn();
        };
        document.body.appendChild(script);
      } else {
        setIsGoogleLoaded(true);
        initializeGoogleSignIn();
      }
    };

    loadGoogleScript();
  }, []);

  const initializeGoogleSignIn = () => {
    if (typeof window.google !== 'undefined' && window.google.accounts && window.google.accounts.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: '308713919748-j4i4giqvgkuluukemumj709k1q279865.apps.googleusercontent.com',
          callback: handleGoogleResponse,
          auto_select: false,
          cancel_on_tap_outside: true
        });

        window.google.accounts.id.renderButton(
          document.getElementById('google-signin'),
          { 
            type: 'standard',
            theme: 'outline',
            size: 'large',
            width: 280,
            logo_alignment: 'center',
            text: 'continue_with'
          }
        );
        
        console.log('Google Sign-In initialized with redirect URI:', getRedirectUri());
      } catch (error) {
        console.error('Error initializing Google Sign-In:', error);
        toast({
          variant: "destructive",
          title: "Google Sign-In Error",
          description: "Failed to initialize Google Sign-In. Please refresh the page."
        });
      }
    }
  };

  const handleGoogleResponse = async (response: any) => {
    try {
      setIsAuthenticating(true);
      
      console.log('Google response received');
      
      // In a real application, you would validate this token on your backend
      // For this demo, we'll just use the presence of the credential as proof of authentication
      if (response && response.credential) {
        // Store the authentication token and status
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('googleToken', response.credential);
        
        toast({
          title: "Login successful",
          description: "Welcome to BOLDFIT Inventory Management",
        });
        
        // Navigate to dashboard after successful login
        setTimeout(() => {
          navigate('/dashboard');
        }, 100);
      } else {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: "Authentication with Google failed. Please try again.",
        });
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      toast({
        variant: "destructive",
        title: "Login error",
        description: "An error occurred during authentication. Please try again.",
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleRegularLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Regular username/password login logic
    if (username && password) {
      localStorage.setItem('isAuthenticated', 'true');
      toast({
        title: "Login successful",
        description: "Welcome to BOLDFIT Inventory Management",
      });
      setTimeout(() => {
        navigate('/dashboard');
      }, 100);
    } else {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: "Please enter both username and password",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Left Section - Branding */}
      <div className="w-full md:w-1/2 bg-primary flex flex-col items-center justify-center p-8 text-primary-foreground">
        <div className="max-w-md text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start mb-6">
            <Package className="h-12 w-12 mr-3" />
            <h1 className="text-3xl md:text-4xl font-bold">BOLDFIT</h1>
          </div>
          
          <h2 className="text-2xl md:text-3xl font-semibold mb-6">Inventory Management System</h2>
          
          <p className="text-lg mb-8 opacity-90">
            Streamline your inventory processes and optimize your supply chain with our powerful management platform.
          </p>
          
          <div className="hidden md:block">
            <div className="flex items-center mb-4">
              <div className="rounded-full bg-primary-foreground/20 p-2 mr-4">
                <Mail className="h-5 w-5" />
              </div>
              <p className="font-medium">Sign in with your Google account</p>
            </div>
            
            <div className="flex items-center mb-4">
              <div className="rounded-full bg-primary-foreground/20 p-2 mr-4">
                <Package className="h-5 w-5" />
              </div>
              <p className="font-medium">Access all your inventory data</p>
            </div>
            
            <div className="flex items-center">
              <div className="rounded-full bg-primary-foreground/20 p-2 mr-4">
                <Package className="h-5 w-5" />
              </div>
              <p className="font-medium">Latest data is automatically loaded</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Section - Login Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
            <CardDescription className="text-center">
              Sign in to access your inventory data
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Google Sign-In Button */}
            <div className="w-full">
              <div 
                id="google-signin" 
                className={`w-full flex justify-center ${!isGoogleLoaded ? 'opacity-50' : ''}`}
              ></div>
              {!isGoogleLoaded && (
                <div className="w-full mt-2 text-center text-sm text-muted-foreground">
                  Loading Google Sign-In...
                </div>
              )}
            </div>
            
            <div className="relative flex items-center">
              <span className="w-full border-t"></span>
              <span className="px-4 text-xs text-muted-foreground">OR</span>
              <span className="w-full border-t"></span>
            </div>
            
            <form onSubmit={handleRegularLoginSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="username" 
                      placeholder="Enter your username" 
                      className="pl-10" 
                      value={username} 
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="Enter your password" 
                      className="pl-10" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
                
                <Button type="submit" className="w-full">
                  Login
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
