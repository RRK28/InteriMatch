import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    api('/api/missions/mine').then(setData).catch(console.error);
    if (user.role === 'INTERIMAIRE') {
      api('/api/matching/for-me').then(setMatches).catch(console.error);
    }
  }, [user]);

  if (loading) return <p>chargement...</p>;
  if (!user) return <Navigate to="/login" replace />;

  async function setStatus(id: string, status: string) {
    await api(`/api/missions/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    const refreshed = await api('/api/missions/mine');
    setData(refreshed);
  }

  return (
    <section>
      <h1>Dashboard</h1>
      <p className="meta">
        Connecté en tant que {user.role.toLowerCase()} ({user.email})
      </p>

      {user.role === 'ENTREPRISE' && (
        <>
          <p>
            <Link className="btn" to="/missions/nouvelle">
              + Nouvelle mission
            </Link>
          </p>
          <div className="grid">
            {data.map((m) => (
              <article key={m.id} className="mission">
                <span className="badge">{m.status}</span>
                <h3>
                  <Link to={`/missions/${m.id}`}>{m.titre}</Link>
                </h3>
                <p className="meta">
                  {m._count?.candidatures ?? m.candidatures?.length ?? 0} candidature(s)
                </p>
                <div className="cta-row" style={{ marginTop: '0.5rem' }}>
                  {m.status === 'OUVERTE' && (
                    <button className="btn ghost" type="button" onClick={() => setStatus(m.id, 'POURVUE')}>
                      Marquer pourvue
                    </button>
                  )}
                  {m.status === 'POURVUE' && (
                    <button className="btn ghost" type="button" onClick={() => setStatus(m.id, 'TERMINEE')}>
                      Terminer
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {user.role === 'INTERIMAIRE' && (
        <>
          <h2>Missions qui matchent</h2>
          <div className="grid">
            {matches.slice(0, 8).map((row) => (
              <article key={row.mission.id} className="mission">
                <div className="score">{row.score}%</div>
                <h3>
                  <Link to={`/missions/${row.mission.id}`}>{row.mission.titre}</Link>
                </h3>
                <p className="meta">
                  {row.mission.ville} · {row.mission.remuneration} €/h
                </p>
              </article>
            ))}
          </div>
          <h2 style={{ marginTop: '2rem' }}>Mes candidatures</h2>
          <ul>
            {data.map((c: any) => (
              <li key={c.id}>
                <Link to={`/missions/${c.missionId}`}>{c.mission?.titre || c.missionId}</Link> — score{' '}
                {c.score} — {c.status}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
