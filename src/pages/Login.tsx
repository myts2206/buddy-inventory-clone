
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Package, ArrowRight, User, Lock } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // For demo purposes - validate login
    if (username && password) {
      toast({
        title: "Login successful",
        description: "Welcome to BOLDFIT Inventory Management",
      });
      navigate('/dashboard');
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
                <ArrowRight className="h-5 w-5" />
              </div>
              <p className="font-medium">Real-time inventory tracking</p>
            </div>
            
            <div className="flex items-center mb-4">
              <div className="rounded-full bg-primary-foreground/20 p-2 mr-4">
                <ArrowRight className="h-5 w-5" />
              </div>
              <p className="font-medium">Advanced analytics dashboard</p>
            </div>
            
            <div className="flex items-center">
              <div className="rounded-full bg-primary-foreground/20 p-2 mr-4">
                <ArrowRight className="h-5 w-5" />
              </div>
              <p className="font-medium">Smart reorder recommendations</p>
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
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
            </CardContent>
            
            <CardFooter>
              <Button type="submit" className="w-full">
                Login
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Login;
