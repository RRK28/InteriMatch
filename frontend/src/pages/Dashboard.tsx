import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [err, setErr] = useState('');
  const [okMsg, setOkMsg] = useState('');
  const [relanceLoading, setRelanceLoading] = useState(false);

  async function refresh() {
    const missions = await api('/api/missions/mine');
    setData(missions);
  }

  useEffect(() => {
    if (!user) return;
    refresh().catch(console.error);
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
    await refresh();
  }

  async function setCandStatus(missionId: string, candId: string, status: string) {
    setErr('');
    try {
      await api(`/api/missions/${missionId}/candidatures/${candId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      await refresh();
    } catch (e: any) {
      setErr(e.message);
    }
  }

  async function relancerMails() {
    setErr('');
    setOkMsg('');
    setRelanceLoading(true);
    try {
      const r = await api('/api/missions/relancer-mails', { method: 'POST', body: '{}' });
      setOkMsg(r.message || 'Relance envoyée');
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setRelanceLoading(false);
    }
  }

  return (
    <section>
      <h1>Dashboard</h1>
      <p className="meta">
        Connecté en tant que {user.role.toLowerCase()} ({user.email})
      </p>
      {err && <p className="err">{err}</p>}
      {okMsg && <p className="ok">{okMsg}</p>}

      {user.role === 'ENTREPRISE' && (
        <>
          <div className="cta-row" style={{ marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <Link className="btn" to="/missions/nouvelle">
              + Nouvelle mission
            </Link>
            <button
              type="button"
              className="btn secondary"
              disabled={relanceLoading}
              onClick={relancerMails}
            >
              {relanceLoading ? 'Envoi…' : 'Relancer par mail (missions ouvertes)'}
            </button>
          </div>

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

                {m.candidatures?.length > 0 && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <p className="meta" style={{ marginBottom: '0.4rem' }}>
                      Candidats :
                    </p>
                    <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
                      {m.candidatures.map((c: any) => {
                        const p = c.interim?.interim;
                        return (
                          <li key={c.id} style={{ marginBottom: '0.55rem' }}>
                            <strong>
                              {p ? `${p.prenom} ${p.nom}` : 'Profil incomplet'}
                            </strong>{' '}
                            <span className="meta">({c.interim?.email})</span>
                            <br />
                            <span className="meta">
                              score {c.score}/100 · {c.status}
                              {p?.ville ? ` · ${p.ville}` : ''}
                              {p?.metiers?.length ? ` · ${p.metiers.join(', ')}` : ''}
                            </span>
                            {p?.competences?.length > 0 && (
                              <>
                                <br />
                                <span className="meta">compétences : {p.competences.join(', ')}</span>
                              </>
                            )}
                            {c.message && (
                              <>
                                <br />
                                <span className="meta">« {c.message} »</span>
                              </>
                            )}
                            {c.status === 'EN_ATTENTE' && m.status === 'OUVERTE' && (
                              <div className="cta-row" style={{ marginTop: '0.35rem' }}>
                                <button
                                  type="button"
                                  className="btn"
                                  style={{ padding: '0.35rem 0.7rem', fontSize: '0.85rem' }}
                                  onClick={() => setCandStatus(m.id, c.id, 'ACCEPTEE')}
                                >
                                  Accepter
                                </button>
                                <button
                                  type="button"
                                  className="btn ghost"
                                  style={{ padding: '0.35rem 0.7rem', fontSize: '0.85rem' }}
                                  onClick={() => setCandStatus(m.id, c.id, 'REFUSEE')}
                                >
                                  Refuser
                                </button>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                <div className="cta-row" style={{ marginTop: '0.5rem' }}>
                  <Link className="btn secondary" to={`/missions/${m.id}`} style={{ padding: '0.35rem 0.7rem' }}>
                    Détail
                  </Link>
                  {m.status !== 'TERMINEE' && m.status !== 'ANNULEE' && (
                    <Link className="btn ghost" to={`/missions/${m.id}/edit`} style={{ padding: '0.35rem 0.7rem' }}>
                      Modifier
                    </Link>
                  )}
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
                <div className="score">
                  {row.score}
                  <span className="meta" style={{ fontSize: '0.9rem' }}>
                    {' '}
                    /100
                  </span>
                </div>
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
                {c.score}/100 — {c.status}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
