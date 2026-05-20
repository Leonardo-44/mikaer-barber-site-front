// ============================================
//  Login.jsx — Mikael Barber (UI/UX melhorado)
// ============================================

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import { authService } from '../../services/api';
import './Login.css';

export default function Login() {
  const { login }   = useAuth();
  const navigate    = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [touched, setTouched]   = useState({ username: false, password: false });
  const [shake, setShake]       = useState(false);

  const usernameRef = useRef(null);

  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  const handleBlur = (field) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSubmit = async () => {
    setTouched({ username: true, password: true });
    setError('');

    if (!username.trim() || !password.trim()) {
      triggerShake();
      return;
    }

    setLoading(true);
    try {
      const data = await authService.login(username.trim(), password);
      login(data.barber, data.token); // ← passa barber E token para o contexto
      navigate('/dashboard', { replace: true });
    } catch (err) {
      triggerShake();
      setError(err.message || 'Usuário ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const hasError = (field) => touched[field] && !{ username, password }[field].trim();

  return (
    <div className="login-screen">
      <div className="login-screen__bg" aria-hidden="true" />
      <div className="login-screen__bg-pattern" aria-hidden="true" />

      <div className={`login-card slide-up${shake ? ' shake' : ''}`}>

        {/* ── Header ── */}
        <div className="login-card__header">
          <div className="login-card__logo-ring" aria-hidden="true">
            <i className="ti ti-cut" />
          </div>
          <h1 className="login-card__brand">MIKAEL BARBER</h1>
          <p className="login-card__brand-sub">Área do Barbeiro</p>
        </div>

        {/* ── Erro global ── */}
        {error && (
          <div className="login-error" role="alert" aria-live="assertive">
            <i className="ti ti-alert-triangle" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {/* ── Formulário ── */}
        <div className="login-form" role="form" aria-label="Formulário de acesso">

          {/* Usuário */}
          <div className={`form-field${hasError('username') ? ' form-field--error' : ''}`}>
            <label className="form-field__label" htmlFor="login-user">
              Usuário
            </label>
            <div className="form-field__wrapper">
              <i className="ti ti-user form-field__icon" aria-hidden="true" />
              <input
                ref={usernameRef}
                id="login-user"
                className="form-field__input"
                type="text"
                placeholder="seu.usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onBlur={() => handleBlur('username')}
                onKeyDown={handleKey}
                autoComplete="username"
                aria-required="true"
                aria-invalid={hasError('username')}
                aria-describedby={hasError('username') ? 'username-err' : undefined}
              />
              {username && (
                <button
                  type="button"
                  className="form-field__clear"
                  onClick={() => { setUsername(''); usernameRef.current?.focus(); }}
                  aria-label="Limpar usuário"
                >
                  <i className="ti ti-x" aria-hidden="true" />
                </button>
              )}
            </div>
            {hasError('username') && (
              <span id="username-err" className="form-field__hint form-field__hint--error">
                Informe seu usuário
              </span>
            )}
          </div>

          {/* Senha */}
          <div className={`form-field${hasError('password') ? ' form-field--error' : ''}`}>
            <div className="form-field__label-row">
              <label className="form-field__label" htmlFor="login-pass">
                Senha
              </label>
            </div>
            <div className="form-field__wrapper">
              <i className="ti ti-lock form-field__icon" aria-hidden="true" />
              <input
                id="login-pass"
                className="form-field__input"
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => handleBlur('password')}
                onKeyDown={handleKey}
                autoComplete="current-password"
                aria-required="true"
                aria-invalid={hasError('password')}
                aria-describedby={hasError('password') ? 'password-err' : undefined}
              />
              <button
                type="button"
                className="modal-field__toggle"
                onClick={() => setShowPass((p) => !p)}
                aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}
              >
                <i className={`ti ti-eye${showPass ? '-off' : ''}`} aria-hidden="true" />
              </button>
            </div>
            {hasError('password') && (
              <span id="password-err" className="form-field__hint form-field__hint--error">
                Informe sua senha
              </span>
            )}
          </div>

          {/* Botão */}
          <button
            className="login-btn"
            onClick={handleSubmit}
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? (
              <>
                <i className="ti ti-loader-2 spin" aria-hidden="true" />
                <span>Entrando…</span>
              </>
            ) : (
              <>
                <i className="ti ti-login" aria-hidden="true" />
                <span>Entrar</span>
              </>
            )}
          </button>
        </div>

        {/* ── Rodapé ── */}
        <div className="login-footer">
          <button className="login-back" onClick={() => navigate('/')}>
            <i className="ti ti-arrow-left" aria-hidden="true" />
            Voltar ao site
          </button>
        </div>
      </div>
    </div>
  );
}