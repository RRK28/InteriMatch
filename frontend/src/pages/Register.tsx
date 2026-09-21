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
    <section>
      <h1>Inscription</h1>
      <OAuthButtons defaultRole={role} role={role} onRoleChange={setRole} hideRoleSelect />
      <form className="stack" onSubmit={onSubmit}>
        <label>
          Type de compte
          <select value={role} onChange={(e) => setRole(e.target.value as any)}>
            <option value="INTERIMAIRE">Intérimaire</option>
            <option value="ENTREPRISE">Entreprise</option>
          </select>
        </label>
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
        <label style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
          <input name="consent" type="checkbox" required />
          <span>
            J’accepte le traitement de mes données pour la mise en relation (RGPD). Conservation : 3
            ans après dernière activité.
          </span>
        </label>
        {err && <p className="err">{err}</p>}
        <button className="btn">Créer mon compte</button>
      </form>
      <p className="meta">
        Déjà un compte ? <Link to="/login">Connexion</Link>
      </p>
    </section>
  );
}
