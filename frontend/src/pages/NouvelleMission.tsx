import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';

export default function NouvelleMission() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [err, setErr] = useState('');
  const [sugg, setSugg] = useState<string[]>([]);
  const [comps, setComps] = useState('');
  const [epi, setEpi] = useState<string[]>([]);
  const [metier, setMetier] = useState('macon');

  if (!user || user.role !== 'ENTREPRISE') {
    return <p className="err">réservé aux entreprises</p>;
  }

  async function onMetierChange(value: string) {
    setMetier(value);
    try {
      const [sug, epiRes] = await Promise.all([
        api<{ competencesSuggerees: string[] }>(`/api/tendances/suggestions/${encodeURIComponent(value)}`),
        api<{ epi: string[] }>(`/api/profiles/epi/${encodeURIComponent(value)}`),
      ]);
      setSugg(sug.competencesSuggerees || []);
      setEpi(epiRes.epi || []);
    } catch {
      /* ignore */
    }
  }

  function addComp(c: string) {
    const list = comps
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!list.includes(c)) list.push(c);
    setComps(list.join(', '));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr('');
    const fd = new FormData(e.currentTarget);
    const competences = comps
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      const m = await api<any>('/api/missions', {
        method: 'POST',
        body: JSON.stringify({
          titre: fd.get('titre'),
          description: fd.get('description'),
          metier,
          competences,
          ville: fd.get('ville'),
          codePostal: fd.get('codePostal'),
          dateDebut: fd.get('dateDebut'),
          dateFin: fd.get('dateFin'),
          remuneration: fd.get('remuneration'),
        }),
      });
      nav(`/missions/${m.id}`);
    } catch (ex: any) {
      setErr(ex.message);
    }
  }

  return (
    <section>
      <h1>Nouvelle mission</h1>
      <p className="meta">
        Mentions contrat : titre, dates, lieu, rémunération et compétences seront reprises sur la
        fiche (durée max ~18 mois contrôlée).
      </p>
      <form className="stack" onSubmit={onSubmit} style={{ maxWidth: 520 }}>
        <label>
          Titre
          <input name="titre" required placeholder="Maçon coffreur — chantier X" />
        </label>
        <label>
          Métier
          <select
            name="metier"
            required
            value={metier}
            onChange={(e) => onMetierChange(e.target.value)}
            onFocus={() => onMetierChange(metier)}
          >
            <option value="macon">Maçon</option>
            <option value="coffreur">Coffreur</option>
            <option value="electricien">Électricien</option>
            <option value="peintre">Peintre</option>
            <option value="charpentier">Charpentier</option>
          </select>
        </label>
        {epi.length > 0 && (
          <div className="epi-box" role="note">
            <strong>EPI prévus :</strong> {epi.join(', ')}
          </div>
        )}
        {sugg.length > 0 && (
          <div>
            <p className="meta" style={{ marginBottom: '0.35rem' }}>
              Suggestions compétences (tendances FT) — clique pour ajouter :
            </p>
            <div className="cta-row">
              {sugg.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="btn ghost"
                  style={{ padding: '0.3rem 0.65rem', fontSize: '0.85rem' }}
                  onClick={() => addComp(c)}
                >
                  + {c}
                </button>
              ))}
            </div>
          </div>
        )}
        <label>
          Compétences (séparées par virgule)
          <input
            name="competences"
            value={comps}
            onChange={(e) => setComps(e.target.value)}
            placeholder="coffrage, béton"
          />
        </label>
        <label>
          Description
          <textarea name="description" rows={4} required />
        </label>
        <label>
          Ville
          <input name="ville" required />
        </label>
        <label>
          Code postal
          <input name="codePostal" required pattern="\d{5}" />
        </label>
        <label>
          Début
          <input name="dateDebut" type="date" required />
        </label>
        <label>
          Fin
          <input name="dateFin" type="date" required />
        </label>
        <label>
          Rémunération €/h
          <input name="remuneration" type="number" step="0.1" min="11" defaultValue={14} />
        </label>
        {err && <p className="err">{err}</p>}
        <button className="btn">Publier</button>
      </form>
    </section>
  );
}
