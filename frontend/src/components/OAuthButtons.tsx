import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';

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

  if (!providers.google && !providers.microsoft) {
    return (
      <p className="meta">
        SSO Google / Microsoft : à configurer (variables d’env) — voir DEPLOY.md
      </p>
    );
  }

  return (
    <div style={{ margin: '1.25rem 0', maxWidth: 420 }}>
      <p className="meta" style={{ marginBottom: '0.5rem' }}>
        Ou continuer avec un compte (RGPD accepté en continuant) :
      </p>
      {!hideRoleSelect && (
        <label style={{ marginBottom: '0.75rem' }}>
          Je m’inscris / me connecte en tant que
          <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="INTERIMAIRE">Intérimaire</option>
            <option value="ENTREPRISE">Entreprise</option>
          </select>
        </label>
      )}
      <div className="cta-row" style={{ marginTop: '0.5rem' }}>
        {providers.google && (
          <a className="btn secondary" href={`${API_BASE}/api/auth/google?role=${role}`}>
            Google
          </a>
        )}
        {providers.microsoft && (
          <a className="btn secondary" href={`${API_BASE}/api/auth/microsoft?role=${role}`}>
            Microsoft
          </a>
        )}
      </div>
    </div>
  );
}

export function OAuthErrorBanner() {
  const [params] = useSearchParams();
  const err = params.get('oauth_error');
  if (!err) return null;
  return <p className="err">{err}</p>;
}

export function OauthCallbackPage() {
  const [params] = useSearchParams();
  const [msg, setMsg] = useState('connexion…');

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setMsg('token manquant');
      return;
    }
    localStorage.setItem('im_token', token);
    window.location.replace('/dashboard');
  }, [params]);

  return (
    <section>
      <h1>Connexion SSO</h1>
      <p className="meta">{msg}</p>
      <Link to="/login">Retour login</Link>
    </section>
  );
}
