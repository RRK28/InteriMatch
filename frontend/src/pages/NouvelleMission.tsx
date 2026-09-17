import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';

export default function NouvelleMission() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [err, setErr] = useState('');
  const [sugg, setSugg] = useState<string[]>([]);

  if (!user || user.role !== 'ENTREPRISE') {
    return <p className="err">réservé aux entreprises</p>;
  }

  async function onMetierBlur(metier: string) {
    if (!metier) return;
    try {
      const data = await api<{ competencesSuggerees: string[] }>(
        `/api/tendances/suggestions/${encodeURIComponent(metier)}`
      );
      setSugg(data.competencesSuggerees || []);
    } catch {
      /* ignore */
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr('');
    const fd = new FormData(e.currentTarget);
    const competences = String(fd.get('competences') || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      const m = await api<any>('/api/missions', {
        method: 'POST',
        body: JSON.stringify({
          titre: fd.get('titre'),
          description: fd.get('description'),
          metier: fd.get('metier'),
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
      <form className="stack" onSubmit={onSubmit} style={{ maxWidth: 520 }}>
        <label>
          Titre
          <input name="titre" required placeholder="Maçon coffreur — chantier X" />
        </label>
        <label>
          Métier
          <select name="metier" required onBlur={(e) => onMetierBlur(e.target.value)}>
            <option value="macon">Maçon</option>
            <option value="coffreur">Coffreur</option>
            <option value="electricien">Électricien</option>
            <option value="peintre">Peintre</option>
            <option value="charpentier">Charpentier</option>
          </select>
        </label>
        {sugg.length > 0 && (
          <p className="meta">
            Suggestions (France Travail / tendances) : {sugg.join(', ')}
          </p>
        )}
        <label>
          Compétences (séparées par virgule)
          <input name="competences" placeholder="coffrage, béton" />
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
