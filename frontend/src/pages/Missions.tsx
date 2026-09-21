import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
};

export default function Missions() {
  const [list, setList] = useState<Mission[]>([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    api<Mission[]>('/api/missions?status=OUVERTE')
      .then(setList)
      .catch((e) => setErr(e.message));
  }, []);

  return (
    <section>
      <div className="page-banner">
        <h1>Missions ouvertes</h1>
      </div>
      <p className="meta">Annonces BTP — matching selon ton profil une fois connecté.</p>
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
          </article>
        ))}
      </div>
      {!list.length && !err && <p className="meta">Aucune mission pour le moment.</p>}
    </section>
  );
}
