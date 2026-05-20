// ============================================
//  AuthContext.jsx — CORRIGIDO
// ============================================
import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api'; // ajuste o caminho se necessário

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [barber, setBarber]   = useState(null);
  const [loading, setLoading] = useState(true); // impede render antes de checar o token

  // Ao montar: verifica se há token salvo e restaura a sessão
  useEffect(() => {
    const token = localStorage.getItem('mb_token');

    if (!token) {
      setLoading(false);
      return;
    }

    authService.me()
      .then((data) => setBarber(data.barber || data))
      .catch(() => localStorage.removeItem('mb_token')) // token expirado/inválido
      .finally(() => setLoading(false));
  }, []);

  const login = (barberData, token) => {
    localStorage.setItem('mb_token', token); // persiste o token
    setBarber(barberData);
  };

  const logout = () => {
    localStorage.removeItem('mb_token');
    setBarber(null);
  };

  // Enquanto verifica o token, mostra loading ao invés de redirecionar para /login
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        gap: '0.5rem',
        color: '#888',
        fontSize: '0.95rem',
      }}>
        <i className="ti ti-loader-2 spin" />
        Carregando…
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ barber, login, logout, isAuthenticated: !!barber }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}