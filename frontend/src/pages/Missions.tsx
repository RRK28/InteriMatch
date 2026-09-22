import { FormEvent, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';

type Mission = {
  id: string;
  titre: string;
  metier: string;
  ville: string;
  remuneration: number;
  status: string;
  dateDebut: string;
  dateFin: string;
  competences?: string[];
};

const METIERS = [
  { value: '', label: 'Tous les métiers' },
  { value: 'macon', label: 'Maçon' },
  { value: 'coffreur', label: 'Coffreur' },
  { value: 'electricien', label: 'Électricien' },
  { value: 'peintre', label: 'Peintre' },
  { value: 'charpentier', label: 'Charpentier' },
];

export default function Missions() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  const [metier, setMetier] = useState(params.get('metier') || '');
  const [ville, setVille] = useState(params.get('ville') || '');
  const [minRem, setMinRem] = useState(params.get('minRem') || '');
  const [list, setList] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  async function load(next?: { q?: string; metier?: string; ville?: string; minRem?: string }) {
    const qq = next?.q ?? q;
    const mm = next?.metier ?? metier;
    const vv = next?.ville ?? ville;
    const rr = next?.minRem ?? minRem;
    const sp = new URLSearchParams({ status: 'OUVERTE' });
    if (qq.trim()) sp.set('q', qq.trim());
    if (mm) sp.set('metier', mm);
    if (vv.trim()) sp.set('ville', vv.trim());
    if (rr.trim()) sp.set('minRem', rr.trim());

    setLoading(true);
    setErr('');
    try {
      const data = await api<Mission[]>(`/api/missions?${sp.toString()}`);
      setList(data);
      setParams(sp, { replace: true });
    } catch (e: any) {
      setErr(e.message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    load();
  }

  function reset() {
    setQ('');
    setMetier('');
    setVille('');
    setMinRem('');
    load({ q: '', metier: '', ville: '', minRem: '' });
  }

  return (
    <section>
      <div className="page-banner">
        <h1>Missions ouvertes</h1>
      </div>
      <p className="meta">Annonces BTP — affine ta recherche par métier, ville ou mot-clé.</p>

      <form className="mission-search" onSubmit={onSubmit} role="search" aria-label="Rechercher des missions">
        <label className="sr-only" htmlFor="mission-q">
          Mot-clé
        </label>
        <input
          id="mission-q"
          type="search"
          placeholder="Mot-clé (titre, compétence…)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <label className="sr-only" htmlFor="mission-metier">
          Métier
        </label>
        <select id="mission-metier" value={metier} onChange={(e) => setMetier(e.target.value)}>
          {METIERS.map((m) => (
            <option key={m.value || 'all'} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="mission-ville">
          Ville
        </label>
        <input
          id="mission-ville"
          type="text"
          placeholder="Ville"
          value={ville}
          onChange={(e) => setVille(e.target.value)}
        />
        <label className="sr-only" htmlFor="mission-rem">
          Rémunération min
        </label>
        <input
          id="mission-rem"
          type="number"
          min={0}
          step={0.5}
          placeholder="€/h min"
          value={minRem}
          onChange={(e) => setMinRem(e.target.value)}
          style={{ maxWidth: '7rem' }}
        />
        <button type="submit" className="btn">
          Rechercher
        </button>
        <button type="button" className="btn ghost" onClick={reset}>
          Réinitialiser
        </button>
      </form>

      <p className="meta" style={{ marginBottom: '1rem' }}>
        {loading ? 'Recherche…' : `${list.length} mission${list.length > 1 ? 's' : ''} trouvée${list.length > 1 ? 's' : ''}`}
      </p>
      {err && <p className="err">{err}</p>}

      <div className="grid">
        {list.map((m) => (
          <article key={m.id} className="mission">
            <span className="badge">{m.metier}</span>
            <h3>
              <Link to={`/missions/${m.id}`}>{m.titre}</Link>
            </h3>
            <p className="meta">
              {m.ville} · {m.remuneration} €/h
            </p>
            <p className="meta">
              {new Date(m.dateDebut).toLocaleDateString('fr-FR')} →{' '}
              {new Date(m.dateFin).toLocaleDateString('fr-FR')}
            </p>
            {m.competences && m.competences.length > 0 && (
              <p className="meta">{m.competences.slice(0, 4).join(' · ')}</p>
            )}
          </article>
        ))}
      </div>
      {!loading && !list.length && !err && (
        <p className="meta">Aucune mission ne correspond à ta recherche.</p>
      )}
    </section>
  );
}
