// ============================================
//  Landing.jsx — Mikael Barber
// ============================================

import { useNavigate } from 'react-router-dom';
import './Landing.css';

// const SERVICES = [
//   {
//     icon: 'ti-scissors',
//     name: 'Corte Clássico',
//     price: 'A partir de R$ 17',
//     desc: 'Cortes tradicionais e modernos executados com precisão e estilo.',
//   },
//   {
//     icon: 'ti-needle',
//     name: 'Barba Completa',
//     price: 'A partir de R$ 15',
//     desc: 'Modelagem, hidratação e acabamento premium com produtos selecionados.',
//   },
//   {
//     icon: 'ti-sparkles',
//     name: 'Combo Premium',
//     price: 'A partir de R$ 75',
//     desc: 'Corte + Barba + Hidratação. A experiência completa da barbearia.',
//   },
// ];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing">
      <div className="landing__bg-pattern" aria-hidden="true" />
      <div className="landing__bg-radial"  aria-hidden="true" />
      <div className="landing__stripe-top" aria-hidden="true" />
      <div className="landing__stripe-bottom" aria-hidden="true" />

      {/* Navbar */}
      <nav className="landing__nav">
        <div className="nav__logo">
          <i className="ti ti-cut nav__logo-icon" aria-hidden="true" />
          Mikael Barber
        </div>

        <div className='nav__links'>
          <p className='nav__link'>Seu Estilo Começa Aqui</p>
        </div>

        {/* <div className="nav__links">
          <button className="nav__link">Serviços</button>
          <button className="nav__link">Sobre</button>
          <button className="nav__link">Localização</button>
        </div> */}

        <button className="nav__cta" onClick={() => navigate('/login')}>
          <i className="ti ti-lock" style={{ marginRight: 8 }} aria-hidden="true" />
          Área do Barbeiro
        </button>
      </nav>

      {/* Hero */}
      <section className="landing__hero">
        <div className="hero__badge">
          <span className="hero__badge-dot" aria-hidden="true" />
          <span className="hero__badge-text">Est. 2022 — Altos, PI</span>
          <span className="hero__badge-dot" aria-hidden="true" />
        </div>

        <h1 className="hero__title">
          MIKAEL
          <span className="hero__title-accent">BARBER</span>
        </h1>

        <p className="hero__subtitle">A Arte do Corte Perfeito</p>

        <div className="hero__divider" aria-hidden="true">
          <div className="hero__divider-line" />
          <i className="ti ti-cut hero__divider-icon" />
          <div className="hero__divider-line hero__divider-line--right" />
        </div>

        <div className="hero__cta-group">
          <button className="hero__cta-primary" onClick={() => navigate('/login')}>
            Agendar Agora
          </button>
        </div>
      </section>

      {/* Grid de Serviços
      <section className="landing__services">
        {SERVICES.map((s) => (
          <div className="service-card" key={s.name}>
            <i className={`ti ${s.icon} service-card__icon`} aria-hidden="true" />
            <div className="service-card__name">{s.name}</div>
            <div className="service-card__price">{s.price}</div>
            <p className="service-card__desc">{s.desc}</p>
          </div>
        ))}
      </section> */}
    </div>
  );
}