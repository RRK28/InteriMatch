import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';

export default function EditMission() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [sugg, setSugg] = useState<string[]>([]);
  const [epi, setEpi] = useState<string[]>([]);
  const [form, setForm] = useState({
    titre: '',
    description: '',
    metier: 'macon',
    competences: '',
    ville: '',
    codePostal: '',
    dateDebut: '',
    dateFin: '',
    remuneration: '14',
    status: '',
  });

  useEffect(() => {
    if (!id) return;
    api(`/api/missions/${id}`)
      .then((m) => {
        setForm({
          titre: m.titre || '',
          description: m.description || '',
          metier: m.metier || 'macon',
          competences: (m.competences || []).join(', '),
          ville: m.ville || '',
          codePostal: m.codePostal || '',
          dateDebut: m.dateDebut ? String(m.dateDebut).slice(0, 10) : '',
          dateFin: m.dateFin ? String(m.dateFin).slice(0, 10) : '',
          remuneration: String(m.remuneration ?? 14),
          status: m.status || '',
        });
        setEpi(m.epiObligatoires || []);
        setLoading(false);
        return loadSug(m.metier || 'macon');
      })
      .catch((e) => {
        setErr(e.message);
        setLoading(false);
      });
  }, [id]);

  async function loadSug(metier: string) {
    try {
      const [sug, epiRes] = await Promise.all([
        api<{ competencesSuggerees: string[] }>(`/api/tendances/suggestions/${encodeURIComponent(metier)}`),
        api<{ epi: string[] }>(`/api/profiles/epi/${encodeURIComponent(metier)}`),
      ]);
      setSugg(sug.competencesSuggerees || []);
      setEpi(epiRes.epi || []);
    } catch {
      /* ignore */
    }
  }

  if (!user || user.role !== 'ENTREPRISE') {
    return <p className="err">réservé aux entreprises</p>;
  }
  if (loading) return <p>chargement...</p>;

  if (form.status === 'TERMINEE' || form.status === 'ANNULEE') {
    return (
      <section>
        <p className="err">Cette mission n’est plus modifiable ({form.status}).</p>
        <Link to={`/missions/${id}`}>← retour</Link>
      </section>
    );
  }

  function setField(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function addComp(c: string) {
    const list = form.competences
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!list.includes(c)) list.push(c);
    setField('competences', list.join(', '));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr('');
    const competences = form.competences
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      await api(`/api/missions/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          titre: form.titre,
          description: form.description,
          metier: form.metier,
          competences,
          ville: form.ville,
          codePostal: form.codePostal,
          dateDebut: form.dateDebut,
          dateFin: form.dateFin,
          remuneration: form.remuneration,
        }),
      });
      nav(`/missions/${id}`);
    } catch (ex: any) {
      setErr(ex.message);
    }
  }

  return (
    <section>
      <p className="meta">
        <Link to={`/missions/${id}`}>← mission</Link>
      </p>
      <h1>Modifier la mission</h1>
      <form className="stack" onSubmit={onSubmit} style={{ maxWidth: 520 }}>
        <label>
          Titre
          <input required value={form.titre} onChange={(e) => setField('titre', e.target.value)} />
        </label>
        <label>
          Métier
          <select
            required
            value={form.metier}
            onChange={(e) => {
              setField('metier', e.target.value);
              loadSug(e.target.value);
            }}
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
            <strong>EPI :</strong> {epi.join(', ')}
          </div>
        )}
        {sugg.length > 0 && (
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
        )}
        <label>
          Compétences
          <input value={form.competences} onChange={(e) => setField('competences', e.target.value)} />
        </label>
        <label>
          Description
          <textarea
            rows={4}
            required
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
          />
        </label>
        <label>
          Ville
          <input required value={form.ville} onChange={(e) => setField('ville', e.target.value)} />
        </label>
        <label>
          Code postal
          <input
            required
            pattern="\d{5}"
            value={form.codePostal}
            onChange={(e) => setField('codePostal', e.target.value)}
          />
        </label>
        <label>
          Début
          <input
            type="date"
            required
            value={form.dateDebut}
            onChange={(e) => setField('dateDebut', e.target.value)}
          />
        </label>
        <label>
          Fin
          <input
            type="date"
            required
            value={form.dateFin}
            onChange={(e) => setField('dateFin', e.target.value)}
          />
        </label>
        <label>
          Rémunération €/h
          <input
            type="number"
            step="0.1"
            min="11"
            required
            value={form.remuneration}
            onChange={(e) => setField('remuneration', e.target.value)}
          />
        </label>
        {err && <p className="err">{err}</p>}
        <div className="cta-row">
          <button className="btn">Enregistrer</button>
          <Link className="btn secondary" to={`/missions/${id}`}>
            Annuler
          </Link>
        </div>
      </form>
    </section>
  );
}
