// ============================================
//  Login.jsx — Mikael Barber (integrado com API)
// ============================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import { authService } from "../../services/api";   
import './Login.css';

export default function Login() {
  const { login }    = useAuth();
  const navigate     = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Preencha todos os campos.');
      return;
    }
    setLoading(true);

    try {
      // FIX 4: chama o backend real em vez do array mock
      const data = await authService.login(username.trim(), password);

      // Salva o token para as próximas requisições
      localStorage.setItem('mb_token', data.token);

      // Alimenta o contexto global com os dados do barbeiro
      login(data.barber);

      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Usuário ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="login-screen">
      <div className="login-screen__bg"         aria-hidden="true" />
      <div className="login-screen__bg-pattern" aria-hidden="true" />
      <div className="login-screen__stripe"     aria-hidden="true" />

      <div className="login-card slide-up">
        <div className="login-card__header">
          <i className="ti ti-cut login-card__icon" aria-hidden="true" />
          <div className="login-card__brand">MIKAEL BARBER</div>
          <span className="login-card__brand-sub">Área Restrita</span>
        </div>

        <div className="login-card__divider" aria-hidden="true" />
        <p className="login-card__subtitle">Acesso exclusivo para barbeiros</p>

        {error && (
          <div className="login-error" role="alert">
            <i className="ti ti-alert-triangle" aria-hidden="true" />
            {error}
          </div>
        )}

        <div className="login-form">
          <div className="form-field">
            <label className="form-field__label" htmlFor="login-user">
              <i className="ti ti-user" aria-hidden="true" />
              Usuário
            </label>
            <input
              id="login-user"
              className="form-field__input"
              type="text"
              placeholder="seu.usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleKey}
              autoComplete="username"
              autoFocus
            />
          </div>

          <div className="form-field">
            <label className="form-field__label" htmlFor="login-pass">
              <i className="ti ti-lock" aria-hidden="true" />
              Senha
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-pass"
                className="form-field__input"
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKey}
                autoComplete="current-password"
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPass((p) => !p)}
                style={{
                  position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)', background: 'none',
                  border: 'none', color: 'var(--gray)', cursor: 'pointer',
                  fontSize: 16, padding: 4, display: 'flex',
                }}
                aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}
              >
                <i className={`ti ti-eye${showPass ? '-off' : ''}`} />
              </button>
            </div>
          </div>

          <button className="login-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <i className="ti ti-loader-2" style={{ animation: 'spin 1s linear infinite' }} />
                Entrando...
              </>
            ) : (
              <>
                <i className="ti ti-login" />
                Entrar
              </>
            )}
          </button>
        </div>

        <button className="login-back" onClick={() => navigate('/')}>
          ← Voltar ao site
        </button>
      </div>
    </div>
  );
}