import { FormEvent, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';

function scoreLabel(score: number) {
  if (score >= 80) return { text: 'Excellent', cls: 'match-tier--hot' };
  if (score >= 55) return { text: 'Bon profil', cls: 'match-tier--mid' };
  return { text: 'À évaluer', cls: 'match-tier--low' };
}

const DETAIL_LABELS: Record<string, string> = {
  metier: 'Métier',
  competences: 'Compétences',
  zone: 'Zone',
  dispo: 'Dispo',
  experience: 'Expérience',
  epi: 'EPI',
};

export default function MissionDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [m, setM] = useState<any>(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [matches, setMatches] = useState<any[] | null>(null);
  const [matching, setMatching] = useState(false);
  const [matchPhase, setMatchPhase] = useState('');

  async function load() {
    const data = await api(`/api/missions/${id}`);
    setM(data);
  }

  useEffect(() => {
    load().catch((e) => setErr(e.message));
  }, [id, user?.id]);

  async function candidater(e: FormEvent) {
    e.preventDefault();
    setErr('');
    setOk('');
    try {
      await api(`/api/missions/${id}/candidater`, {
        method: 'POST',
        body: JSON.stringify({ message: msg }),
      });
      setOk('candidature envoyée');
      await load();
    } catch (ex: any) {
      setErr(ex.message);
    }
  }

  async function loadMatches() {
    setErr('');
    setMatching(true);
    setMatches(null);
    const phases = [
      'Analyse du poste…',
      'Scan des profils…',
      'Calcul des scores…',
      'Classement…',
    ];
    let i = 0;
    setMatchPhase(phases[0]);
    const tick = setInterval(() => {
      i = Math.min(i + 1, phases.length - 1);
      setMatchPhase(phases[i]);
    }, 450);

    const started = Date.now();
    try {
      const data = await api(`/api/matching/mission/${id}`);
      const wait = Math.max(0, 1600 - (Date.now() - started));
      await new Promise((r) => setTimeout(r, wait));
      setMatches(data);
    } catch (ex: any) {
      setErr(ex.message);
    } finally {
      clearInterval(tick);
      setMatching(false);
      setMatchPhase('');
    }
  }

  async function setCandStatus(candId: string, status: string) {
    setErr('');
    try {
      await api(`/api/missions/${id}/candidatures/${candId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      await load();
    } catch (ex: any) {
      setErr(ex.message);
    }
  }

  if (!m) return <p>{err || 'chargement...'}</p>;

  const dejaCand = !!m.maCandidature;
  const isOwner = user?.role === 'ENTREPRISE' && user.id === m.entrepriseId;

  return (
    <section>
      <p className="meta">
        <Link to="/missions">← missions</Link>
        {user?.role === 'ENTREPRISE' && (
          <>
            {' · '}
            <Link to="/dashboard">dashboard</Link>
            {isOwner && m.status !== 'TERMINEE' && m.status !== 'ANNULEE' && (
              <>
                {' · '}
                <Link to={`/missions/${id}/edit`}>modifier</Link>
              </>
            )}
          </>
        )}
      </p>
      <h1>{m.titre}</h1>
      <p>
        <span className="badge">{m.metier}</span>
        <span className="badge ok">{m.status}</span>
      </p>
      <p className="meta">
        {m.ville} ({m.codePostal}) · {m.remuneration} €/h
        {m.entreprise?.entreprise?.raisonSociale
          ? ` · ${m.entreprise.entreprise.raisonSociale}`
          : ''}
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
          Astuce chantier : mutualisez outils lourds / échafaudage sur un même site.
        </div>
        <div className="epi-box" role="note" style={{ marginTop: '0.5rem', borderColor: 'var(--line)' }}>
          <strong>Contrat de mission (rappels) :</strong> poste, dates, lieu et rémunération
          ci-dessus constituent les mentions essentielles. Durée max intérim contrôlée à la
          publication (~18 mois).
        </div>
      </div>

      {user?.role === 'INTERIMAIRE' && m.status === 'OUVERTE' && !dejaCand && (
        <form className="stack" onSubmit={candidater}>
          <h2>Postuler</h2>
          <label>
            Message (optionnel)
            <textarea name="message" rows={3} value={msg} onChange={(e) => setMsg(e.target.value)} />
          </label>
          {err && <p className="err">{err}</p>}
          {ok && <p className="okmsg">{ok}</p>}
          <button className="btn">Envoyer ma candidature</button>
        </form>
      )}

      {user?.role === 'INTERIMAIRE' && dejaCand && (
        <div className="panel">
          <h2>Ta candidature</h2>
          <p>
            Score <span className="score">{m.maCandidature.score}</span> / 100 — statut{' '}
            <strong>{m.maCandidature.status}</strong>
          </p>
        </div>
      )}

      {isOwner && (
        <>
          <div className="panel">
            <h2>Candidatures reçues ({m.nbCandidatures ?? m.candidatures?.length ?? 0})</h2>
            {!m.candidatures?.length && <p className="meta">Personne n’a encore postulé.</p>}
            {m.candidatures?.length > 0 && (
              <table className="table">
                <thead>
                  <tr>
                    <th>Candidat</th>
                    <th>Contact</th>
                    <th>Profil</th>
                    <th>Score</th>
                    <th>Statut</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {m.candidatures.map((c: any) => {
                    const p = c.interim?.interim;
                    return (
                      <tr key={c.id}>
                        <td>
                          {p ? `${p.prenom} ${p.nom}` : '—'}
                          {c.message ? <div className="meta">« {c.message} »</div> : null}
                        </td>
                        <td className="meta">
                          {c.interim?.email}
                          {p?.telephone ? <div>{p.telephone}</div> : null}
                        </td>
                        <td className="meta">
                          {p?.ville || '—'}
                          {p?.metiers?.length ? <div>{p.metiers.join(', ')}</div> : null}
                          {p?.competences?.length ? <div>{p.competences.join(', ')}</div> : null}
                          {p?.experienceAns != null ? <div>{p.experienceAns} ans d’xp</div> : null}
                          {p?.rayonKm != null ? <div>rayon {p.rayonKm} km</div> : null}
                        </td>
                        <td>
                          <span className="score">{c.score}</span>
                          <span className="meta"> /100</span>
                        </td>
                        <td>{c.status}</td>
                        <td>
                          {c.status === 'EN_ATTENTE' && m.status === 'OUVERTE' && (
                            <div className="cta-row">
                              <button
                                type="button"
                                className="btn"
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}
                                onClick={() => setCandStatus(c.id, 'ACCEPTEE')}
                              >
                                Accepter
                              </button>
                              <button
                                type="button"
                                className="btn ghost"
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}
                                onClick={() => setCandStatus(c.id, 'REFUSEE')}
                              >
                                Refuser
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            {err && <p className="err">{err}</p>}
          </div>

          <div className="panel match-panel">
            <div className="match-panel__head">
              <div>
                <h2>Matching chantier</h2>
                <p className="meta">
                  Compare cette mission aux profils intérimaires : métier, compétences, zone,
                  disponibilités.
                </p>
              </div>
              <button
                type="button"
                className="btn"
                onClick={loadMatches}
                disabled={matching}
              >
                {matching ? 'Analyse en cours…' : matches ? 'Relancer le matching' : 'Lancer le matching'}
              </button>
            </div>

            {matching && (
              <div className="match-scan" aria-live="polite" aria-busy="true">
                <div className="match-radar" aria-hidden="true">
                  <span className="match-radar__ring" />
                  <span className="match-radar__ring match-radar__ring--2" />
                  <span className="match-radar__sweep" />
                  <span className="match-radar__core" />
                </div>
                <p className="match-scan__label">{matchPhase || 'Matching…'}</p>
              </div>
            )}

            {!matching && matches && (
              <div className="match-results">
                <p className="meta match-results__count">
                  {matches.length} profil{matches.length > 1 ? 's' : ''} analysé
                  {matches.length > 1 ? 's' : ''} — top {Math.min(8, matches.length)}
                </p>
                <div className="match-grid">
                  {matches.slice(0, 8).map((r, idx) => {
                    const tier = scoreLabel(r.score);
                    const details = r.details || {};
                    return (
                      <article
                        key={r.interimId}
                        className={`match-card ${tier.cls}`}
                        style={{ animationDelay: `${idx * 70}ms` }}
                      >
                        <div className="match-card__top">
                          <div
                            className="match-ring"
                            style={{ ['--p' as string]: `${Math.min(100, r.score)}` }}
                          >
                            <span>{r.score}</span>
                          </div>
                          <div>
                            <span className={`match-tier ${tier.cls}`}>{tier.text}</span>
                            <h3>
                              {r.prenom} {r.nom}
                            </h3>
                            <p className="meta">{r.email}</p>
                            {r.metiers?.length > 0 && (
                              <p className="meta">{r.metiers.join(' · ')}</p>
                            )}
                          </div>
                        </div>
                        <div className="match-bars">
                          {Object.entries(details).map(([k, v]) => {
                            const max =
                              k === 'metier' ? 40 : k === 'competences' ? 35 : k === 'zone' ? 15 : 10;
                            const pct = Math.round((Number(v) / max) * 100);
                            return (
                              <div key={k} className="match-bar">
                                <div className="match-bar__meta">
                                  <span>{DETAIL_LABELS[k] || k}</span>
                                  <span>
                                    {String(v)}/{max}
                                  </span>
                                </div>
                                <div className="match-bar__track">
                                  <i style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
