import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { OAuthButtons } from '../components/OAuthButtons';

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [role, setRole] = useState<'ENTREPRISE' | 'INTERIMAIRE'>('INTERIMAIRE');
  const [err, setErr] = useState('');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr('');
    const fd = new FormData(e.currentTarget);
    if (!fd.get('consent')) {
      setErr('consentement RGPD obligatoire');
      return;
    }
    try {
      await register({
        email: fd.get('email'),
        password: fd.get('password'),
        role,
        consentRgpd: true,
        raisonSociale: fd.get('raisonSociale') || undefined,
        prenom: fd.get('prenom') || undefined,
        nom: fd.get('nom') || undefined,
      });
      nav('/profil');
    } catch (ex: any) {
      setErr(ex.message);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-visual" aria-hidden="true">
        <img
          src={role === 'ENTREPRISE' ? '/images/entreprise-chantier.jpg' : '/images/interim-macon.jpg'}
          alt=""
        />
        <div className="auth-visual__caption">
          <span>Rejoins InteriMatch</span>
          <p>{role === 'ENTREPRISE' ? 'Publie tes missions chantier.' : 'Trouve ta prochaine mission.'}</p>
        </div>
      </div>
      <div className="auth-card">
        <h1>Inscription</h1>
        <label>
          Type de compte
          <select value={role} onChange={(e) => setRole(e.target.value as any)}>
            <option value="INTERIMAIRE">Intérimaire</option>
            <option value="ENTREPRISE">Entreprise</option>
          </select>
        </label>
        <OAuthButtons role={role} onRoleChange={setRole} hideRoleSelect />
        <div className="auth-sep">
          <span>ou email</span>
        </div>
        <form className="stack auth-form" onSubmit={onSubmit}>
          <label>
            Email
            <input name="email" type="email" required />
          </label>
          <label>
            Mot de passe
            <input name="password" type="password" minLength={6} required />
          </label>
          {role === 'ENTREPRISE' ? (
            <label>
              Raison sociale
              <input name="raisonSociale" required />
            </label>
          ) : (
            <>
              <label>
                Prénom
                <input name="prenom" required />
              </label>
              <label>
                Nom
                <input name="nom" required />
              </label>
            </>
          )}
          <label className="consent-row">
            <input name="consent" type="checkbox" required />
            <span>J’accepte le traitement RGPD (conservation 3 ans après dernière activité).</span>
          </label>
          {err && <p className="err">{err}</p>}
          <button className="btn">Créer mon compte</button>
        </form>
        <p className="meta auth-foot">
          Déjà inscrit ? <Link to="/login">Connexion</Link>
        </p>
      </div>
    </section>
  );
}
