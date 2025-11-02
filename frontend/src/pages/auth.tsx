"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils"; // Import cn utility

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState("Weak");

  const router = useRouter();
  const { toast } = useToast();

  // Remove client-side user management
  // This useEffect is no longer needed as authentication is handled by the backend.
  useEffect(() => {
    localStorage.removeItem("users"); // Ensure old local storage data is cleared
    localStorage.removeItem("currentUser");
  }, []);

  const checkPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length > 0) strength++; // Not empty
    if (password.length >= 8) strength++; // Minimum length
    if (/[A-Z]/.test(password)) strength++; // Uppercase
    if (/[a-z]/.test(password)) strength++; // Lowercase
    if (/[0-9]/.test(password)) strength++; // Number
    if (/[^A-Za-z0-9]/.test(password)) strength++; // Special character

    if (strength < 3) return "Weak";
    if (strength < 5) return "Medium";
    return "Strong";
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("currentUser", JSON.stringify(data.user));
        toast({
          title: "Success",
          description: "Logged in successfully!",
        });
        router.push("/dashboard");
      } else {
        toast({
          title: "Error",
          description: data.error || "Invalid email or password",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to the server.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setNameError("");
    setEmailError("");
    setPasswordError("");

    let hasError = false;

    if (!signupName.trim()) {
      setNameError("Name is required.");
      hasError = true;
    }

    if (!signupEmail.trim()) {
      setEmailError("Email is required.");
      hasError = true;
    } else if (!/^\S+@\S+\.\S+$/.test(signupEmail)) {
      setEmailError("Invalid email format.");
      hasError = true;
    }

    if (!signupPassword) {
      setPasswordError("Password is required.");
      hasError = true;
    } else if (signupPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      hasError = true;
    } else if (checkPasswordStrength(signupPassword) === "Weak") {
      setPasswordError("Password is too weak. Please include uppercase, lowercase, numbers, and special characters.");
      hasError = true;
    }

    if (hasError) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: signupName, email: signupEmail, password: signupPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Account created successfully!",
        });
        router.push("/dashboard");
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create account",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to the server.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center bg-gradient-hero bg-clip-text text-transparent">
            Bienvenue sur ProjectFlow
          </CardTitle>
          <CardDescription className="text-center">
            Connectez-vous à votre compte ou créez-en un nouveau
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Connexion</TabsTrigger>
              <TabsTrigger value="signup">Inscription</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Mot de passe</Label>
                  <Input
                    id="login-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  variant="hero"
                  disabled={isLoading}
                >
                  {isLoading ? "Connexion en cours..." : "Se connecter"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nom complet</Label>
                  <Input
                    id="signup-name"
                    name="name"
                    type="text"
                    placeholder="John Doe"
                    required
                    value={signupName}
                    onChange={(e) => {
                      setSignupName(e.target.value);
                      setNameError("");
                    }}
                  />
                  {nameError && <p className="text-red-500 text-sm">{nameError}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={signupEmail}
                    onChange={(e) => {
                      setSignupEmail(e.target.value);
                      setEmailError("");
                    }}
                  />
                  {emailError && <p className="text-red-500 text-sm">{emailError}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Mot de passe</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    value={signupPassword}
                    onChange={(e) => {
                      setSignupPassword(e.target.value);
                      setPasswordError("");
                      setPasswordStrength(checkPasswordStrength(e.target.value));
                    }}
                  />
                  {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
                  {signupPassword && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">Strength:</span>
                      <span
                        className={cn(
                          "font-semibold",
                          passwordStrength === "Weak" && "text-red-500",
                          passwordStrength === "Medium" && "text-yellow-500",
                          passwordStrength === "Strong" && "text-green-500"
                        )}
                      >
                        {passwordStrength}
                      </span>
                    </div>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  variant="hero"
                  disabled={isLoading}
                >
                  {isLoading ? "Création du compte..." : "Créer un compte"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
