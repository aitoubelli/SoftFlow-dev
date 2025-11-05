import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'owner' | 'dev';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
        setUser({ _id: decoded.id, name: decoded.name, email: decoded.email, role: decoded.role });
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
      setUser({ _id: decoded.id, name: decoded.name, email: decoded.email, role: decoded.role });
    } catch (error) {
      console.error("Auth: Failed to decode new token after login.", error);
      logout(); // If new token is invalid, log out
    }
  };

  const logout = () => {
    console.log("Auth: Logout called, clearing token and removing from localStorage.");
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  if (loading) {
    console.log("Auth: Loading authentication state...");
    return null;
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
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
