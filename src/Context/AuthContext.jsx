import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [barber, setBarber] = useState(null);

  const login  = (barberData) => setBarber(barberData);
  const logout  = () => setBarber(null);

  return (
    <AuthContext.Provider value={{ barber, login, logout, isAuthenticated: !!barber }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}