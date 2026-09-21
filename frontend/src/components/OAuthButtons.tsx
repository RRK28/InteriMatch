import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:4000' : '');

type Role = 'ENTREPRISE' | 'INTERIMAIRE';
type Providers = { google: boolean; microsoft: boolean };

export function OAuthButtons({
  defaultRole = 'INTERIMAIRE',
  role: roleProp,
  onRoleChange,
  hideRoleSelect = false,
}: {
  defaultRole?: Role;
  role?: Role;
  onRoleChange?: (r: Role) => void;
  hideRoleSelect?: boolean;
}) {
  const [internalRole, setInternalRole] = useState<Role>(defaultRole);
  const role = roleProp ?? internalRole;
  const setRole = (r: Role) => {
    setInternalRole(r);
    onRoleChange?.(r);
  };
  const [providers, setProviders] = useState<Providers>({ google: false, microsoft: false });

  useEffect(() => {
    api<Providers>('/api/auth/providers')
      .then(setProviders)
      .catch(() => setProviders({ google: false, microsoft: false }));
  }, []);

  if (!providers.google && !providers.microsoft) return null;

  return (
    <div className="oauth-block">
      {!hideRoleSelect && (
        <label className="oauth-role">
          Je me connecte en tant que
          <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="INTERIMAIRE">Intérimaire</option>
            <option value="ENTREPRISE">Entreprise</option>
          </select>
        </label>
      )}
      <div className="oauth-btns">
        {providers.google && (
          <a className="btn-oauth btn-oauth--google" href={`${API_BASE}/api/auth/google?role=${role}`}>
            Continuer avec Google
          </a>
        )}
        {providers.microsoft && (
          <a className="btn-oauth btn-oauth--ms" href={`${API_BASE}/api/auth/microsoft?role=${role}`}>
            Continuer avec Microsoft
          </a>
        )}
      </div>
      <p className="oauth-note">En continuant, tu acceptes le traitement RGPD de ton profil.</p>
    </div>
  );
}

export function OAuthErrorBanner() {
  const [params] = useSearchParams();
  const err = params.get('oauth_error');
  if (!err) return null;
  return (
    <p className="err" role="alert">
      {err}
    </p>
  );
}

export function OauthCallbackPage() {
  const { loginWithToken } = useAuth();
  const nav = useNavigate();
  const [msg, setMsg] = useState('Finalisation de la connexion…');

  useEffect(() => {
    const raw = window.location.hash.replace(/^#/, '');
    const token = new URLSearchParams(raw).get('token');
    if (!token) {
      setMsg('Token manquant — réessaie depuis la page connexion.');
      return;
    }
    loginWithToken(token)
      .then(() => nav('/dashboard', { replace: true }))
      .catch(() => {
        setMsg('Impossible de valider la session. Réessaie.');
        nav('/login?oauth_error=' + encodeURIComponent('session invalide'), { replace: true });
      });
  }, []);

  return (
    <section className="auth-page">
      <div className="auth-card">
        <h1>Connexion SSO</h1>
        <p className="meta">{msg}</p>
        <Link to="/login">Retour</Link>
      </div>
    </section>
  );
}
