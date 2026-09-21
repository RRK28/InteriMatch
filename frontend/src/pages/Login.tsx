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
    <section>
      <h1>Connexion</h1>
      <p className="meta">Comptes démo seed : chantier@btp-lyon.fr / karim.macon@mail.com — password123</p>
      <OAuthErrorBanner />
      <OAuthButtons />
      <form className="stack" onSubmit={onSubmit}>
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
          {loading ? '...' : 'Se connecter'}
        </button>
      </form>
      <p className="meta">
        Pas de compte ? <Link to="/register">Inscription</Link>
      </p>
    </section>
  );
}
