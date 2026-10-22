import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { api } from '@/api/client';

/**
 * @typedef {{ id: string, email: string | undefined, full_name: string | undefined, role: string }} AuthUser
 * @typedef {{
 *   user: AuthUser | null,
 *   isAuthenticated: boolean,
 *   isLoadingAuth: boolean,
 *   authChecked: boolean,
 *   login: (email: string, password: string) => Promise<AuthUser>,
 *   logout: (shouldRedirect?: boolean) => Promise<void>,
 *   navigateToLogin: () => void,
 *   checkUserAuth: () => Promise<void>
 * }} AuthContextValue
 * @type {React.Context<AuthContextValue | null>}
 */
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  const checkUserAuth = useCallback(async () => {
    try {
      const currentUser = await api.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
    } catch {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = api.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user;
      setUser(sessionUser ? {
        id: sessionUser.id,
        email: sessionUser.email,
        full_name: sessionUser.user_metadata?.full_name || sessionUser.email,
        role: sessionUser.app_metadata?.role === 'admin' ? 'admin' : 'user',
      } : null);
      setIsAuthenticated(Boolean(sessionUser));
      setIsLoadingAuth(false);
      setAuthChecked(true);
    });
    checkUserAuth();
    return () => subscription.unsubscribe();
  }, [checkUserAuth]);

  const login = async (email, password) => {
    const loggedUser = await api.auth.login(email, password);
    setUser(loggedUser);
    setIsAuthenticated(true);
    setAuthChecked(true);
    return loggedUser;
  };

  const logout = async (shouldRedirect = true) => {
    await api.auth.logout(shouldRedirect ? '/' : undefined);
    setUser(null);
    setIsAuthenticated(false);
  };

  const navigateToLogin = () => {
    api.auth.redirectToLogin(window.location.pathname + window.location.search);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        authChecked,
        login,
        logout,
        navigateToLogin,
        checkUserAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
