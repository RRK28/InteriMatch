import { FormEvent, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';

export default function MissionDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [m, setM] = useState<any>(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [matches, setMatches] = useState<any[] | null>(null);

  useEffect(() => {
    api(`/api/missions/${id}`).then(setM).catch((e) => setErr(e.message));
  }, [id]);

  async function candidater(e: FormEvent) {
    e.preventDefault();
    setErr('');
    try {
      await api(`/api/missions/${id}/candidater`, {
        method: 'POST',
        body: JSON.stringify({ message: msg }),
      });
      alert('candidature envoyée');
    } catch (ex: any) {
      setErr(ex.message);
    }
  }

  async function loadMatches() {
    try {
      const data = await api(`/api/matching/mission/${id}`);
      setMatches(data);
    } catch (ex: any) {
      setErr(ex.message);
    }
  }

  if (!m) return <p>{err || 'chargement...'}</p>;

  return (
    <section>
      <p className="meta">
        <Link to="/missions">← missions</Link>
      </p>
      <h1>{m.titre}</h1>
      <p>
        <span className="badge">{m.metier}</span>
        <span className="badge ok">{m.status}</span>
      </p>
      <p className="meta">
        {m.ville} ({m.codePostal}) · {m.remuneration} €/h
      </p>
      <p className="meta">
        Du {new Date(m.dateDebut).toLocaleDateString('fr-FR')} au{' '}
        {new Date(m.dateFin).toLocaleDateString('fr-FR')}
      </p>
      <div className="panel">
        <h2>Description</h2>
        <p style={{ whiteSpace: 'pre-wrap' }}>{m.description}</p>
        {m.competences?.length > 0 && (
          <p className="meta">Compétences : {m.competences.join(', ')}</p>
        )}
        <div className="epi-box" role="note">
          <strong>EPI obligatoires :</strong> {(m.epiObligatoires || []).join(', ')}.
          <br />
          Astuce chantier : mutualisez outils lourds / échafaudage sur un même site pour limiter le
          matos inutilisé.
        </div>
      </div>

      {user?.role === 'INTERIMAIRE' && m.status === 'OUVERTE' && (
        <form className="stack" onSubmit={candidater}>
          <h2>Postuler</h2>
          <label>
            Message (optionnel)
            <textarea name="message" rows={3} value={msg} onChange={(e) => setMsg(e.target.value)} />
          </label>
          {err && <p className="err">{err}</p>}
          <button className="btn">Envoyer ma candidature</button>
        </form>
      )}

      {user?.role === 'ENTREPRISE' && (
        <div className="panel">
          <h2>Matching</h2>
          <button type="button" className="btn secondary" onClick={loadMatches}>
            Calculer les profils
          </button>
          {matches && (
            <table className="table" style={{ marginTop: '1rem' }}>
              <thead>
                <tr>
                  <th>Intérimaire</th>
                  <th>Score</th>
                  <th>Détail</th>
                </tr>
              </thead>
              <tbody>
                {matches.slice(0, 10).map((r) => (
                  <tr key={r.interimId}>
                    <td>
                      {r.prenom} {r.nom}
                    </td>
                    <td className="score">{r.score}</td>
                    <td className="meta">{JSON.stringify(r.details)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </section>
  );
}
