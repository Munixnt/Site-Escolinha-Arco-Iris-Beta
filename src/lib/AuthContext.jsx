import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { api, tokenStore } from '@/api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // Só há o que carregar se existir um token salvo; visitantes do site público não esperam nada.
  const [isLoadingAuth, setIsLoadingAuth] = useState(() => !!tokenStore.get());
  const [authChecked, setAuthChecked] = useState(() => !tokenStore.get());

  const checkUserAuth = useCallback(async () => {
    try {
      setIsLoadingAuth(true);
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
    if (tokenStore.get()) checkUserAuth();
  }, [checkUserAuth]);

  const login = async (email, password) => {
    const loggedUser = await api.auth.login(email, password);
    setUser(loggedUser);
    setIsAuthenticated(true);
    setAuthChecked(true);
    return loggedUser;
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    api.auth.logout(shouldRedirect ? '/' : undefined);
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
