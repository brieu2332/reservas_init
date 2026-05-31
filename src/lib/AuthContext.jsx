import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  useEffect(() => {
    // Simulamos um pequeno tempo de carregamento para ver o spinner,
    // e depois forçamos o login com um utilizador falso (mock)
    const timer = setTimeout(() => {
      setUser({
        id: 'local-dev-123',
        name: 'Desenvolvedor Local',
        email: 'dev@localhost.com',
        role: 'admin' // Dá permissões totais para ver todas as telas
      });
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
      setIsLoadingPublicSettings(false);
      setAuthError(null);
    }, 500); // 500 milissegundos de loading

    return () => clearTimeout(timer);
  }, []);

  // Funções vazias apenas para evitar erros caso outros ficheiros as chamem
  const checkAppState = async () => {};
  
  const logout = () => {
    console.log("Logout clicado (Modo Local)");
    setUser(null);
    setIsAuthenticated(false);
  };

  const navigateToLogin = () => {
    console.log("Redirecionar para Login (Modo Local)");
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      logout,
      navigateToLogin,
      checkAppState
    }}>
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