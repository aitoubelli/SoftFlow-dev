"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const Auth = () => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, loading, router]);

  const [isLoading, setIsLoading] = useState(false);
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState("Weak");
  const [activeTab, setActiveTab] = useState("login");

  const { login } = useAuth();

  // Remove client-side user management
  // This useEffect is no longer needed as authentication is handled by the backend.
  useEffect(() => {
    // The AuthProvider now handles token and user state.
    // localStorage.removeItem("users"); // Ensure old local storage data is cleared
    // localStorage.removeItem("currentUser");
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
      toast.error("Please fill in all fields", {
        description: "Login failed.",
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.token) {
          login(data.token);
          toast.success("Logged in successfully!");
          router.push("/dashboard");
        } else {
          toast.error("Authentication token not received.", {
            description: "Please try logging in again.",
          });
        }
      } else {
        toast.error(data.error || "Invalid email or password", {
          description: "Login failed.",
        });
      }
    } catch (error) {
      toast.error("Failed to connect to the server.", {
        description: "Please check your network connection.",
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
      toast.error("Please correct the errors in the form.", {
        description: "Signup failed due to validation errors.",
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: signupName, email: signupEmail, password: signupPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Inscription réussie !", {
          description: "Veuillez vous connecter avec vos identifiants.",
        });
        setActiveTab("login");
        // Clear signup form
        setSignupName("");
        setSignupEmail("");
        setSignupPassword("");
      } else {
        toast.error(data.error || "Failed to create account", {
          description: "Signup failed.",
        });
      }
    } catch (error) {
      toast.error("Failed to connect to the server.", {
        description: "Please check your network connection.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-8">
        <div className="space-y-2 mb-6">
          <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Bienvenue sur ProjectFlow
          </h2>
          <p className="text-center text-gray-500 text-sm">
            Connectez-vous à votre compte ou créez-en un nouveau
          </p>
        </div>
        <div>
          <div className="flex justify-center mb-6 bg-gray-100 rounded-lg p-1">
            <button
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === "login"
                  ? "bg-white text-gray-800 shadow-md"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
              onClick={() => setActiveTab("login")}
            >
              Connexion
            </button>
            <button
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === "signup"
                  ? "bg-white text-gray-800 shadow-md"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
              onClick={() => setActiveTab("signup")}
            >
              Inscription
            </button>
          </div>

          {activeTab === "login" && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="login-email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  placeholder="admin@admin.com"
                  required
                  className="w-full px-4 py-2 bg-blue-50 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-800"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="login-password" className="block text-sm font-medium text-gray-700">
                  Mot de passe
                </label>
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-2 bg-blue-50 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-800"
                />
              </div>
              <button
                type="submit"
                className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-md shadow-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? "Connexion en cours..." : "Se connecter"}
              </button>
            </form>
          )}

          {activeTab === "signup" && (
            <form onSubmit={handleSignup} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="signup-name" className="block text-sm font-medium text-gray-700">
                  Nom complet
                </label>
                <input
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
                  className="w-full px-4 py-2 bg-blue-50 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-800"
                />
                {nameError && <p className="text-red-500 text-sm">{nameError}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
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
                  className="w-full px-4 py-2 bg-blue-50 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-800"
                />
                {emailError && <p className="text-red-500 text-sm">{emailError}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700">
                  Mot de passe
                </label>
                <input
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
                  className="w-full px-4 py-2 bg-blue-50 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-800"
                />
                {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
                {signupPassword && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-700">Strength:</span>
                    <span
                      className={`font-semibold ${
                        passwordStrength === "Weak"
                          ? "text-red-500"
                          : passwordStrength === "Medium"
                          ? "text-yellow-500"
                          : "text-green-500"
                      }`}
                    >
                      {passwordStrength}
                    </span>
                  </div>
                )}
              </div>
              <button
                type="submit"
                className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-md shadow-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? "Création du compte..." : "Créer un compte"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
