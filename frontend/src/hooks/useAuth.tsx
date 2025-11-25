import { useRouter } from 'next/dist/client/components/navigation';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string; // Changed from _id to id to match decoded token
  name: string;
  email: string;
  role: 'admin' | 'owner' | 'dev';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  refreshUser: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    console.log("Auth: Initializing AuthProvider, attempting to load token from localStorage...");
    const storedToken = localStorage.getItem('token');

    if (storedToken) {
      console.log("Auth: Token found in localStorage. Attempting to decode.");
      try {
        const tokenParts = storedToken.split('.');
        if (tokenParts.length !== 3) {
          throw new Error("Invalid token format");
        }
        const decoded = JSON.parse(atob(tokenParts[1]));
        setUser({ id: decoded.id, name: decoded.name, email: decoded.email, role: decoded.role });
        setToken(storedToken); // Set token state after successful decode
        console.log("Auth: Token decoded and user set from localStorage.");
      } catch (error) {
        console.error("Auth: Failed to decode stored token or invalid token structure.", error);
        // If token is invalid, clear it
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      }
    } else {
      console.log("Auth: No token found in localStorage.");
    }
    setLoading(false); // Authentication check complete
  }, []);

  const login = (newToken: string) => {
    console.log("Auth: Login called, setting new token and saving to localStorage.");
    localStorage.setItem('token', newToken);
    setToken(newToken);
    // Decode token immediately after login
    try {
      const tokenParts = newToken.split('.');
      if (tokenParts.length !== 3) {
        throw new Error("Invalid token format");
      }
      const decoded = JSON.parse(atob(tokenParts[1]));
      setUser({ id: decoded.id, name: decoded.name, email: decoded.email, role: decoded.role });
    } catch (error) {
      console.error("Auth: Failed to decode new token after login.", error);
      logout(); // If new token is invalid, log out
    }
  };

  const refreshUser = async () => {
    console.log("Auth: Refreshing user data...");
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      console.log("Auth: No token found for refresh.");
      return;
    }

    try {
      const response = await fetch('/api/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${storedToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const updatedUser = {
          id: data.user._id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role
        };
        setUser(updatedUser);
        console.log("Auth: User data refreshed successfully.");
      } else {
        console.log("Auth: Failed to refresh user data.");
      }
    } catch (error) {
      console.error("Auth: Error refreshing user data:", error);
    }
  };

  const logout = () => {
    console.log("Auth: Logout called, clearing token and removing from localStorage.");
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    router.push("/"); // Redirect to home page after logout
  };

  if (loading) {
    console.log("Auth: Loading authentication state...");
    return null;
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, refreshUser, isAuthenticated: !!token, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
