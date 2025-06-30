"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface User {
  id: number;
  login: string;
  name: string;
  email: string;
  avatar_url: string;
  public_repos: number;
  html_url: string;
}

interface Organization {
  id: number;
  login: string;
  description: string;
  avatar_url: string;
  html_url: string;
}

interface UserProfile {
  user: User;
  organizations: Organization[];
  repositories_count: number;
  organizations_count: number;
  scopes: string[];
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored token on mount
    const storedToken = localStorage.getItem("github_token");
    if (storedToken) {
      setToken(storedToken);
      validateAndLoadProfile(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const validateAndLoadProfile = async (authToken: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/validate`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        await loadUserProfile(authToken);
      } else {
        // Token is invalid, clear it
        localStorage.removeItem("github_token");
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error("Token validation failed:", error);
      localStorage.removeItem("github_token");
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserProfile = async (authToken: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setUser(result.data);
      }
    } catch (error) {
      console.error("Failed to load user profile:", error);
    }
  };

  const login = async () => {
    try {
      setIsLoading(true);
      
      // Get OAuth URL from backend
      const response = await fetch(`${API_BASE_URL}/api/auth/github?redirect_url=${encodeURIComponent(window.location.origin)}`);
      const result = await response.json();

      if (result.success) {
        // Store state for validation
        localStorage.setItem("oauth_state", result.data.state);
        
        // Redirect to GitHub OAuth
        window.location.href = result.data.auth_url;
      } else {
        throw new Error(result.message || "Failed to initiate OAuth");
      }
    } catch (error) {
      console.error("Login failed:", error);
      setIsLoading(false);
      alert("Failed to connect to GitHub. Please try again.");
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      // Clear local state regardless of API call success
      localStorage.removeItem("github_token");
      localStorage.removeItem("oauth_state");
      setToken(null);
      setUser(null);
    }
  };

  const refreshProfile = async () => {
    if (token) {
      await loadUserProfile(token);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
} 