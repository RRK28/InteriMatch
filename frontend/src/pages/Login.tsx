import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { OAuthButtons, OAuthErrorBanner } from '../components/OAuthButtons';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      await login(String(fd.get('email')), String(fd.get('password')));
      nav('/dashboard');
    } catch (ex: any) {
      setErr(ex.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-visual" aria-hidden="true">
        <img src="/images/hero-chantier.jpg" alt="" />
        <div className="auth-visual__caption">
          <span>InteriMatch</span>
          <p>Le bon profil, sur le bon chantier.</p>
        </div>
      </div>
      <div className="auth-card">
        <h1>Connexion</h1>
        <p className="meta">Entreprises et intérimaires BTP — espace sécurisé.</p>
        <OAuthErrorBanner />
        <OAuthButtons />
        <div className="auth-sep">
          <span>ou email</span>
        </div>
        <form className="stack auth-form" onSubmit={onSubmit}>
          <label>
            Email
            <input name="email" type="email" required autoComplete="username" />
          </label>
          <label>
            Mot de passe
            <input name="password" type="password" required autoComplete="current-password" />
          </label>
          {err && (
            <p className="err" role="alert">
              {err}
            </p>
          )}
          <button className="btn" disabled={loading}>
            {loading ? '…' : 'Se connecter'}
          </button>
        </form>
        <p className="meta auth-foot">
          Pas de compte ? <Link to="/register">Inscription</Link>
        </p>
      </div>
    </section>
  );
}
