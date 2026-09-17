import { FormEvent, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';

export default function Profil() {
  const { user, loading, refresh, logout } = useAuth();
  const [ok, setOk] = useState('');
  const [err, setErr] = useState('');
  const [profil, setProfil] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    api('/api/profiles/me').then(setProfil).catch(console.error);
  }, [user]);

  if (loading) return <p>chargement...</p>;
  if (!user) return <Navigate to="/login" replace />;

  async function saveEntreprise(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await api('/api/profiles/entreprise', {
        method: 'PUT',
        body: JSON.stringify(Object.fromEntries(fd.entries())),
      });
      setOk('profil à jour');
      refresh();
    } catch (ex: any) {
      setErr(ex.message);
    }
  }

  async function saveInterim(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload: any = Object.fromEntries(fd.entries());
    payload.metiers = String(payload.metiers || '')
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean);
    payload.competences = String(payload.competences || '')
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean);
    try {
      await api('/api/profiles/interim', { method: 'PUT', body: JSON.stringify(payload) });
      setOk('profil à jour');
      refresh();
    } catch (ex: any) {
      setErr(ex.message);
    }
  }

  async function deleteAccount() {
    if (!confirm('Supprimer définitivement ton compte et tes données ?')) return;
    await api('/api/auth/me', { method: 'DELETE' });
    logout();
  }

  return (
    <section>
      <h1>Mon profil</h1>
      {ok && <p className="okmsg">{ok}</p>}
      {err && <p className="err">{err}</p>}

      {user.role === 'ENTREPRISE' && (
        <form className="stack" onSubmit={saveEntreprise}>
          <label>
            Raison sociale
            <input name="raisonSociale" defaultValue={profil?.raisonSociale || ''} required />
          </label>
          <label>
            SIRET
            <input name="siret" defaultValue={profil?.siret || ''} />
          </label>
          <label>
            Ville
            <input name="ville" defaultValue={profil?.ville || ''} />
          </label>
          <label>
            Code postal
            <input name="codePostal" defaultValue={profil?.codePostal || ''} />
          </label>
          <label>
            Description
            <textarea name="description" rows={3} defaultValue={profil?.description || ''} />
          </label>
          <label>
            IBAN (chiffré au repos)
            <input name="iban" placeholder="FR76..." autoComplete="off" />
          </label>
          <button className="btn">Enregistrer</button>
        </form>
      )}

      {user.role === 'INTERIMAIRE' && (
        <form className="stack" onSubmit={saveInterim} style={{ maxWidth: 520 }}>
          <label>
            Prénom
            <input name="prenom" defaultValue={profil?.prenom || ''} required />
          </label>
          <label>
            Nom
            <input name="nom" defaultValue={profil?.nom || ''} required />
          </label>
          <label>
            Téléphone
            <input name="telephone" defaultValue={profil?.telephone || ''} />
          </label>
          <label>
            Ville
            <input name="ville" defaultValue={profil?.ville || ''} />
          </label>
          <label>
            Code postal
            <input name="codePostal" defaultValue={profil?.codePostal || ''} />
          </label>
          <label>
            Métiers (virgules)
            <input name="metiers" defaultValue={(profil?.metiers || []).join(', ')} placeholder="macon, coffreur" />
          </label>
          <label>
            Compétences (virgules)
            <input
              name="competences"
              defaultValue={(profil?.competences || []).join(', ')}
              placeholder="coffrage, béton"
            />
          </label>
          <label>
            Dispo début
            <input
              name="dispoDebut"
              type="date"
              defaultValue={profil?.dispoDebut ? String(profil.dispoDebut).slice(0, 10) : ''}
            />
          </label>
          <label>
            Dispo fin
            <input
              name="dispoFin"
              type="date"
              defaultValue={profil?.dispoFin ? String(profil.dispoFin).slice(0, 10) : ''}
            />
          </label>
          <label>
            Expérience (années)
            <input name="experienceAns" type="number" defaultValue={profil?.experienceAns || 0} />
          </label>
          <label>
            Réf. pièce d’identité (chiffrée)
            <input name="pieceIdentite" placeholder="CNI-xxxx" autoComplete="off" />
          </label>
          <button className="btn">Enregistrer</button>
        </form>
      )}

      <div className="panel" style={{ marginTop: '2rem' }}>
        <h2>RGPD</h2>
        <p className="meta">Tu peux supprimer ton compte et les données associées.</p>
        <button type="button" className="btn danger" onClick={deleteAccount}>
          Supprimer mon compte
        </button>
      </div>
    </section>
  );
}
